export default class Room {

    #code = "";
    #connectedPlayers = new Map();

    constructor(code) {
        this.#code = code; // 5 Digit alphanumeric string
        console.log(`room created with ${this.#code}`)
    }
    
    addPlayer(player) {
        this.#connectedPlayers.set(player.id, player);
        console.log(`player ${player.name}, ${player.id} added to ${this.#code}`)
    }

    removePlayer(playerId) {
        this.#connectedPlayers.delete(playerId);

    }

    hasPlayer(playerId) {
        return this.#connectedPlayers.has(playerId);
    }

    toDTOCode() { // Function converts to JSON for front end
        return {
            roomCode: this.#code,
        };
    }

    toDTOPlayers() {
        return {
            players: Array.from(this.#connectedPlayers.values()).map(p => ({
                id: p.id,
                name: p.name
            }))
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

    get connectedPlayers() {
        return this.#connectedPlayers;
    }
}
