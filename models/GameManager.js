import Room from "./Room.js";
import Game from "./Game.js";

import { generateRoomCode } from "../utils/roomCode.js"


export default class GameManager {
    #games = new Map();

    createGame(io) {

        // Code creation
        let roomCode;
        do {
            roomCode = generateRoomCode();
        } while (this.#games.has(roomCode));
        
        const game = new Game(roomCode, io);
        this.#games.set(roomCode, game);

        return game;
    }

    getGame(code) {
        return this.#games.get(code);
    }

    deleteGame(code) {
        this.#games.delete(code);
    }

    addPlayer(game, player) {
        if (!game) {
            return;
        }

        game.addPlayer(player);
    }

    removePlayer(roomCode, player) {
        const game = this.getGame(roomCode);
        if (!game) {
            return;
        }

        game.removePlayer(player);

        if (game.isEmpty()) {
            this.deleteGame(roomCode);
        }
    }
}
