/** the backend for our program */

// Server
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import Roles from './components/constants/rolesEnum.js';

// Player and room classes
import Player from "./models/Player.js"
import Room from "./models/Room.js"
import RoomManager from "./models/RoomManager.js";

// Roomcode
import { generateRoomCode } from "./utils/roomCode.js";

// Server
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// used to track all players
const players = new Map();
const rooms = new Map();

const roomManager = new RoomManager

app.prepare().then(() => {

    const httpServer = createServer(handler);
    const io = new Server(httpServer);

    io.on("connection", (socket) => {

        // Set player and current player
        let playerName = "";

        // Print actively connected
        console.log("a user connected");
        
        // Console.log code
        socket.on("console", (data) => {
            console.log(data);
        });


        // On room being created
        socket.on("createRoom", (playerName) => {
            
            const createdRoom = roomManager.createRoom();
            const roomCode = createdRoom.code;
            // Make the player proper
            const player = new Player(socket.id, playerName);
            
            // Player manager?
            player.role = Roles.ROOM_LEADER;
            players.set(socket.id, player);

            // Interaction between the two
            roomManager.addPlayer(createdRoom, player)

            socket.join(roomCode); // Set current connection to the roomCode
            
            console.log(`${roomCode} is made`);
            io.to(roomCode).emit("roomUpdated", createdRoom.toDTO());
        });

        // On room being joined
        socket.on("joinRoom", ({ roomCode, playerName }) => {
            const targetRoom = roomManager.getRoom(roomCode);
            if (!targetRoom) {
                console.log("room not found!")
                return;
            } else {
                console.log("room found!")
            }

            if (targetRoom.connectedPlayers.has(socket.id)) {
                console.log("player already in room");
                return;
            }

            const player = new Player(socket.id, playerName);
            player.role = Roles.ROOM_MEMBER;
            console.log(`this ${player.name}, ${player.id} is attempting ${roomCode}`);
            
            roomManager.addPlayer(targetRoom, player)
            socket.join(roomCode);
            // Need to update this somehow
            console.log(targetRoom.toDTO());
            io.to(roomCode).emit("roomUpdated", targetRoom.toDTO());
        })

        // On start button pressed

        socket.on("startGame", (roomCode) => {
            const startingRoom = roomManager.getRoom(roomCode)
            startingRoom.start();
        
        })


        // DISCONNECT CODE
        socket.on("disconnect", () => {

            delete players[socket.id];
        })
    });

    httpServer.once("error", (err) => {
        console.error(err);
        process.exit(1);
    })
    .listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
