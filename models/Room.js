import Roles from "../components/constants/rolesEnum.js";
import Game from "./Game.js";

export default class Room {

    #code = "";
    #connectedPlayers = new Map();

    constructor(code) {
        this.#code = code; // 5 Digit alphanumeric string
        console.log(`room created with ${this.#code}`)
    }
    
    addPlayer(player) {
        this.#connectedPlayers.set(player.id, player);
        console.log(`player ${player.name}, ${player.id} added to ${this.#code}. they have role ${player.role}`)
    }

    removePlayer(player) {
        this.#connectedPlayers.delete(player.id);

    }

    hasPlayer(playerId) {
        return this.#connectedPlayers.has(playerId);
    }

    toDTO() {
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

    printRoom() {
        console.log(`Room: ${this.#code}`);
        if (this.#connectedPlayers.size === 0) {
            console.log(" No players located in this room");
            return;
        }

        for (const player of this.#connectedPlayers.values()) { // done as a map
            console.log(` - ${player.name} (ID: ${player.id})`);
        }

    }

    get code() {
        return this.#code;
    }

    get connectedPlayers() {
        return this.#connectedPlayers;
    }

    start() {
        const game = new Game(this.#code);
    }
}
