/** the backend for our program */

// Server
import { createServer } from "node:https";
import next from "next";
import { Server } from "socket.io";

// Player
import Player from "./models/Player.js"

// Server
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

const players = {}

app.prepare().then(() => {
    const httpServer = createServer(handler);

    const io = new Server(httpServer);

    io.on("connection", (socket) => {
        console.log("a user connected");
        players[socket.id] = new Player(socket.id);
        socket.broadcast.emit("updatePlayers", (players));

        socket.on("disconnect", () => {
            console.log("user diconnected");
            console.log("Current players:", Object.keys(players));

            delete players[socket.id];
            socket.broadcast.emit("updatePlayers", (players));
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
