import { test } from "node:test";
import assert from "node:assert/strict";

import Game from "../models/Game.js";
import GameManager from "../models/GameManager.js";
import Player from "../models/Player.js";
import Roles from "../components/constants/rolesEnum.js";
import { MAX_PLAYERS } from "../components/constants/gameParam.js";

// minimal io/socket stubs so Game.emit / addPlayer don't blow up
const fakeIo = { to: () => ({ emit() {} }) };
const fakeSocket = (id) => ({ id, emit() {}, once() {}, join() {} });

function fillRoom(game, count) {
  for (let i = 0; i < count; i++) {
    const id = `p${i}`;
    game.addPlayer(new Player(fakeSocket(id), id, i === 0 ? Roles.ROOM.LEADER : Roles.ROOM.MEMBER));
  }
}

test("isFull is false below MAX_PLAYERS and true once the room is at capacity", () => {
  const game = new Game("ABCDE", fakeIo);
  fillRoom(game, MAX_PLAYERS - 1);
  assert.equal(game.isFull(), false);

  game.addPlayer(new Player(fakeSocket("last"), "last", Roles.ROOM.MEMBER));
  assert.equal(game.isFull(), true);
});

test("GameManager.addPlayer refuses to seat a player once the room is full", () => {
  const manager = new GameManager();
  const game = manager.createGame(fakeIo);
  fillRoom(game, MAX_PLAYERS);
  assert.equal(game.isFull(), true);

  const result = manager.addPlayer(game, new Player(fakeSocket("overflow"), "overflow", Roles.ROOM.MEMBER));
  assert.deepEqual(result, { ok: false, reason: "room_full" });
  assert.equal(game.connectedPlayers.size, MAX_PLAYERS, "the overflow player must not be seated");
});

test("GameManager.addPlayer seats a player normally when the room has room", () => {
  const manager = new GameManager();
  const game = manager.createGame(fakeIo);

  const result = manager.addPlayer(game, new Player(fakeSocket("a"), "a", Roles.ROOM.LEADER));
  assert.deepEqual(result, { ok: true });
  assert.equal(game.connectedPlayers.size, 1);
});
