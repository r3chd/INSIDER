import { GameState } from "./GameState.js";

export class GuessingState extends GameState {

    #duration = 18000;
    enter(game) {
        console.log("entering guessing state");
        // Start timer

        let startTime = Date.now();
        game.emit("startGuessingState", 
            {
                startTime: startTime,
                endTime: startTime + this.#duration
            }
        )
        // enable button to first player that isn't master
        // when button is pressed move to the next guy
    }

    exit () {

    }

}
