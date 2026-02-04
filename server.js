/** the backend for our program */

// Server
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

// Player and room classes
import Player from "./models/Player.js"
import Room from "./models/Room.js"

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
            let roomCode;

            // enforce uniqueness
            do {
                roomCode = generateRoomCode();
            } while (rooms.has(roomCode))
            
            const room = new Room(roomCode);
            rooms.set(roomCode, room);

            // Make the player proper
            const player = new Player(socket.id, playerName);
            players.set(socket.id, player);


            // Interaction between the two
            room.addPlayer(player);
            socket.join(roomCode); // Set current connection to the roomCode
            
            console.log(`${roomCode} is made`);
        });

        // On room being joined
        socket.on("joinRoom", ({ roomCode, playerName }) => {
            const room = rooms.get(roomCode);
            if (!room) {
                console.log("room not found!")
                return;
            } else {
                console.log("room found!")
                room.printRoom();
            }

            if (room.connectedPlayers.has(socket.id)) {
                console.log("player already in room");
                return;
            }

            const player = new Player(socket.id, playerName);
            console.log(`this ${player.name}, ${player.id} is attempting ${roomCode}`);
            
            room.addPlayer(player)
            socket.join(roomCode);

            io.to(roomCode).emit("playersUpdated", room.toDTOPlayers());
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
