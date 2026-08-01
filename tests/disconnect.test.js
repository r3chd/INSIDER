import { test } from "node:test";
import assert from "node:assert/strict";

import Game from "../models/Game.js";
import GameManager from "../models/GameManager.js";
import Player from "../models/Player.js";
import Roles from "../components/constants/rolesEnum.js";
import { MIN_PLAYERS } from "../components/constants/gameParam.js";
import { RevealState } from "../models/states/RevealState.js";

// minimal io stub so Game.emit / emitToPlayer don't blow up
const fakeIo = { to: () => ({ emit() {} }) };
const fakeSocket = (id) => ({ id, emit() {}, once() {}, join() {} });

// Build a lobby game; the first id becomes the room LEADER (host).
function makeRoom(ids) {
  const game = new Game("ABCDE", fakeIo);
  ids.forEach((id, i) => {
    const roomRole = i === 0 ? Roles.ROOM.LEADER : Roles.ROOM.MEMBER;
    game.addPlayer(new Player(fakeSocket(id), id, roomRole));
  });
  return game;
}

test("isEmpty is false with players and true once everyone leaves", () => {
  const game = makeRoom(["a", "b"]);
  assert.equal(game.isEmpty(), false);
  game.removePlayer(game.connectedPlayers.get("a"));
  game.removePlayer(game.connectedPlayers.get("b"));
  assert.equal(game.isEmpty(), true);
});

test("a non-host leaving shrinks the roster and keeps the same host", () => {
  const game = makeRoom(["host", "b", "c"]);
  game.removePlayer(game.connectedPlayers.get("c"));
  assert.equal(game.connectedPlayers.size, 2);
  assert.equal(game.hasPlayer("c"), false);
  assert.equal(game.hostId, "host");
});

test("the host leaving promotes the next remaining player to host", () => {
  const game = makeRoom(["host", "b", "c"]);
  game.removePlayer(game.connectedPlayers.get("host"));
  assert.equal(game.connectedPlayers.size, 2);
  assert.equal(game.hostId, "b"); // next remaining player by insertion order
  assert.equal(game.connectedPlayers.get("b").roomRole, Roles.ROOM.LEADER);
});

test("a voter leaving removes the vote they cast from the tally", () => {
  const game = makeRoom(["host", "b", "c"]);
  game.votePlayer("b", "c");    // b -> c  (c: 1)
  game.votePlayer("host", "c"); // host -> c  (c: 2)
  assert.equal(game.getTopVoteCandidates().maxVotes, 2);

  game.removePlayer(game.connectedPlayers.get("b")); // b's vote should drop
  assert.deepEqual(game.getTopVoteCandidates(), { candidates: ["c"], maxVotes: 1 });
});

test("wasCriticalRole flags the Master and Insider but not Commoners or lobby players", () => {
  const game = makeRoom(["host", "b", "c", "d"]);
  // lobby: no game roles assigned yet
  assert.equal(game.wasCriticalRole(game.connectedPlayers.get("host")), false);

  // assign roles as SetupState would
  game.connectedPlayers.get("host").gameRole = Roles.GAME.MASTER;
  game.connectedPlayers.get("b").gameRole = Roles.GAME.INSIDER;
  game.connectedPlayers.get("c").gameRole = Roles.GAME.COMMONER;

  assert.equal(game.wasCriticalRole(game.connectedPlayers.get("host")), true);
  assert.equal(game.wasCriticalRole(game.connectedPlayers.get("b")), true);
  assert.equal(game.wasCriticalRole(game.connectedPlayers.get("c")), false);
});

test("GameManager removes the room once the last player leaves", () => {
  const gm = new GameManager();
  const game = gm.createGame(fakeIo);
  const code = game.code;
  gm.addPlayer(game, new Player(fakeSocket("host"), "host", Roles.ROOM.LEADER));

  gm.removePlayer(code, game.connectedPlayers.get("host"));
  assert.equal(gm.getGame(code), undefined);
});

test("GameManager keeps the room while players remain", () => {
  const gm = new GameManager();
  const game = gm.createGame(fakeIo);
  const code = game.code;
  gm.addPlayer(game, new Player(fakeSocket("host"), "host", Roles.ROOM.LEADER));
  gm.addPlayer(game, new Player(fakeSocket("b"), "b", Roles.ROOM.MEMBER));

  gm.removePlayer(code, game.connectedPlayers.get("b"));
  assert.equal(gm.getGame(code), game);
  assert.equal(game.connectedPlayers.size, 1);
});

// Build a mid-round game: assign roles[id] and drop into a non-lobby state.
// (RevealState is a lightweight stand-in for "a round is in progress".)
function makeMidRound(roles) {
  const ids = Object.keys(roles);
  const game = new Game("ABCDE", fakeIo);
  ids.forEach((id, i) => {
    game.addPlayer(new Player(fakeSocket(id), id, i === 0 ? Roles.ROOM.LEADER : Roles.ROOM.MEMBER));
  });
  for (const [id, role] of Object.entries(roles)) {
    game.connectedPlayers.get(id).gameRole = role;
    if (role === Roles.GAME.MASTER) game.masterPlayer = game.connectedPlayers.get(id);
  }
  game.setState(new RevealState(game)); // now "in progress"
  return game;
}

// a full minimum-size table mid-round
const FULL_ROLES = {
  host: Roles.GAME.COMMONER,
  m: Roles.GAME.MASTER,
  ins: Roles.GAME.INSIDER,
  c1: Roles.GAME.COMMONER,
};

test("a player leaving in the lobby never ends a round", () => {
  const game = makeRoom(["host", "b", "c", "d"]); // lobby, no roles assigned
  const leaver = game.connectedPlayers.get("d");
  game.removePlayer(leaver); // 3 left, but we are not in a round
  assert.equal(game.shouldEndRound(leaver), false);
});

test("a commoner leaving that drops the room below the minimum ends the round", () => {
  const game = makeMidRound(FULL_ROLES); // 4 players = MIN_PLAYERS
  const leaver = game.connectedPlayers.get("c1");
  game.removePlayer(leaver); // now MIN_PLAYERS - 1
  assert.ok(game.connectedPlayers.size < MIN_PLAYERS);
  assert.equal(game.shouldEndRound(leaver), true);
  game.state.exit(); // clear the reveal timer so the test process can exit
});

test("a commoner leaving while still at the minimum keeps the round going", () => {
  const game = makeMidRound({ ...FULL_ROLES, c2: Roles.GAME.COMMONER }); // 5 players
  const leaver = game.connectedPlayers.get("c2");
  game.removePlayer(leaver); // now exactly MIN_PLAYERS
  assert.equal(game.connectedPlayers.size, MIN_PLAYERS);
  assert.equal(game.shouldEndRound(leaver), false);
  game.state.exit();
});

test("the Master leaving ends the round even when player count is still fine", () => {
  const game = makeMidRound({ ...FULL_ROLES, c2: Roles.GAME.COMMONER }); // 5 players
  const leaver = game.connectedPlayers.get("m");
  game.removePlayer(leaver); // 4 left (>= MIN_PLAYERS) but the Master is gone
  assert.equal(game.connectedPlayers.size, MIN_PLAYERS);
  assert.equal(game.shouldEndRound(leaver), true);
  game.state.exit();
});

test("the Master rotates to a different player each round", () => {
  const game = makeRoom(["a", "b", "c", "d"]);
  assert.equal(game.nextMaster().id, "a");
  assert.equal(game.nextMaster().id, "b");
  assert.equal(game.nextMaster().id, "c");
  assert.equal(game.nextMaster().id, "d");
  assert.equal(game.nextMaster().id, "a", "rotation wraps back to the first player");
});

test("the Master rotation cursor survives a return to the lobby", () => {
  const game = makeRoom(["a", "b", "c", "d"]);
  assert.equal(game.nextMaster().id, "a");
  game.resetGame();
  assert.equal(game.nextMaster().id, "b", "rotation must not restart at the first player");
});

test("endRoundReason names the Master and Insider departures", () => {
  const game = makeMidRound(FULL_ROLES);
  assert.equal(game.endRoundReason(game.connectedPlayers.get("m")), "critical_role_left");
  assert.equal(game.endRoundReason(game.connectedPlayers.get("ins")), "critical_role_left");
  game.state.exit();
});

test("endRoundReason names a table that dropped below the minimum", () => {
  const game = makeMidRound(FULL_ROLES);
  const leaver = game.connectedPlayers.get("c1");
  game.removePlayer(leaver);                       // 4 -> 3, below MIN_PLAYERS
  assert.equal(game.endRoundReason(leaver), "too_few_players");
  game.state.exit();
});

test("endRoundReason is null in the lobby and for a harmless departure", () => {
  const lobby = makeRoom(["host", "b", "c", "d"]);
  assert.equal(lobby.endRoundReason(lobby.connectedPlayers.get("d")), null);

  const game = makeMidRound({ ...FULL_ROLES, c2: Roles.GAME.COMMONER }); // 5 players
  const leaver = game.connectedPlayers.get("c2");
  game.removePlayer(leaver);                       // 5 -> 4, still legal
  assert.equal(game.endRoundReason(leaver), null);
  game.state.exit();
});

test("resetGame forwards an abort payload to the lobby stateChange", () => {
  const captured = [];
  const io = { to: () => ({ emit: (event, data) => captured.push({ event, data }) }) };
  const game = new Game("ABCDE", io);
  ["a", "b"].forEach((id, i) =>
    game.addPlayer(new Player(fakeSocket(id), id, i === 0 ? Roles.ROOM.LEADER : Roles.ROOM.MEMBER)));

  game.resetGame({ reason: "too_few_players" });
  const lobby = captured.find((e) => e.event === "stateChange" && e.data.state === "lobby");
  assert.deepEqual(lobby.data.data, { reason: "too_few_players" });
});

test("resetGame with no argument still emits an empty lobby payload", () => {
  const captured = [];
  const io = { to: () => ({ emit: (event, data) => captured.push({ event, data }) }) };
  const game = new Game("ABCDE", io);
  game.addPlayer(new Player(fakeSocket("a"), "a", Roles.ROOM.LEADER));

  game.resetGame();
  const lobby = captured.find((e) => e.event === "stateChange" && e.data.state === "lobby");
  assert.deepEqual(lobby.data.data, {});
});

test("nextMaster returns null once the room is empty", () => {
  const game = makeRoom(["a"]);
  game.removePlayer(game.connectedPlayers.get("a"));
  assert.equal(game.nextMaster(), null);
});

// regression: #roundCount was frozen at start(), so a shrunken roster matched no
// index, left #masterPlayer null, and SetupState dereferenced it
test("playAgain after a player leaves assigns a valid Master instead of throwing", () => {
  const game = makeRoom(["a", "b", "c", "d", "e"]);
  game.start();
  game.state.exit();                              // stop the real SetupState timer
  game.removePlayer(game.connectedPlayers.get("e"));

  assert.doesNotThrow(() => game.playAgain());
  assert.ok(game.masterPlayer, "expected a Master to be assigned");
  assert.ok(
    game.connectedPlayers.has(game.masterPlayer.id),
    "the Master must be a player who is still in the room"
  );
  game.state.exit();
});
