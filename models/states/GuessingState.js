import { GameState } from "./GameState.js";
import { getIo } from "../../io.js";
import Roles from "../../components/constants/rolesEnum.js";
export class GuessingState extends GameState {

    #currentPlayerIndex = 0;
    #lobbySize;

    #game;
    #duration = 18000; 
    #activePlayer;
    #wordFound = false;
    #timerExpirationRun = false;
    #timer;

    constructor(game) {
        super();
        this.#game = game;
        this.#lobbySize = this.#game.players.size;
    }

    enter() {
        console.log("entering guessing state");
        // Start timer
        let startTime = Date.now();
        // the client drives every phase off a single "stateChange" switch
        this.#game.emit("stateChange", {
            state: "guessing",
            data: {
                startTime: startTime,
                endTime: startTime + this.#duration
            }
        })

        // On timer running out
        const masterSocket = this.#game.masterPlayer.socket;


        this.#timer = setTimeout(() => {
            this.handleTimerExpired();
        }, this.#duration);

        // Remove preexisting socket attachment
        
        masterSocket.once("wordFound", () => {
            this.#wordFound = true;
            this.handleTimerExpired();
        })

        // Get the player
        const playerArr = [...this.#game.players.values()];

        // Alternate between players
        const handlePlayerTurn = () => {
            // TEMP may need some kind of check to authorise who is clicking the button
            // otherwise game could be manipulated.
            do {
                this.#currentPlayerIndex = (this.#currentPlayerIndex + 1) % this.#lobbySize;
            } while (playerArr[this.#currentPlayerIndex] === this.#game.masterPlayer);
            // Convert to player
            const nextPlayer = playerArr[this.#currentPlayerIndex];
            this.#activePlayer = nextPlayer; // for disabling
            // Emit to target player
            this.#game.emitToPlayer(nextPlayer.id, "showGuessButton", {
                text: "OK ITS ON ITS UP TO YOU",
                master: false
            });
            this.#game.emit("showGuesser", nextPlayer.id);

            nextPlayer.socket.once("nextTurn", handlePlayerTurn);
        }

        handlePlayerTurn();
        this.#game.emitToPlayer(this.#game.masterPlayer.id, "showGuessButton", {
            text: "They've got it!",
            master: true
        })

    }

    handleTimerExpired() {
        if (this.#timerExpirationRun) return;
        this.#timerExpirationRun = true;

        if (!this.#wordFound) {
            this.#game.wordFound = false;
        } else {
            this.#game.wordFound = true;
        }
        this.#game.nextState();
        console.log("GOING TO REVEAL STATE");
    }

    exit () {
        // reset variables here
        // stop the round timer from firing after we've moved on
        clearTimeout(this.#timer);
    }

}
