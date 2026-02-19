import { GameState } from "./GameState.js";

export class RevealState extends GameState {
    #game;
    #duration = 5000;

    constructor(game) {
        super();
        this.#game = game;
    }
    
    enter () {
        let startTime = Date.now()
        this.#game.emit("startRevealState",  {
                success: this.#game.wordFound,
                word: this.#game.targetWord,
                startTime: startTime,
                endTime: startTime + this.#duration
            }
        );

        setTimeout(() => {
            this.handleTimerExpired();
        }, this.#duration)

    }

    handleTimerExpired() {
        this.#game.nextState(); 
        // considering that all states have the setTimeout into handletimerexpired pattern
        // there's definitely some way to reduce the repetition.
    }

    exit () {
        this.#game.emit("hideOverlay");
    }
}
