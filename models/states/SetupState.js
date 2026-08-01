
import { GameState } from "./GameState.js";
import Roles from "../../components/constants/rolesEnum.js";
import TEXT from "../../components/constants/text.js";
import generateRandomWords from "../../utils/wordService.js";
import { getIo } from "../../io.js";
export class SetupState extends GameState {

    #duration = 10000;
    #game;
    #timer;

    #generatedWords;
    #wordChosen = false;


    constructor(game) {
        super();
        this.#game = game;
        console.log(game);
    }

    enter() {
        // Timer
        this.#generatedWords = generateRandomWords();

        // Set roles to each player
        this.assignRoles(); 

        // Show the overlay to all players
        for (const player of this.#game.connectedPlayers.values()) {
            let overlayMessage = null;
            let startTime = Date.now();
            switch(player.gameRole) {
                case Roles.GAME.MASTER:
                    overlayMessage = TEXT.overlay.master;
                    break;
                case Roles.GAME.COMMONER:
                    overlayMessage = TEXT.overlay.commoner;
                    break;
                case Roles.GAME.INSIDER:
                    overlayMessage = TEXT.overlay.insider;
                    break;
            }
      
            this.#game.emitToPlayer(player.id, "stateChange", {
                state: "setup",
                data: {
                    words: player.gameRole === Roles.GAME.MASTER ? this.#generatedWords : [],
                    overlayMessage: overlayMessage,
                    masterPlayer: this.#game.masterPlayer.name,
                    startTime: startTime,
                    endTime: startTime + this.#duration
                }
            })

        }

        // --------------- WORD SELECTION --------------- //
        const masterSocket = this.#game.masterPlayer.socket;

        masterSocket.once("wordSelected", (word) => this.assignWord(word));
        // Backup method in instance of timeout
        this.#timer = setTimeout(() => {
            this.handleTimerExpired();
        }, this.#duration);


    }

    handleTimerExpired() {
        if (this.#wordChosen) return; // no need to run as word has chosen
        const randomWord = this.#generatedWords[Math.floor(Math.random() * this.#generatedWords.length)];
        this.assignWord(randomWord);
    }
    
    assignRoles() {
        const playersArray = Array.from(this.#game.connectedPlayers.values());
        if (playersArray.length < 2) return; // need a Master plus at least one other

        // Master rotates by id; never null while players remain
        const master = this.#game.nextMaster();
        master.gameRole = Roles.GAME.MASTER;
        this.#game.masterPlayer = master;

        // insider: uniform pick among the non-Master players (no rejection loop)
        const eligible = playersArray.filter(p => p.id !== master.id);
        const insider = eligible[Math.floor(Math.random() * eligible.length)];

        for (const player of eligible) {
            player.gameRole = player.id === insider.id ? Roles.GAME.INSIDER : Roles.GAME.COMMONER;
        }

        for (const player of playersArray) {
            this.#game.emitToPlayer(player.id, "roleAssigned", {
                gameRole: player.gameRole,          // only send their own role
                masterId: master.id                 // send master id for everyone
            });
        }
    }

    assignWord(word) {
        if (this.#wordChosen) return;
        this.#wordChosen = true;

        this.#game.targetWord = word;

        for (const player of this.#game.connectedPlayers.values()) {
            if (player.gameRole === Roles.GAME.MASTER || player.gameRole === Roles.GAME.INSIDER) {
                console.log("sending to ", player.gameRole);
                this.#game.emitToPlayer(player.id, "wordAssigned", {
                    word: word
                });
            }
        }
        // Assignment of words indicates start of next state
        this.#game.nextState();
        console.log("GOING TO GUESSING STATE")
    }

    exit() {
        // reset variables for next round

        // reset timer
        clearTimeout(this.#timer);

        // Need to disable socket
        this.#game.emit("hideOverlay");
    }
}
