import SelectionState from "../states/SelectionState.js";
import PlayingState from "../states/PlayingState.js";
import VotingState from "../states/VotingState.js";
import GameOverState from "../states/GameOverState.js";

export default class GameContext {
    constructor() {
        this.states = {
            selection: new SelectionState(),
            playing: new PlayingState(),
            voting: new VotingState(),
            gameOver: new GameOverState()
        }

        Object.values(this.states).forEach(state => state.context = this);

        this.state = null;
    }

    setState(name) {
        this.state = this.states[name]; // get from dict
        this.state.enter(); // runs default entry for each of the states
    }

    handleInput(input) {
        this.state.handleInput(input);
    }

    update() {
        this.state.update();
    }
}
