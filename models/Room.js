export default class Room {

    constructor(code, currentPlayer) {
        this._code = code;
        this._connectedPlayers = [];
        this._test = "aorisentaroisten";

        this.addPlayer(currentPlayer);
    }
    
    addPlayer(playerId) {
        this._connectedPlayers.push(playerId);
    }

    get connected() {
        return this._connectedPlayers;
    }

    get test() {
        return this._test;
    }
}