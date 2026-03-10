
import { GameState } from "./GameState.js";
import Roles from "../../components/constants/rolesEnum.js";
import TEXT from "../../components/constants/text.js";
import generateRandomWords from "../../utils/wordService.js";
import { getIo } from "../../io.js";
export class SetupState extends GameState {

    #duration = 3000;
    #game;

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
        setTimeout(() => {
            this.handleTimerExpired();
        }, this.#duration);

        
    }

    handleTimerExpired() {
        if (this.#wordChosen) return; // no need to run as word has chosen
        const randomWord = this.#generatedWords[Math.floor(Math.random() * this.#generatedWords.length)];
        this.assignWord(randomWord);
    }
    
    assignRoles() {
        // Convert to array
        const playersArray = Array.from(this.#game.connectedPlayers.values());
        
        // Random number selection
        let insider_num = -1;
        if (playersArray.size <= 2) {
            return; // Temporary break condition to prevent infinite loop.
        }
        do {
            insider_num = Math.floor(Math.random() * playersArray.length) // If 4 ppl; then [0-4)
        } while (insider_num === this.#game.roundCount);

        // Role assignment
        for (let i = 0; i < playersArray.length; i++) {
            const player = playersArray[i];
            if (i === this.#game.roundCount) {
                player.gameRole = Roles.GAME.MASTER;
                this.#game.masterPlayer = player;
            } else if (i === insider_num) {
                player.gameRole = Roles.GAME.INSIDER;
            } else {
                player.gameRole = Roles.GAME.COMMONER;
            }
        }

        for (let i = 0; i < playersArray.length; i++) {
            const player = playersArray[i];
            this.#game.emitToPlayer(player.id, "roleAssigned", {
                gameRole: player.gameRole,          // only send their own role
                masterId: this.#game.masterPlayer.id // send master id for everyone
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
        // Reset variables for next round

        // Need to disable socket
        this.#game.emit("hideOverlay");
    }
}
