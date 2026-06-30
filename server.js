/** the backend for our program */

// server imports
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import Roles from './components/constants/rolesEnum.js';
import{ setIo } from "./io.js";
import { MIN_PLAYERS } from "./components/constants/gameParam.js";


// player room and classes
import Player from "./models/Player.js"
import GameManager from "./models/GameManager.js";

// server setup
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// used to track all players
const players = new Map();

const gameManager = new GameManager();

// app needs to be 'prepared' before handling requests
app.prepare().then(() => {

    // server initialization
    const httpServer = createServer(handler);
    const io = new Server(httpServer);
    setIo(io);

    // socket connection
    io.on("connection", (socket) => {

        // initialize player name
        let playerName = "";

        // need this to know which room the player is in for disconnects
        let currentRoomCode = null;

        // console.log code
        socket.on("console", (data) => {
            console.log(data);
        });


        // on room being created
        socket.on("createRoom", (playerName) => {
            
            // create game
            const createdGame = gameManager.createGame(io);

            // properly initialise player with name and socket
            const player = new Player(socket, playerName, Roles.ROOM.LEADER);
            
            players.set(socket.id, player);
            gameManager.addPlayer(createdGame, player)

            socket.join(createdGame.code); // set current connection to the roomCode
            currentRoomCode = createdGame.code;

            emitRoomToPlayers(createdGame);
        });

        // on room being joined by player
        socket.on("joinRoom", ({ roomCode, playerName }) => {
            // normalise: codes are generated/stored uppercase, lookup is case-sensitive
            const code = (roomCode ?? "").trim().toUpperCase();
            const targetGame = gameManager.getGame(code);

            // no dont exist: tell the joiner instead of letting them into a non-existent room
            if (!targetGame) {
                socket.emit("joinError", { reason: "room_not_found", code });
                return;
            }

            // check if player is already in room
            if (targetGame.connectedPlayers.has(socket.id)) {
                console.log("player already in room");
                return;
            }

            // create member player
            const player = new Player(socket, playerName, Roles.ROOM.MEMBER);

            // add player to room
            players.set(socket.id, player);
            gameManager.addPlayer(targetGame, player)
            socket.join(code);
            currentRoomCode = code;

            emitRoomToPlayers(targetGame);

            console.log(targetGame.connectedPlayers);
        });

        function emitRoomToPlayers(game) {
            console.log("emitting room to players")

            game.connectedPlayers.forEach(player => {
                const socketId = player.id;
                const dto = game.toDTO(socketId);
                console.log(dto);

                io.to(socketId).emit("roomUpdated", dto)
            })

        }

        // on start button pressed
        socket.on("startGame", (roomCode) => {
            const gameToStart = gameManager.getGame(roomCode);
            if (!gameToStart) return;
            const count = gameToStart.connectedPlayers.size;
            if (count < MIN_PLAYERS) {
                socket.emit("startGameError", { reason: "not_enough_players", min: MIN_PLAYERS });
                return;
            }
            gameToStart.start();
        })

        // LET IT RIDE
        socket.on("playAgain", (roomCode) => {
            const game = gameManager.getGame((roomCode ?? "").trim().toUpperCase());
            if (!game || game.hostId !== socket.id) return;
            game.playAgain();
        });

        // reset game to lobby
        socket.on("returnToLobby", (roomCode) => {
            const game = gameManager.getGame((roomCode ?? "").trim().toUpperCase());
            if (!game || game.hostId !== socket.id) return;
            game.resetGame();
        });

        // player disconnect
        socket.on("disconnect", () => {
            players.delete(socket.id);

            // socket never joined room or room was already deleted
            if (!currentRoomCode) return;
            const game = gameManager.getGame(currentRoomCode);
            if (!game) return;

            // find the player in the game
            const player = game.connectedPlayers.get(socket.id);
            if (!player) return;

            // end if player leaving had an giga role
            const endRound = game.wasCriticalRole(player);

            // slime them out
            gameManager.removePlayer(currentRoomCode, player);

            // room was reclaimed so no need to emit to players
            if (!gameManager.getGame(currentRoomCode)) return;

            if (endRound) {
                // reset if important role left
                game.resetGame();
            } else {
                // just refresh the roster (and any newly promoted host) for everyone left
                emitRoomToPlayers(game);
            }
        })

        socket.on("playerClicked", (data) => {

            console.log(data.clickingPlayer, "has clicked on", data.clickedPlayer, "in room", data.room);

            // need to check gamestate
            // handling the vote
            const game = gameManager.getGame(data.room);

            game.handleClick(data.clickingPlayer, data.clickedPlayer);
        })
    });

    // error handling
    httpServer.once("error", (err) => {
        console.error(err);
        process.exit(1);
    })
    .listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
