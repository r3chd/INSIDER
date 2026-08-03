export class GameState {
    enter(game) {}
    exit(game) {}
    onPlayerAction(game, socket, data) {}
    onPlayerLeft(player) {}
    // true once this state has already resolved a terminal outcome (e.g. VoteState.finish()).
    // lets Game know a later departure isn't a round-ending event anymore.
    isRoundOver() { return false; }
}
