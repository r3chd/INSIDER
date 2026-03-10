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
            
            emitRoomToPlayers(createdGame);
        });

        // on room being joined by player
        socket.on("joinRoom", ({ roomCode, playerName }) => {
            const targetGame = gameManager.getGame(roomCode);
            console.log(targetGame.connectedPlayers);

            // check if player is already in room
            if (targetGame.connectedPlayers.has(socket.id)) {
                console.log("player already in room");
                return;
            }

            // create member player
            const player = new Player(socket, playerName, Roles.ROOM.MEMBER);

            // add player to room
            gameManager.addPlayer(targetGame, player)
            socket.join(roomCode);

            emitRoomToPlayers(targetGame);
        });

        function emitRoomToPlayers(game) {
            console.log("emitting room to players")

            game.connectedPlayers.forEach(player => {
                const socketId = player.id;
                const dto = game.toDTO(socket.id);

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

        // player disconnect
        socket.on("disconnect", () => {

            players.delete[socket.id];
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
