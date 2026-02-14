import { GameState } from "./GameState.js";
import { getIo } from "../../io.js";
import Roles from "../../components/constants/rolesEnum.js";
export class GuessingState extends GameState {

    #currentPlayerIndex = 0;
    #lobbySize;
    #duration = 18000;
    enter(game) {

        const io = getIo();

        console.log("entering guessing state");
        // Start timer
        let startTime = Date.now();
        game.emit("startGuessingState", 
            {
                startTime: startTime,
                endTime: startTime + this.#duration
            }
        )
        // Get the player

        this.#lobbySize = game.players.size;
        const playerArr = [...game.players.values()];
        
        // TEMP there is some way to write this better i swear
        if (playerArr[this.#currentPlayerIndex].role === Roles.MASTER) {
            this.#currentPlayerIndex = this.#currentPlayerIndex += 1 % this.#lobbySize;
        }
        // Also probably a good idea to put the current master as the host of a room for some reason
        // I think itd be easier to control
        game.emitToPlayer(playerArr[this.#currentPlayerIndex].id, "showButton", {
            text: "OK ITS ON ITS UP TO YOU"
        });
    }


    exit () {

    }

}
