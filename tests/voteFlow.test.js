import { test } from "node:test";
import assert from "node:assert/strict";

import Game from "../models/Game.js";
import Player from "../models/Player.js";
import Roles from "../components/constants/rolesEnum.js";
import { VoteState } from "../models/states/VoteState.js";

const fakeSocket = (id) => ({ id, emit() {}, once() {}, join() {} });

// A game already in VoteState, with roles assigned and every emit captured.
function makeVotingGame() {
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

  captured.length = 0;          // ignore role-assignment chatter
  game.setState(new VoteState(game)); // fires enter()
  return { game, captured };
}

// emit("stateChange", {state, data}) -> captured {event, data:{state, data}}
const lastResult = (captured) =>
  captured.filter((e) => e.event === "stateChange" && e.data.state === "result").at(-1)?.data.data;
const has = (captured, state) =>
  captured.some((e) => e.event === "stateChange" && e.data.state === state);

test("entering VoteState announces the vote phase", () => {
  const { game, captured } = makeVotingGame();
  assert.ok(has(captured, "vote"));
  game.state.exit();
});

test("clear majority on the insider -> citizens win", () => {
  const { game, captured } = makeVotingGame();
  game.handleClick("c1", "ins");
  game.handleClick("c2", "ins");
  game.handleClick("m", "c1");           // master vote for someone else
  game.state.handleTimerExpired();
  assert.equal(lastResult(captured).winningTeam, "citizens");
  game.state.exit();
});

test("clear majority on a commoner -> insider team wins", () => {
  const { game, captured } = makeVotingGame();
  game.handleClick("ins", "c1");
  game.handleClick("c2", "c1");
  game.state.handleTimerExpired();
  assert.equal(lastResult(captured).winningTeam, "insider");
  game.state.exit();
});

test("nobody voted -> insider team wins, no tiebreak", () => {
  const { game, captured } = makeVotingGame();
  game.state.handleTimerExpired();
  assert.equal(has(captured, "tiebreak"), false);
  assert.equal(lastResult(captured).winningTeam, "insider");
  game.state.exit();
});

test("a tie opens a Master-decides step instead of resolving immediately", () => {
  const { game, captured } = makeVotingGame();
  game.handleClick("c1", "ins");
  game.handleClick("c2", "c1");          // 1-1 tie between ins and c1
  game.state.handleTimerExpired();
  assert.ok(has(captured, "tiebreak"));
  assert.equal(lastResult(captured), undefined); // not resolved yet
  game.state.exit();
});

test("only the Master can break a tie, and their pick resolves the winner", () => {
  const { game, captured } = makeVotingGame();
  game.handleClick("c1", "ins");
  game.handleClick("c2", "c1");          // tie: ins vs c1
  game.state.handleTimerExpired();

  game.handleClick("c1", "ins");         // a non-master pick is ignored
  assert.equal(lastResult(captured), undefined);

  game.handleClick("m", "ins");          // master eliminates the insider
  assert.equal(lastResult(captured).winningTeam, "citizens");

  game.state.exit(); // clear pending timers so the test process can exit
});

test("resetGame returns everyone to the lobby and clears the round", () => {
  const { game, captured } = makeVotingGame();
  game.handleClick("c1", "ins");        // some votes on the board
  game.resetGame();                      // setState(Lobby) also clears the vote timer

  assert.equal(game.state.constructor.name, "LobbyState");
  assert.deepEqual(game.getTopVoteCandidates(), { candidates: [], maxVotes: 0 });
  assert.equal(game.connectedPlayers.get("ins").gameRole, Roles.UNDEFINED);
  assert.ok(has(captured, "lobby"));
  assert.ok(captured.some((e) => e.event === "roomUpdated"));
});

test("a tied candidate leaving collapses the tie to the survivor", () => {
  const { game, captured } = makeVotingGame();
  game.handleClick("c1", "ins");
  game.handleClick("c2", "c1");          // 1-1 tie between ins and c1
  game.state.handleTimerExpired();
  assert.ok(has(captured, "tiebreak"));

  game.removePlayer(game.connectedPlayers.get("c1"));

  // only ins is left standing, so they are the one voted out
  assert.equal(lastResult(captured).winningTeam, "citizens");
  game.state.exit();
});

test("one of three tied candidates leaving keeps the tie-break open", () => {
  const { game, captured } = makeVotingGame();
  game.handleClick("m", "ins");
  game.handleClick("ins", "c1");
  game.handleClick("c1", "c2");          // three-way 1-1-1 tie
  game.state.handleTimerExpired();
  assert.ok(has(captured, "tiebreak"));

  game.removePlayer(game.connectedPlayers.get("c2")); // 2 candidates left
  assert.equal(lastResult(captured), undefined, "still waiting on the Master");

  game.handleClick("m", "c2");           // the departed candidate is no longer pickable
  assert.equal(lastResult(captured), undefined);

  game.handleClick("m", "ins");          // Master picks from the survivors
  assert.equal(lastResult(captured).winningTeam, "citizens");
  game.state.exit();
});
