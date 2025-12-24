
export default class Player {
    
    #id;
    #name;


    constructor(id) {
        this.#id = id;
        this.#name = null;
        // DO THIS LATER
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
