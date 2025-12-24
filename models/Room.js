export default class Room {

    #code;
    #connectedPlayers;

    constructor(code) {
        this.#code = code; // 5 Digit alphanumeric string
        this.#connectedPlayers = []; // Holds player models
    }
    
    addPlayer(playerId) {
        this.#connectedPlayers.push(playerId);
    }

    get connected() {
        return this.#connectedPlayers;
    }
    
    get code() {
        return this.#code;
    }
}
