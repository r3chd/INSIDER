// for socket
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// for directory
const path = require('path');

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')))

// Default route: serve game.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'))
});

io.on('connection', (socket) => {
    console.log('a user connected')
})

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
});
