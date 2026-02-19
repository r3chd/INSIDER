import { socket } from "../socket.js"
import { SetupState } from "./states/SetupState.js";
import { GuessingState } from "./states/GuessingState.js"
import { RevealState } from "./states/RevealState.js"

export default class Game {
    #code;
    #io = null;
    #players;
    #started = false;
    #state;
    #roundCount;
    #targetWord;
    #hostPlayer; // Created the lobby
    #hostPlayerSocket;
    #masterPlayer; // Current leader of round
    #wordFound;

    
    constructor(code, io, players, hostPlayer) { // add #io to constructor
        this.#code = code;
        this.#players = players;
        this.#io = io;
        this.#state = new SetupState(this);
        this.#roundCount = this.#players.size - 1; // 0 index
        this.#targetWord = "not yet chosen"; // TEMP

        this.#hostPlayer = hostPlayer;


    }

    start() {
        if (this.#started) return;
        this.#started = true;

        this.#io.to(this.#code).emit("gameStarted");
        this.#state.enter();
    }
    

    setState(newState) {
        this.#state.exit?.();
        this.#state = newState;
        this.#state.enter();
    }

    nextState() {
        if (this.#state instanceof SetupState) {
            this.setState(new GuessingState(this));
        } else if (this.#state instanceof GuessingState) {
            this.setState(new RevealState(this));
        }
    }

    emit(event, data) { // To a room - everyone should know
        if (data === undefined) {
            this.#io.to(this.#code).emit(event); // Where data is not necessary
        }
        
        this.#io.to(this.#code).emit(event, data);
    }

    emitToPlayer(socketId, event, data) { // To a person - only they should know
        if (data === undefined) {
            this.#io.to(socketId).emit(event); // Where data is not necessary
        }
        
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

    set masterPlayer(masterPlayer) {
        this.#masterPlayer = masterPlayer;
    }

    get masterPlayer() {
        return this.#masterPlayer;
    }

    set wordFound(wordFound) {
        this.#wordFound = wordFound;
    }

    get wordFound() {
        return this.#wordFound;
    }
}
