// this is gonna be a rough one as this requires the player display to ACTUALLY BE GOOD
import { GameState } from "./GameState.js"

export class VoteState extends GameState {
    #game;
    #duration = 18000;

    constructor(game) {
        super();
        this.#game = game;
    }

    enter() {
        let startTime = Date.now()
        this.#game.emit("startVoteState", {
            startTime: startTime,
            endTime: startTime + this.#duration
        }) 
    }
}
