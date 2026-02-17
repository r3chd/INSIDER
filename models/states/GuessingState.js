import { GameState } from "./GameState.js";
import { getIo } from "../../io.js";
import Roles from "../../components/constants/rolesEnum.js";
export class GuessingState extends GameState {

    #currentPlayerIndex = 0;
    #lobbySize;
    #duration = 18000;
    #activePlayer;

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
        // Get the player

        this.#lobbySize = game.players.size;
        const playerArr = [...game.players.values()];

        const handlePlayerTurn = () => {
            // TEMP may need some kind of check to authorise who is clicking the button
            // otherwise game could be manipulated.
            do {
                this.#currentPlayerIndex = (this.#currentPlayerIndex + 1) % this.#lobbySize;
            } while (playerArr[this.#currentPlayerIndex] === game.masterPlayer);
            // Convert to player
            const nextPlayer = playerArr[this.#currentPlayerIndex];
            this.#activePlayer = nextPlayer; // for disabling
            // Emit to target player
            game.emitToPlayer(nextPlayer.id, "showButton", {
                text: "OK ITS ON ITS UP TO YOU",
                master: false
            });

            nextPlayer.socket.once("nextTurn", handlePlayerTurn);
        }

        handlePlayerTurn();
        game.emitToPlayer(game.masterPlayer.id, "showButton", {
            text: "They've got it!",
            master: true
        })
        // Cycling works


        // on the player hitting the button
        // update their ui to hide the button
        // emit to the next player the button

        // end condition occurs when the master hits their button, or when time expires

    }


    exit () {
        if (this.#activePlayer) {
            this.#activePlayer.socket.off("nextTurn", handlePlayerTurn);
        }
    }

}
