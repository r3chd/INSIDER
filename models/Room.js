export default class Room {

    #code;
    #connectedPlayers;

    constructor(code) {
        this.#code = code; // 5 Digit alphanumeric string
        this.#connectedPlayers = new Set(); // Holds player models
    }
    
    addPlayer(playerId) {
        this.#connectedPlayers.add(playerId);
    }

    get connectedPlayers() {
        return this.#connectedPlayers;
    }
    
    get code() {
        return this.#code;
    }
}
