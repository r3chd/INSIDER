export default class Room {

    constructor(code, currentPlayer) {
        this._code = code;
        this._connected = currentPlayer;
        this._test = "aorisentaroisten";
    }
    ''
    get connected() {
        return this._connected;
    }

    get test() {
        return this._test;
    }
}