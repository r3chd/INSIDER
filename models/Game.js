import { socket } from "../socket.js"
import { LobbyState } from "./states/LobbyState.js";
import { SetupState } from "./states/SetupState.js";
import { GuessingState } from "./states/GuessingState.js";
import { RevealState } from "./states/RevealState.js"
import { VoteState } from "./states/VoteState.js";

export default class Game {
    #code;
    #io = null;
    #players;
    #started = false;
    #state = null;
    #roundCount;
    #targetWord;
    #masterPlayer; // Current leader of round
    #wordFound;

    
    constructor(code, io) {
        this.#code = code;
        this.#io = io;
        this.#state = new LobbyState(this);
        // this.#roundCount = this.#players.size - 1; // 0 index
        this.#targetWord = "not yet chosen"; // TEMP
    }

    start(connectedPlayers) {
        if (this.#started) return;
        this.#started = true;

        this.#players = connectedPlayers
        this.#roundCount = this.#players.size - 1; // 0 index
        this.emit("gameStarted");
        this.nextState(); // move from lobby to setup
    }
    

    setState(newState) {
        this.#state?.exit?.();
        this.#state = newState;
        this.#state.enter();
    }

    nextState() {
        console.log("next stated")
        if (this.#state instanceof LobbyState) {
            this.setState(new SetupState(this));
        } else if (this.#state instanceof SetupState) {
            this.setState(new GuessingState(this));
        } else if (this.#state instanceof GuessingState) {
            this.setState(new RevealState(this));
        } else if (this.#state instanceof RevealState) {
            this.setState(new VoteState(this));
        }

    }

    emit(event, data) { // To a room - everyone should know
        if (data === undefined) {
            this.#io.to(this.#code).emit(event); // Where data is not necessary
            return;
        }
        
        this.#io.to(this.#code).emit(event, data);
    }

    emitToPlayer(socketId, event, data) { // To a person - only they should know
        if (data === undefined) {
            this.#io.to(socketId).emit(event); // Where data is not necessary
            return;
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

    get targetWord() {
        return this.#targetWord;
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

    get state() {
        return this.#state;
    }
}
