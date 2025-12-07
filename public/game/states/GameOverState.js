import State from "./State.js"


export default class GameOverState extends State {
    enter() {
        console.log("Entered Gameoverstate State");
    }

    handleInput(input) {
        if (input === "replay") {
            console.log("starting anew");
            this.context.setState("selection");
        }
    }
}
