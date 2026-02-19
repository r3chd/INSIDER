import { GameState } from "./GameState.js";

export class RevealState extends GameState {
    #game;
    #duration = 5000;

    constructor(game) {
        super();
        this.#game = game;
    }
    
    enter () {
        this.#game.emit("startRevealState",  {
            success: this.#game.wordFound,
            word: this.#game.targetWord
        }
        );
    }

    exit () {

    }
}
