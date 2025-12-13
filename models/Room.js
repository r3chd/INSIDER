export default class Room {

    #code;
    #connectedPlayers;

    constructor(code, currentPlayer) {
        this.#code = code;
        this.#connectedPlayers = [];

        this.addPlayer(currentPlayer);
    }
    
    addPlayer(playerId) {
        this.#connectedPlayers.push(playerId);
    }

    get connected() {
        return this.#connectedPlayers;
    }

}