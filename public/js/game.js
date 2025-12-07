import GameContext from "../game/context/GameContext.js";

document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        console.log("space hit");
        event.preventDefault();

        // Hide menu, show game
        document.getElementById("menu").classList.remove("active");
        document.getElementById("game").classList.add("active");

        // Start the game logic
        const game = new GameContext();
        
        game.setState("selection");
        
        game.handleInput("cardSelected"); // in selection
        game.handleInput("timeOut"); // Playing timed out
        game.handleInput("timeOut"); // Voting timed out
        game.handleInput("replay"); // back to thing
        game.handleInput("cardSelected"); // in selection
    }
});
