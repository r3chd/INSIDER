
import { GameState } from "./GameState.js";
import Roles from "../../components/constants/rolesEnum.js";
import TEXT from "../../components/constants/text.js";
import generateRandomWords from "../../utils/wordService.js";
import { getIo } from "../../io.js";
export class SetupState extends GameState {

    #duration = 3000;

    enter(game) {

        // Timer
        let generatedWords = generateRandomWords();

        // Set roles to each player
        this.assignRoles(game); 

        // Show the overlay to all players
        for (const player of game.players.values()) {
            let overlayMessage = null;
            let startTime = Date.now();
            switch(player.role) {
                case Roles.MASTER:
                    overlayMessage = TEXT.overlay.master;
                    break;
                case Roles.COMMONER:
                    overlayMessage = TEXT.overlay.commoner;
                    break;
                case Roles.INSIDER:
                    overlayMessage = TEXT.overlay.insider;
                    break;
            }

            game.emitToPlayer(player.id, "startSetupState", {
                words: player.role === Roles.MASTER ? generatedWords : [],
                overlayMessage: overlayMessage,
                masterPlayer: game.masterPlayer.name,
                startTime: startTime,
                endTime: startTime + this.#duration
            })

        }

        // --------------- WORD SELECTION --------------- //
        const masterSocket = game.masterPlayer.socket;

        let wordChosen = false;

        const handleTimerExpired = () => {
            if (!wordChosen) {
                const randomWord = generatedWords[Math.floor(Math.random() * generatedWords.length)];
                assignWord(randomWord);
            }
        }

        masterSocket.once("wordSelected", (word) => assignWord(word));
        masterSocket.once("timerExpired", handleTimerExpired)
        
        
        // Backup method
        this.timeoutId = setTimeout(() => {
            handleTimerExpired();
        }, this.#duration);

        function assignWord(word) {
            if (wordChosen) return;
            wordChosen = true;

            for (const player of game.players.values()) {
                if (player.role === Roles.MASTER || player.role === Roles.INSIDER) {
                    console.log("sending to ", player.role);
                    game.emitToPlayer(player.id, "wordAssigned", {
                        word: word
                    });
                }
            }
            // Assignment of words indicates start of next state
            game.nextState();
        }
    }
    
    
    assignRoles(game) {
        // Convert to array
        const playersArray = Array.from(game.players.values());
        
        // Random number selection
        let insider_num = -1;
        if (playersArray.size <= 2) {
            return; // Temporary break condition to prevent infinite loop.
        }
        do {
            insider_num = Math.floor(Math.random() * playersArray.length) // If 4 ppl; then [0-4)
        } while (insider_num === game.roundCount);

        // Role assignment
        for (let i = 0; i < playersArray.length; i++) {
            const player = playersArray[i];
            if (i === game.roundCount) {
                player.role = Roles.MASTER;
                game.masterPlayer = player;
            } else if (i === insider_num) {
                player.role = Roles.INSIDER;
            } else {
                player.role = Roles.COMMONER;
            }
            console.log(player.id);
            game.emitToPlayer(player.id, "roleAssigned", {
                role: player.role
            });
        }
    }


    exit(game) {
        // Reset variables for next round
        game.emit("hideOverlay");
    }
}
