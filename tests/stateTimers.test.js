import { test, mock } from "node:test";
import assert from "node:assert/strict";

import Game from "../models/Game.js";
import Player from "../models/Player.js";
import Roles from "../components/constants/rolesEnum.js";
import { RevealState } from "../models/states/RevealState.js";

// minimal io stub so Game.emit / emitToPlayer don't blow up
const fakeIo = { to: () => ({ emit() {} }) };
const fakeSocket = (id) => ({ id, emit() {}, once() {}, join() {} });

function makeRoom(ids) {
  const game = new Game("ABCDE", fakeIo);
  ids.forEach((id, i) => {
    game.addPlayer(new Player(fakeSocket(id), id, i === 0 ? Roles.ROOM.LEADER : Roles.ROOM.MEMBER));
  });
  return game;
}

// A round bailed out mid-phase (e.g. the Master left) must not leave a pending phase
// timer that later fires nextState() and silently starts a phantom round.

test("RevealState.exit cancels its timer so a stale timer can't advance the game", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const game = makeRoom(["host", "b"]);
    let advanced = 0;
    game.nextState = () => { advanced++; }; // spy: the only thing the timer would do

    const reveal = new RevealState(game);
    reveal.enter(); // schedules the 5s reveal timer
    reveal.exit();  // should clear it

    mock.timers.tick(10000);
    assert.equal(advanced, 0);
  } finally {
    mock.timers.reset();
  }
});

test("resetting mid-setup cancels the setup timer (no phantom round)", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const game = makeRoom(["host", "b", "c", "d"]);
    game.start(); // -> SetupState, schedules the 10s word-pick fallback timer
    assert.equal(game.state.constructor.name, "SetupState");

    game.resetGame(); // bail back to the lobby (as a critical disconnect would)
    assert.equal(game.state.constructor.name, "LobbyState");

    mock.timers.tick(30000); // give the orphaned timer every chance to fire
    assert.equal(game.state.constructor.name, "LobbyState"); // it never did
  } finally {
    mock.timers.reset();
  }
});
