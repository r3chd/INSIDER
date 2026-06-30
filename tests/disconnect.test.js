import { test } from "node:test";
import assert from "node:assert/strict";

import Game from "../models/Game.js";
import GameManager from "../models/GameManager.js";
import Player from "../models/Player.js";
import Roles from "../components/constants/rolesEnum.js";

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
