import { GameState } from "./GameState.js";

export class SetupState extends GameState {

    #game;
    constructor(game) {
        this.#game = game;    
    }

    enter() {
        // Assign roles
        // Select random word specifically for the main guy

    }

    exit () {

    }

    handleEvent(event) {
        // this.game.setState(new );
    }
}
