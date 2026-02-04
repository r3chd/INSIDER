import Roles from '../components/constants/rolesEnum.js';

export default class Player {
    
    #id = null;
    #name = "";
    #role = Roles.UNDEFINED;

    constructor(id, name) {
        this.#id = id;
        this.#name = name;
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
}
