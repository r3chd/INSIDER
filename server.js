/** the backend for our program */

// Server
import { createServer } from "node:https";
import next from "next";
import { Server } from "socket.io";

// Player and room
import Player from "./models/Player.js"
import Room from "./models/Room.js"

// Server
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

const players = {};
const rooms = {};

app.prepare().then(() => {
    const httpServer = createServer(handler);

    const io = new Server(httpServer);

    io.on("connection", (socket) => {
        console.log("a user connected");
        players[socket.id] = new Player(socket.id);
        const currentPlayer = players[socket.id];
        console.log("currentPlayer:", currentPlayer.id)

        socket.emit("updatePlayers", (players));

        socket.on("console", (string) => {
            console.log(string);
        });


        // ROOM CODE
        socket.on("joinRoom", (roomCode) => {
            socket.join(roomCode);
            console.log(`this ${currentPlayer.id} has joined ${roomCode}`);
            
            
            rooms[roomCode] = new Room(roomCode, currentPlayer);
            const currentRoom = rooms[roomCode];

            console.log("existing rooms:", Object.keys(rooms));

            socket.emit("updateRoom", (currentRoom))
        })


        // DISCONNECT CODE
        socket.on("disconnect", () => {
            console.log("user diconnected");
            console.log("Current players:", Object.keys(players));

            delete players[socket.id];
            socket.emit("updatePlayers", (players));
        })

        console.log("Current players:", Object.keys(players));
    });

    httpServer.once("error", (err) => {
        console.error(err);
        process.exit(1);
    })
    .listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
