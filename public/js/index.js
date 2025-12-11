import GameContext from "../game/context/GameContext.js";
import Player from "./classes/Player.js";

const socket = io();

const players = {};

// update players when they join for the front end, adding them to players list
socket.on('playerUpdate', (backendPlayers) => {
    for (const id in backendPlayers) {
        if (!players[id]) {
            players[id] = new Player(id);
        }
    }

    // delete players that don't exist in the backend anymore
    for (const id in players) {
        if (!backendPlayers[id]) {
            delete players[id]
        }
    }

    // FOR DEBUGGING
    console.log(players);
});

// display information relating to players
setInterval(function () {
      // ...
      document.getElementById("player-list").innerText = `Players: ${Object.keys(players).length}`;

  }, 1000);

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
