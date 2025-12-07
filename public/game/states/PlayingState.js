import State from "./State.js"


export default class PlayingState extends State {
    enter() {
        console.log("Entered PlayingState State");
    }

    handleInput(input) {
        if (input === "timeOut") {
            console.log("ending main game...");
            this.context.setState("voting");
        }
    }
}
