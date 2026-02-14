import { GameState } from "./GameState.js";
import { getIo } from "../../io.js";
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

        const playersArr = Array.from(game.players.values());
        const playerCount = playersArr.length;

        let canGuess = true;
        while (canGuess) {
            let guessingIndex = 0;

            if (playersArr[guessingIndex].role === Roles.MASTER) {
                guessingIndex++;
                continue;
            } else {
                game.emitToPlayer(player.id, "youAreGuessing", {
                    text: "text"
                })
            }
        }

        // emit to ONE person the button
        console.log(game.players.values());
        

        // enable button to first player that isn't master
        // when button is pressed move to the next guy
    }

    exit () {

    }

}
