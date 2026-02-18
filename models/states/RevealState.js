import { GameState } from "./GameState.js";

export class RevealState extends GameState {
    enter (game) {
        game.emit("handleRevealState", game.wordFound);
    }

    exit (game) {

    }
}