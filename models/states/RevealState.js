import { GameState } from "./GameState.js";
import { TIMERS } from "../../components/constants/gameParam.js";

export class RevealState extends GameState {
    #game;
    #duration = TIMERS.REVEAL;
    #timer;

    constructor(game) {
        super();
        this.#game = game;
    }
    
    enter () {
        let startTime = Date.now()
        this.#game.emit("stateChange",  {
            state: "reveal",
            data: {
                success: this.#game.wordFound,
                word: this.#game.targetWord,
                startTime: startTime,
                endTime: startTime + this.#duration}
            }
        );

        this.#timer = setTimeout(() => {
            this.handleTimerExpired();
        }, this.#duration)

    }

    handleTimerExpired() {
        this.#game.nextState(); 
        // considering that all states have the setTimeout into handletimerexpired pattern
        // there's definitely some way to reduce the repetition.
    }

    exit () {
        // reset timer
        clearTimeout(this.#timer);
        this.#game.emit("hideOverlay");
    }
}
