import { socket } from "../socket.js"

export default class Game {
    #code = "";

    constructor(code) {
        this.#code = code;


        // start the game

        io.to(code).emit("gameStarted")
    }
}