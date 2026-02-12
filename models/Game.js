import { socket } from "../socket.js"
import { SetupState } from "./states/SetupState.js";


export default class Game {
    #code;
    #io = null;
    #players;
    #started = false;
    #state;
    #roundCount;
    #targetWord;

    constructor(code, io, players) { // add #io to constructor
        this.#code = code;
        this.#players = players;
        this.#io = io;
        this.#state = new SetupState();
        this.#roundCount = this.#players.size - 1; // 0 index
    }

    start() {
        if (this.#started) return;
        this.#started = true;

        this.#io.to(this.#code).emit("gameStarted");
        this.#state.enter(this);
    }
    

    setState(newState) {
        this.state.exit?.();
        this.state = newState;
        this.state.enter();
    }

    handleEvent(event, payload) {
        this.state.handleEvent?.(event, payload);
    }

    emit(event, data) { // To a room - everyone should know
        this.#io.to(this.#code).emit(event, data);
    }

    emitToPlayer(socketId, event, data) { // To a person - only they should know
        this.#io.to(socketId).emit(event, data);
    }

    get players() {
        return this.#players;
    }

    get roundCount() {
        return this.#roundCount;
    }

    set targetWord(targetWord){
        this.#targetWord = targetWord;
    }
}
