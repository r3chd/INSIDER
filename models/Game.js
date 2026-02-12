import { socket } from "../socket.js"
import { SetupState } from "./states/SetupState.js";
import { getIo } from "../io.js";


export default class Game {
    #code = "";
    #state = null;
    #io = null;

    constructor(code) { // add #io to constructor
        this.#code = code;
        this.#state = this.setState(new SetupState(this));
        this.#io = getIo();


        

        // start the game
        
        this.#io.to(this.#code).emit("gameStarted"); // In here or in broadcast?
    }

    setState(newState) {
        this.state.exit?.();
        this.state = newState;
        this.state.enter();
    }

    handleEvent(event, payload) {
        this.state.handleEvent?.(event, payload);
    }

    broadcast(event, payload) {
        // this.io.to(this.#code).emit(event, payload)
    }
}