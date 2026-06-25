import { test } from "node:test";
import assert from "node:assert/strict";

import Game from "../models/Game.js";
import Player from "../models/Player.js";
import Roles from "../components/constants/rolesEnum.js";

// minimal io stub so Game.emit / emitToPlayer don't blow up
const fakeIo = { to: () => ({ emit() {} }) };
const fakeSocket = (id) => ({ id, emit() {}, once() {}, join() {} });

// Build a game with the given roles. roles: { id: gameRole }.
// The first id becomes the room LEADER (host) so addPlayer's host logic works.
function makeGame(roles) {
  const game = new Game("ABCDE", fakeIo);
  const ids = Object.keys(roles);
  ids.forEach((id, i) => {
    const roomRole = i === 0 ? Roles.ROOM.LEADER : Roles.ROOM.MEMBER;
    game.addPlayer(new Player(fakeSocket(id), id, roomRole));
  });
  // assign game roles after everyone is in
  for (const [id, gameRole] of Object.entries(roles)) {
    game.connectedPlayers.get(id).gameRole = gameRole;
    if (gameRole === Roles.GAME.MASTER) game.masterPlayer = game.connectedPlayers.get(id);
  }
  return game;
}

const ROLES = {
  m: Roles.GAME.MASTER,
  ins: Roles.GAME.INSIDER,
  c1: Roles.GAME.COMMONER,
  c2: Roles.GAME.COMMONER,
};

test("insiderPlayer getter finds the insider", () => {
  const game = makeGame(ROLES);
  assert.equal(game.insiderPlayer.id, "ins");
});

test("voting out the insider makes the citizens win", () => {
  const game = makeGame(ROLES);
  assert.equal(game.resolveWinner("ins"), "citizens");
});

test("voting out a non-insider makes the insider team win", () => {
  const game = makeGame(ROLES);
  assert.equal(game.resolveWinner("c1"), "insider");
});

test("no decision (null) makes the insider team win", () => {
  const game = makeGame(ROLES);
  assert.equal(game.resolveWinner(null), "insider");
});

test("getTopVoteCandidates returns the single leader", () => {
  const game = makeGame(ROLES);
  game.votePlayer("c1", "ins");
  game.votePlayer("c2", "ins");
  game.votePlayer("m", "c1");
  const { candidates, maxVotes } = game.getTopVoteCandidates();
  assert.deepEqual(candidates.sort(), ["ins"]);
  assert.equal(maxVotes, 2);
});

test("getTopVoteCandidates returns all tied leaders", () => {
  const game = makeGame(ROLES);
  game.votePlayer("c1", "ins");
  game.votePlayer("c2", "c1");
  const { candidates, maxVotes } = game.getTopVoteCandidates();
  assert.deepEqual(candidates.sort(), ["c1", "ins"]);
  assert.equal(maxVotes, 1);
});

test("getTopVoteCandidates with no votes returns empty / zero", () => {
  const game = makeGame(ROLES);
  const { candidates, maxVotes } = game.getTopVoteCandidates();
  assert.deepEqual(candidates, []);
  assert.equal(maxVotes, 0);
});

test("votes cast on the master are ignored (master cannot be voted out)", () => {
  const game = makeGame(ROLES);
  game.votePlayer("c1", "m");
  const { candidates, maxVotes } = game.getTopVoteCandidates();
  assert.deepEqual(candidates, []);
  assert.equal(maxVotes, 0);
});
