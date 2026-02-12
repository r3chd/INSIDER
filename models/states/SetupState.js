import { GameState } from "./GameState.js";
import Roles from "../../components/constants/rolesEnum.js";

import generateRandomWords from "../../utils/wordService.js";
import { getIo } from "../../io.js";
export class SetupState extends GameState {

    enter(game) {
        const masterPlayer = this.assignRoles(game); // roles assigned
        // show three options to master
        
        game.emitToPlayer(masterPlayer.id, "showRandomWords", {
            words: generateRandomWords()
        });

        const io = getIo();
        const masterSocket = io.sockets.sockets.get(masterPlayer.id);
        console.log(masterPlayer.id);
        console.log(masterSocket);

        masterSocket.once("wordSelected", (word) => {
            for (const player of game.players.values()) {
                if (player.role === Roles.MASTER || player.role === Roles.INSIDER) {
                    console.log("sending to ", player.role);
                    game.emitToPlayer(player.id, "wordAssigned", {
                        word: word
                    });
                }
            }
        });


        for (const [socketId, player] of game.players) {
            console.log(socketId);
            console.log(player.name);
            console.log(player.role);
            console.log(game.roundCount);
        }
        // Assign roles by game.players
        // emit things
        // Select random word specifically for the main guy
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
        let masterPlayer = null;

        for (let i = 0; i < playersArray.length; i++) {
            const player = playersArray[i];
            if (i === game.roundCount) {
                player.role = Roles.MASTER;
                console.log("player set to master");
                masterPlayer = player;    
            } else if (i === insider_num) {
                player.role = Roles.INSIDER;
                console.log("player set to master");
            
            } else {
                player.role = Roles.COMMONER;
                console.log("player set to commoner");
            }
            console.log(player.id);
            game.emitToPlayer(player.id, "roleAssigned", {
                role: player.role
            });
        }
        return masterPlayer;
    }


    exit (game) {

    }
}
