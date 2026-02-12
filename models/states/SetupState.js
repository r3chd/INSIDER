import { GameState } from "./GameState.js";
import Roles from "../../components/constants/rolesEnum.js";

import getRandomWord from "../../utils/wordService.js";

export class SetupState extends GameState {

    enter(game) {
        this.assignRoles(game);
        const randomWord = getRandomWord();
        game.targetWord = getRandomWord();
        console.log(game.targetWord);
        for (const player of game.players.values()) {
            if (player.role === Roles.MASTER || player.role === Roles.INSIDER) {
                console.log("sending to ", player.role);
                game.emitToPlayer(player.id, "wordAssigned", {
                    word: randomWord
                });
            }
        }


        return;
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

        console.log(game.players);
        const playersArray = Array.from(game.players.values());

        let insider_num = -1;
        if (playersArray.size <= 2) {
            return; // Temporary break condition to prevent infinite loop.
        }
        do {
            insider_num = Math.floor(Math.random() * playersArray.length) // If 4 ppl; then [0-4)
        } while (insider_num === game.roundCount);

        for (let i = 0; i < playersArray.length; i++) {
            const player = playersArray[i];
            if (i === game.roundCount) {
                player.role = Roles.MASTER;
                console.log("player set to master");
                
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
        console.log(playersArray);

    }


    exit (game) {

    }

    handleEvent(event) {
        // this.game.setState(new );
    }
}
