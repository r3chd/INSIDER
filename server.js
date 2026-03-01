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
import RoomManager from "./models/RoomManager.js";

// server setup
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// used to track all players
const players = new Map();

const roomManager = new RoomManager;

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

        // debugging check connection 
        console.log("a user connected");
        
        // console.log code
        socket.on("console", (data) => {
            console.log(data);
        });


        // on room being created
        socket.on("createRoom", (playerName) => {
            
            // create room
            const createdRoom = roomManager.createRoom();
            const roomCode = createdRoom.code;
            
            // properly initialise player with name and socket
            const player = new Player(socket, playerName);
            
            // create room leader player
            player.role = Roles.ROOM_LEADER;
            players.set(socket.id, player);

            // interaction between the two
            roomManager.addPlayer(createdRoom, player)

            socket.join(roomCode); // set current connection to the roomCode
            
            // debugging 
            console.log(`${roomCode} is made`);
        });

        // on room being joined by player
        socket.on("joinRoom", ({ roomCode, playerName }) => {
            const targetRoom = roomManager.getRoom(roomCode);
            if (!targetRoom) {
                console.log("room not found!")
                return;
            } else {
                console.log("room found!")
            }

            // check if player is already in room
            if (targetRoom.connectedPlayers.has(socket.id)) {
                console.log("player already in room");
                return;
            }

            // create member player
            const player = new Player(socket, playerName);
            player.role = Roles.ROOM_MEMBER;
            console.log(`this ${player.name}, ${player.id} is attempting ${roomCode}`);

            // add player to room
            roomManager.addPlayer(targetRoom, player)
            socket.join(roomCode);
            // need to update this somehow
        });

        function emitRoomToPlayers(room) {
            for (const player of room.connectedPlayers.values()) {
                const playerSocket = player.socket;
                if (!playerSocket) continue;
                playerSocket.emit("roomUpdated", room.toDTO(player.id));
            }
        }

        // on start button pressed
        socket.on("startGame", (roomCode) => {
            const startingRoom = roomManager.getRoom(roomCode);
            if (!startingRoom) return;
            const count = startingRoom.connectedPlayers.size;
            if (count < MIN_PLAYERS) {
                socket.emit("startGameError", { reason: "not_enough_players", min: MIN_PLAYERS });
                return;
            }
            startingRoom.start(io);
        })

        // player disconnect
        socket.on("disconnect", () => {

            delete players[socket.id];
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
