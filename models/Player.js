
export default class Player {
    
    #id = null;
    #name = "";


    constructor(id, name) {
        this.#id = id;
        this.#name = name;
    }

    set name(name) {
        this.#name = name;
    }

    get id() {
        return this.#id;
    }

    get name() {
        return this.#name;
    }
}
