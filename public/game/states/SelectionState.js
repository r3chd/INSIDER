import State from "./State.js"


export default class SelectionState extends State {
    enter() {
        console.log("Entered Selection State");
    }

    handleInput(input) {
        if (input === "cardSelected" || input === "timeOut") {
            console.log("Starting game...");
            this.context.setState("playing");
        }
    }
}