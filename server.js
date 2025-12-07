import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();


const players = {};

app.prepare().then(() => {
    const httpServer = createServer(handler);

    const io = new Server(httpServer);

    io.on("connection", (socket) => {
        console.log('user connected')
        players[socket.id] = { /* store player data here */ }

        io.emit('playerUpdate', players)

        socket.on("disconnect", (reason) => {
            console.log("user disconnected");
            delete players[socket.id]
            io.emit('playerUpdate', players)
        })

    });

    httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });

});
