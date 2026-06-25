import { GameState } from "./GameState.js"

export class VoteState extends GameState {
    #game;
    #duration = 18000; // main voting window
    #tieDuration = 15000; // how long the Master has to break a tie (this is temp we'll probs make it a revote afterwards)

    #voteTimer;
    #tieTimer;
    #tieCandidates = null; // non-null while waiting on the Master to break a tie
    #finished = false;

    constructor(game) {
        super();
        this.#game = game;
    }

    enter() {
        this.#game.clearVotes(); // reset vote state for all players
        const startTime = Date.now();
        this.#game.emit("stateChange", {
            state: "vote",
            data: {
                startTime,
                endTime: startTime + this.#duration
            }
        });
        this.#voteTimer = setTimeout(() => this.handleTimerExpired(), this.#duration);
    }

    // routed here from Game.handleClick while this state is active
    onClick(from, to) {
        if (this.#finished) return;

        if (this.#tieCandidates) {
            // only Master decides in tie-break for tied players
            if (from === this.#game.masterPlayer?.id && this.#tieCandidates.includes(to)) {
                this.finish(to);
            }
            return;
        }

        this.#game.votePlayer(from, to);
    }

    handleTimerExpired() {
        const { candidates, maxVotes } = this.#game.getTopVoteCandidates();

        if (maxVotes === 0 || candidates.length === 0) {
            this.finish(null); // nobody voted -> insider team wins
        } else if (candidates.length === 1) {
            this.finish(candidates[0]); // clear leader is voted out
        } else {
            this.startTieBreak(candidates); // tie -> Master decides
        }
    }

    startTieBreak(candidates) {
        this.#tieCandidates = candidates;
        const startTime = Date.now();
        this.#game.emit("stateChange", {
            state: "tiebreak",
            data: {
                candidates,
                masterId: this.#game.masterPlayer?.id ?? null,
                startTime,
                endTime: startTime + this.#tieDuration
            }
        });
        // Master ran out of time -> null -> insider team wins
        this.#tieTimer = setTimeout(() => this.finish(null), this.#tieDuration);
    }

    finish(votedOutId) {
        if (this.#finished) return;
        this.#finished = true;
        clearTimeout(this.#voteTimer);
        clearTimeout(this.#tieTimer);

        const winningTeam = this.#game.resolveWinner(votedOutId);
        const insider = this.#game.insiderPlayer;

        this.#game.emit("stateChange", {
            state: "result",
            data: {
                winningTeam, // "insider" | "citizens"
                votedOutId: votedOutId ?? null,
                insiderId: insider?.id ?? null,
                insiderName: insider?.name ?? null
            }
        });
        // terminal: the game stays here until the host plays again / returns to lobby
    }

    exit() {
        clearTimeout(this.#voteTimer);
        clearTimeout(this.#tieTimer);
    }
}
