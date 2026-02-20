import Roles from '../components/constants/rolesEnum.js';

export default class Player {
    
    #id = null; // text of the socket
    #name = "";
    #role = Roles.UNDEFINED;
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

    set role(role) {
        this.#role = role;
    }

    get id() {
        return this.#id;
    }

    get name() {
        return this.#name;
    }

    get role() {
        return this.#role;
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
