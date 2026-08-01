import { test } from "node:test";
import assert from "node:assert/strict";

import Game from "../models/Game.js";
import Player from "../models/Player.js";
import Roles from "../components/constants/rolesEnum.js";
import { GuessingState } from "../models/states/GuessingState.js";

// records once() handlers so tests can see who currently holds the "nextTurn" baton
const fakeSocket = (id) => {
  const handlers = {};
  return {
    id,
    emit() {},
    once(event, fn) { handlers[event] = fn; },
    fire(event) { const fn = handlers[event]; if (fn) { delete handlers[event]; fn(); } },
    has(event) { return Boolean(handlers[event]); },
    join() {}
  };
};

// the player currently holding the turn, per their socket's registered handler
const batonHolder = (game) =>
  [...game.connectedPlayers.values()].find((p) => p.socket.has("nextTurn"));

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

// regression: the "nextTurn" handler lived on the departed player's socket, so the
// round hung until the phase timer expired
test("the active guesser leaving hands the baton to a remaining player", () => {
  const { game } = makeGuessingGame();
  const active = batonHolder(game);
  assert.ok(active, "expected someone to hold the turn");

  game.removePlayer(active);

  const next = batonHolder(game);
  assert.ok(next, "the turn must not die with the departed player");
  assert.notEqual(next.id, active.id);
  assert.ok(game.connectedPlayers.has(next.id), "the baton must go to a player still in the room");
  game.state.exit();
});

test("a player who is not holding the turn leaving does not disturb the guesser", () => {
  const { game } = makeGuessingGame();
  const active = batonHolder(game);
  const bystander = [...game.connectedPlayers.values()]
    .find((p) => p.id !== active.id && p.id !== game.masterPlayer.id);

  game.removePlayer(bystander);

  assert.equal(batonHolder(game).id, active.id);
  game.state.exit();
});

test("a departed player is never dealt another turn", () => {
  const { game } = makeGuessingGame();
  const first = batonHolder(game);
  game.removePlayer(first);

  // cycle the turn through the remaining eligible players a few times over
  for (let i = 0; i < 6; i++) {
    const holder = batonHolder(game);
    assert.ok(holder, "turn order stalled");
    assert.notEqual(holder.id, first.id, "a departed player was dealt a turn");
    holder.socket.fire("nextTurn");
  }
  game.state.exit();
});

test("the Master is still skipped in the turn order after a departure", () => {
  const { game } = makeGuessingGame();
  game.removePlayer(batonHolder(game));

  for (let i = 0; i < 6; i++) {
    const holder = batonHolder(game);
    assert.ok(holder, "turn order stalled");
    assert.notEqual(holder.id, game.masterPlayer.id, "the Master must never guess");
    holder.socket.fire("nextTurn");
  }
  game.state.exit();
});

// when the departure also drops the room below MIN_PLAYERS, server.js resets the
// round immediately after — but onPlayerLeft runs first and must not throw
test("no eligible guesser left -> onPlayerLeft returns without throwing", () => {
  const { game } = makeGuessingGame();
  for (const p of [...game.connectedPlayers.values()]) {
    if (p.id !== game.masterPlayer.id) {
      assert.doesNotThrow(() => game.removePlayer(p));
    }
  }
  assert.equal(batonHolder(game), undefined);
  game.state.exit();
});
