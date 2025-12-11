import State from "./State.js"


export default class VotingState extends State {
    enter() {
        console.log("Entered Voting State");
    }

    handleInput(input) {
        if (input === "timeOut") {
            console.log("going to reveal result game...");
            this.context.setState("gameOver");
        }
    }
}
