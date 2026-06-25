import { test } from "node:test";
import assert from "node:assert/strict";

import Game from "../models/Game.js";
import Player from "../models/Player.js";
import Roles from "../components/constants/rolesEnum.js";
import { GuessingState } from "../models/states/GuessingState.js";

const fakeSocket = (id) => ({ id, emit() {}, once() {}, join() {} });

// A game freshly entered into GuessingState, with roles assigned and every emit
// captured. Mirrors makeVotingGame() in voteFlow.test.js. The io mock's to()
// ignores its target, so both broadcast emit() and targeted emitToPlayer() land
// in the same `captured` array.
function makeGuessingGame() {
  const captured = [];
  const io = { to: () => ({ emit: (event, data) => captured.push({ event, data }) }) };
  const game = new Game("ABCDE", io);

  const roles = { m: Roles.GAME.MASTER, ins: Roles.GAME.INSIDER, c1: Roles.GAME.COMMONER, c2: Roles.GAME.COMMONER };
  Object.keys(roles).forEach((id, i) => {
    game.addPlayer(new Player(fakeSocket(id), id, i === 0 ? Roles.ROOM.LEADER : Roles.ROOM.MEMBER));
  });
  for (const [id, role] of Object.entries(roles)) {
    game.connectedPlayers.get(id).gameRole = role;
    if (role === Roles.GAME.MASTER) game.masterPlayer = game.connectedPlayers.get(id);
  }

  captured.length = 0;                 // ignore role-assignment chatter
  game.setState(new GuessingState(game)); // fires enter()
  return { game, captured };
}

const emitsOf = (captured, event) => captured.filter((e) => e.event === event);

// the client (Game.jsx) drives every phase off a single "stateChange" switch
test("entering GuessingState announces the guessing phase via stateChange", () => {
  const { game, captured } = makeGuessingGame();
  assert.ok(
    captured.some((e) => e.event === "stateChange" && e.data.state === "guessing"),
    "expected a stateChange event with state 'guessing'"
  );
  game.state.exit();
});

// the active (non-master) player needs the button to pass the turn on
test("the active guesser is shown the pass-the-turn button", () => {
  const { game, captured } = makeGuessingGame();
  const guesserButtons = emitsOf(captured, "showGuessButton").filter((e) => e.data.master === false);
  assert.ok(
    guesserButtons.length >= 1,
    "expected a showGuessButton with master:false for the active player"
  );
  game.state.exit();
});

// the Master gets their own "they've got it" button
test("the Master is shown their own guess button", () => {
  const { game, captured } = makeGuessingGame();
  const masterButtons = emitsOf(captured, "showGuessButton").filter((e) => e.data.master === true);
  assert.ok(
    masterButtons.length >= 1,
    "expected a showGuessButton with master:true for the master"
  );
  game.state.exit();
});
