import { GameState } from "./GameState.js";
import { getIo } from "../../io.js";
import Roles from "../../components/constants/rolesEnum.js";
export class GuessingState extends GameState {

    #currentPlayerIndex = 0;
    #lobbySize;
    #duration = 18000;
    #activePlayer;
    #wordFound = false;

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

        // On timer running out
        const masterSocket = game.masterPlayer.socket;

        setTimeout(() => {
            handleTimerExpired();
        }, this.#duration);

        // Remove preexisting socket attachment
        masterSocket.off("timerExpired", handleTimerExpired); // Clear preexisting
        masterSocket.once("timerExpired", handleTimerExpired);
        
        masterSocket.once("wordFound", () => {
            this.#wordFound = true;
            handleTimerExpired();
        })

        // Get the player
        this.#lobbySize = game.players.size;
        const playerArr = [...game.players.values()];

        // Alternate between players
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

    }

    handleTimerExpired() {
        if (!this.#wordFound) {
            game.wordFound = false;
        } else {
            game.wordFound = true;
        }
        game.nextState();
        console.log("GOING TO REVEAL STATE");
    }

    exit () {
    
        // Reset variables here
        // if (this.#activePlayer) {
        //     this.#activePlayer.socket.off("nextTurn", handlePlayerTurn);
        // }
    }

}
