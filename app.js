// for socket
import express from "express";
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, 
  {pingInterval: 2000, pingTimeout: 5000});

// for directory
const path = require('path');

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')))

// Default route: serve game.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
});

const players = {}

io.on('connection', (socket) => {
    players[socket.id] = { /* store player data here */ }

    io.emit('playerUpdate', players)

    socket.on('disconnect', (reason) => {
        console.log('user disconnected:', reason)
        delete players[socket.id]
        io.emit('playerUpdate', players)
    })

    console.log(players)
})


const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
});
