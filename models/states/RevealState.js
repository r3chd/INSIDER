import { GameState } from "./GameState.js";

export class RevealState extends GameState {
    enter (game) {
        console.log("reveal state has been entered");
        game.emit("startRevealState", game.wordFound);
    }

    exit (game) {

    }
}
