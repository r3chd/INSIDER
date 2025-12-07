import { startGame } from "../game/initialise.js";

document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        console.log("space hit");
        event.preventDefault();

        // Hide menu, show game
        document.getElementById("menu").classList.remove("active");
        document.getElementById("game").classList.add("active");

        // Start the game logic
        startGame();
    }
});
