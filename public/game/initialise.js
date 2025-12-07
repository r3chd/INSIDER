import GameContext from "./context/GameContext.js";

export function startGame() {
    const game = new GameContext();

    game.setState("selection");

    game.handleInput("cardSelected"); // in selection
    game.handleInput("timeOut"); // Playing timed out
    game.handleInput("timeOut"); // Voting timed out
    game.handleInput("replay"); // back to thing
    game.handleInput("cardSelected"); // in selection
}
