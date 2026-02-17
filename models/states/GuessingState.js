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

        let currentPlayer = null;

        const handlePlayerTurn = () => {
            if ('a' !== 'a') { // change condition soon
                return;
            }
            // Get sequential non master player index
            do {
                this.#currentPlayerIndex = (this.#currentPlayerIndex + 1) % this.#lobbySize;
            } while (playerArr[this.#currentPlayerIndex] === game.masterPlayer);
            // Convert to player
            currentPlayer = playerArr[this.#currentPlayerIndex];
            this.#activePlayer = currentPlayer; // for disabling
            // Emit to target player
            game.emitToPlayer(currentPlayer.id, "showButton", {
                text: "OK ITS ON ITS UP TO YOU"
            });

            currentPlayer.socket.once("nextTurn", handlePlayerTurn);
        }

        handlePlayerTurn();
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
