import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

import Player from "./models/Player.js"

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
        console.log("Current players:", Object.keys(players));

        players[socket.id] = new Player(socket.id);
        socket.emit("updatePlayers", (players));

        socket.on("disconnect", () => {
            console.log("user diconnected");
            console.log("Current players:", Object.keys(players));

            delete players[socket.id];
            socket.emit("updatePlayers", (players));
        })

        
    });

    httpServer.once("error", (err) => {
        console.error(err);
        process.exit(1);
    })
    .listen(port, () => {
        console.log(`> Ready on https://${hostname}:${port}`);
    });
});
