import Roles from "../components/constants/rolesEnum.js";
import Game from "./Game.js";

export default class Room {

    #code = "";
    #connectedPlayers = new Map();
    #game = null;
    #hostPlayer;

    constructor(code) {
        this.#code = code; // 5 Digit alphanumeric string
        console.log(`room created with ${this.#code}`)
    }
    
    addPlayer(player) {
        this.#connectedPlayers.set(player.id, player);
        console.log(`player ${player.name}, ${player.id} added to ${this.#code}. they have role ${player.role}`)
        
        // set host player
        if (player.role === Roles.ROOM_LEADER) {
            this.#hostPlayer = player; // Distinguish from current role (e.g. master)
        }
    }

    removePlayer(player) {
        this.#connectedPlayers.delete(player.id);
    }

    hasPlayer(playerId) {
        return this.#connectedPlayers.has(playerId);
    }

    toDTO() {
        // setup roles by conversion
        const players = Array.from(this.#connectedPlayers.values()).map(p => ({
                id: p.id,
                name: p.name,
                role: p.role
            }))
        const hostPlayer = players.find(p => p.role === Roles.ROOM_LEADER);
        return {
            code: this.#code,
            players,
            hostId: hostPlayer ? hostPlayer.id : null
        }
    }


    get code() {
        return this.#code;
    }

    get connectedPlayers() {
        return this.#connectedPlayers;
    }

    start(io) {
        if (this.#game) return;
        this.#game = new Game(this.#code, io, this.#connectedPlayers, this.#hostPlayer);
        this.#game.start();
    }
}
