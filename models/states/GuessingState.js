import { GameState } from "./GameState.js";

export class GuessingState extends GameState {

    #game;
    #duration = 18000;
    #activeGuesserId = null;
    #previousGuesserId = null;
    #wordFound = false;
    #timerExpirationRun = false;
    #timer;

    constructor(game) {
        super();
        this.#game = game;
    }

    enter() {
        console.log("entering guessing state");
        const startTime = Date.now();
        // the client drives every phase off a single "stateChange" switch
        this.#game.emit("stateChange", {
            state: "guessing",
            data: {
                startTime: startTime,
                endTime: startTime + this.#duration
            }
        });

        this.#timer = setTimeout(() => {
            this.handleTimerExpired();
        }, this.#duration);

        const masterSocket = this.#game.masterPlayer.socket;
        masterSocket.once("wordFound", () => {
            this.#wordFound = true;
            this.handleTimerExpired();
        });

        this.#passTurnTo(this.#nextEligible(null));

        this.#game.emitToPlayer(this.#game.masterPlayer.id, "showGuessButton", {
            text: "They've got it!",
            master: true
        });
    }

    // live read of the roster: next non-Master player after `afterId`, wrapping.
    // null when nobody is eligible (everyone but the Master has left).
    #nextEligible(afterId) {
        const eligible = [...this.#game.players.values()]
            .filter(p => p.id !== this.#game.masterPlayer?.id);
        if (eligible.length === 0) return null;

        const i = eligible.findIndex(p => p.id === afterId); // -1 wraps to index 0
        return eligible[(i + 1) % eligible.length];
    }

    #passTurnTo(player) {
        if (!player) return;
        this.#previousGuesserId = this.#activeGuesserId;
        this.#activeGuesserId = player.id;

        // TEMP may need some kind of check to authorise who is clicking the button
        // otherwise game could be manipulated.
        this.#game.emitToPlayer(player.id, "showGuessButton", {
            text: "OK ITS ON ITS UP TO YOU",
            master: false
        });
        this.#game.emit("showGuesser", player.id);

        player.socket.once("nextTurn", () => {
            this.#passTurnTo(this.#nextEligible(this.#activeGuesserId));
        });
    }

    // only matters if the leaver held the turn: their "nextTurn" handler died with
    // their socket, so nothing else would ever advance the round
    onPlayerLeft(player) {
        if (player.id !== this.#activeGuesserId) return;

        // resume from the player before them so the turn order is preserved
        const next = this.#nextEligible(this.#previousGuesserId);
        if (!next) return; // round is about to be reset by shouldEndRound
        this.#passTurnTo(next);
    }

    handleTimerExpired() {
        if (this.#timerExpirationRun) return;
        this.#timerExpirationRun = true;

        this.#game.wordFound = this.#wordFound;
        this.#game.nextState();
        console.log("GOING TO REVEAL STATE");
    }

    exit() {
        // stop the round timer from firing after we've moved on
        clearTimeout(this.#timer);
    }
}
