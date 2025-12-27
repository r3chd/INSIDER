/** the backend for our program */

// Server
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

// Player and room
import Player from "./models/Player.js"
import Room from "./models/Room.js"

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
let currentRoom;

app.prepare().then(() => {

    const httpServer = createServer(handler);
    const io = new Server(httpServer);

    io.on("connection", (socket) => {

        // Set player and current player
        players[socket.id] = new Player(socket.id);
        const currentPlayer = players[socket.id];

        // Print actively connected
        console.log("a user connected");
        console.log("currentPlayer:", currentPlayer.id)
        
        // Console.log code
        socket.on("console", (data) => {
            console.log(data);
        });

        // On player name set
        socket.on("setPlayerName", (name) => {
            currentPlayer.name = name;
        });


        // On room being created
        socket.on("createRoom", () => {
            let roomCode;

            // enforce uniqueness
            do {
                roomCode = generateRoomCode();
            } while (rooms.has(roomCode))
            
            const room = new Room(roomCode);


            socket.join(roomCode);
            currentRoom = room;
            room.addPlayer(currentPlayer);
            // set key to roomCode, and room as the object
            rooms[roomCode] = room;

            console.log(roomCode);
            socket.emit("setRoomCode", roomCode);
        });

        // On room being joined
        socket.on("joinRoom", (roomCode) => {
            console.log(`this ${currentPlayer.id} has joined ${roomCode}`);
            
            if (!rooms[roomCode]) {
                console.log("room does not exist!"); // Update frontend code needed
            } else {
                socket.join(roomCode);
                currentRoom = rooms[roomCode];

                rooms[roomCode].addPlayer(currentPlayer);


                console.log("existing rooms:", Object.keys(rooms));

                socket.emit("setRoomCode", roomCode)
                io.to(roomCode).emit("updatePlayers", (currentRoom.connectedPlayers))
            }

        })


        // DISCONNECT CODE
        socket.on("disconnect", () => {

            delete players[socket.id];
            io.emit("updatePlayers", (currentRoom.connectedPlayers));
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
