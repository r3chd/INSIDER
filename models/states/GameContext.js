export class GameContext {

    constructor(roomCode, io) {
        this.roomCode = roomCode;
        this.io = io;
        this.state = null;
    }

    startGame(socket) {
        if (this.state) return;

        this.state = "PLAYING"; // Placeholder
        this.io.to(this.roomCode).emit("gameStarted");

    }

}
