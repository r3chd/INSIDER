import Roles from '../components/constants/rolesEnum.js';

export default class Player {
    
    #id = null; // text of the socket
    #name = "";
    #roomRole = Roles.UNDEFINED
    #gameRole = Roles.UNDEFINED;
    #socket = null; // socket itself
    #votes = 0;

    constructor(socket, name) {
        this.#id = socket.id;
        this.#name = name;
        this.#socket = socket;
    }

    set name(name) {
        this.#name = name;
    }

    set gameRole(gameRole) {
        this.#gameRole = gameRole;
    }

    set roomRole(roomRole) {
        this.#roomRole = roomRole;
    }

    get id() {
        return this.#id;
    }

    get name() {
        return this.#name;
    }

    get gameRole() {
        return this.#gameRole;
    }

    get roomRole() {
        return this.#roomRole;
    }

    get socket() {
        return this.#socket;
    }

    set votes(vote) {
        this.#votes = vote
    }

    get votes() {
        return this.#votes;
    }
}
