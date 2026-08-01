# Disconnect Round Reactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the INSIDER round machinery react correctly when a player disconnects mid-game — fixing a `playAgain()` crash, a guessing-phase stall, and the silent round abort.

**Architecture:** Master selection moves from a frozen array index to id-based rotation on `Game`. A new `GameState.onPlayerLeft(player)` hook lets the active state respond to a departure; `GuessingState` re-routes the turn baton and `VoteState` prunes dead tie candidates. `Game.endRoundReason()` names *why* a round ended so the client can explain it.

**Tech Stack:** Node ESM (`"type": "module"`), classes with `#private` fields, Socket.IO, Next.js App Router (React) for the client, `node --test` for tests.

**Spec:** `docs/superpowers/specs/2026-07-30-disconnect-handling-design.md`

**Branch:** `disconnect-round-reactions` (already created; spec committed as `b101912`)

## Global Constraints

- Module type is ESM. Use `import`/`export`, never `require`.
- Private class fields use `#name` syntax. Follow the surrounding style.
- Tests run with `npm test` (`node --test tests/*.test.js`). No browser/integration harness exists — client changes are verified by hand.
- `MIN_PLAYERS` is `4`, imported from `components/constants/gameParam.js`. Do not change it.
- Abort reason codes are exactly `"critical_role_left"` and `"too_few_players"`.
- Comments in this codebase are sparse and informal. Match that; do not add ceremony.
- `shouldEndRound(leaver)` must keep its existing name, signature and boolean return — 5 existing tests call it.
- Every task ends green: `npm test` passes before you commit.

---

### Task 1: Master rotation by identity

Fixes the `playAgain()` crash. `Game.start()` sets `#roundCount = size - 1` once and `SetupState.assignRoles()` picks the Master by that array index — so after anyone leaves, no index matches, `#masterPlayer` stays `null`, and `SetupState.js:107` throws. Also closes ROADMAP §4.

**Files:**
- Modify: `models/Game.js` (add `#lastMasterId` + `nextMaster()`; remove `#roundCount` field, its assignment in `start()`, and the `roundCount` getter)
- Modify: `models/states/SetupState.js:77-110` (`assignRoles`)
- Test: `tests/disconnect.test.js`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `Game.prototype.nextMaster() → Player | null` — advances the rotation cursor and returns the next Master, or `null` if the room is empty. `Game.prototype.roundCount` is **removed**; nothing may reference it after this task.

- [ ] **Step 1: Write the failing tests**

Append to `tests/disconnect.test.js`. The `makeRoom` helper already exists at the top of that file.

```js
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test 2>&1 | tail -20`

Expected: FAIL. `nextMaster` is not a function; the `playAgain` test fails with
`TypeError: Cannot read properties of null (reading 'id')`.

- [ ] **Step 3: Add rotation to `Game`**

In `models/Game.js`, add the field beside the other private fields near the top:

```js
    #lastMasterId = null; // rotation cursor: survives #resetRound on purpose
```

Add the method (put it near `masterPlayer`'s getter/setter):

```js
    // Master rotates by identity, so a departure can't invalidate the pick (ROADMAP §4)
    nextMaster() {
        const ids = [...this.#connectedPlayers.keys()];
        if (ids.length === 0) return null;

        const i = ids.indexOf(this.#lastMasterId); // -1 when unset or the last Master left
        const next = ids[(i + 1) % ids.length];    // -1 wraps to index 0
        this.#lastMasterId = next;
        return this.#connectedPlayers.get(next);
    }
```

Delete the `#roundCount;` field declaration, the `get roundCount()` getter, and the assignment
inside `start()`, so `start()` becomes:

```js
    start() {
        if (this.#started) return;
        this.#started = true;
        this.nextState(); // move from lobby to setup
    }
```

**Do not** clear `#lastMasterId` in `#resetRound()` — clearing it restarts rotation at player 0
every round and silently reintroduces a fixed Master.

- [ ] **Step 4: Rewrite `SetupState.assignRoles()`**

Replace the whole method in `models/states/SetupState.js`:

```js
    assignRoles() {
        const playersArray = Array.from(this.#game.connectedPlayers.values());
        if (playersArray.length < 2) return; // need a Master plus at least one other

        // Master rotates by id; never null while players remain
        const master = this.#game.nextMaster();
        master.gameRole = Roles.GAME.MASTER;
        this.#game.masterPlayer = master;

        // insider: uniform pick among the non-Master players (no rejection loop)
        const eligible = playersArray.filter(p => p.id !== master.id);
        const insider = eligible[Math.floor(Math.random() * eligible.length)];

        for (const player of eligible) {
            player.gameRole = player.id === insider.id ? Roles.GAME.INSIDER : Roles.GAME.COMMONER;
        }

        for (const player of playersArray) {
            this.#game.emitToPlayer(player.id, "roleAssigned", {
                gameRole: player.gameRole,          // only send their own role
                masterId: master.id                 // send master id for everyone
            });
        }
    }
```

This also fixes two latent bugs in the old version: the guard read `playersArray.size`
(`undefined` on an Array, so it never fired) and the `do…while` insider pick spins forever when
only one player is eligible.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test 2>&1 | tail -20`

Expected: PASS, all tests including the 32 pre-existing ones.

- [ ] **Step 6: Verify nothing still references `roundCount`**

Run: `grep -rn "roundCount" --include="*.js" --include="*.jsx" . | grep -v node_modules`

Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add models/Game.js models/states/SetupState.js tests/disconnect.test.js
git commit -m "fix: rotate the Master by id so playAgain survives a departure

#roundCount was frozen at start(), so a shrunken roster matched no index and
SetupState dereferenced a null masterPlayer. Track the Master by id instead.
Closes ROADMAP §4 (Master rotation).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Name the reason a round ended

`shouldEndRound` returns a bare boolean, so `resetGame()` can only tell clients "you're in the lobby now". Add a sibling that returns the reason code, and let `resetGame` forward it.

**Files:**
- Modify: `models/Game.js` (add `endRoundReason`, redefine `shouldEndRound`, widen `resetGame`)
- Test: `tests/disconnect.test.js`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces:
  - `Game.prototype.endRoundReason(leaver) → "critical_role_left" | "too_few_players" | null`
  - `Game.prototype.shouldEndRound(leaver) → boolean` (unchanged contract, now delegating)
  - `Game.prototype.resetGame(abort = null)` — `abort` is forwarded verbatim as the `data` of the `stateChange`/`lobby` emit; omitting it emits `{}` exactly as before.

- [ ] **Step 1: Write the failing tests**

Append to `tests/disconnect.test.js`. The `makeMidRound` helper and `FULL_ROLES` constant already
exist in that file.

```js
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test 2>&1 | tail -20`

Expected: FAIL — `game.endRoundReason is not a function`.

- [ ] **Step 3: Implement in `models/Game.js`**

Replace the existing `shouldEndRound` method with both of these:

```js
    // why the round has to end, or null if it can carry on (FR-32)
    endRoundReason(leaver) {
        if (!this.inProgress) return null;
        if (this.wasCriticalRole(leaver)) return "critical_role_left";
        if (this.#connectedPlayers.size < MIN_PLAYERS) return "too_few_players";
        return null;
    }

    // check if game should still run (critical role left or not enough players)
    shouldEndRound(leaver) {
        return this.endRoundReason(leaver) !== null;
    }
```

Widen `resetGame` to accept and forward the payload:

```js
    // return to lobby w/ same players (FR-32); `abort` explains an interrupted round
    resetGame(abort = null) {
        this.#resetRound();
        this.#started = false;
        this.setState(new LobbyState(this)); // exit() of the current state clears its timer
        this.emit("stateChange", { state: "lobby", data: abort ?? {} });
        this.#broadcastRoom();
    }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test 2>&1 | tail -20`

Expected: PASS. The 5 pre-existing `shouldEndRound` tests must still pass untouched.

- [ ] **Step 5: Commit**

```bash
git add models/Game.js tests/disconnect.test.js
git commit -m "feat: name why a round ended so clients can explain it

endRoundReason returns a reason code; shouldEndRound delegates to it so the
boolean and the player-facing message can't drift apart.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: `onPlayerLeft` hook on the state base

The seam Tasks 4 and 5 consume. A departure currently never reaches the active state, so a state whose progress depends on a socket that just vanished has no way to recover.

**Files:**
- Modify: `models/states/GameState.js`
- Modify: `models/Game.js` (`removePlayer`)
- Test: `tests/disconnect.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `GameState.prototype.onPlayerLeft(player)` — a no-op on the base, overridable per
  state. Called by `Game.removePlayer` **after** all roster/vote/host bookkeeping, so the state
  observes the post-departure roster. `player` is the full `Player` object, already removed from
  `connectedPlayers`.

- [ ] **Step 1: Write the failing test**

Append to `tests/disconnect.test.js`:

```js
test("removePlayer notifies the active state after the roster has shrunk", () => {
  const game = makeRoom(["a", "b", "c", "d"]);
  const seen = [];
  // a stand-in state that records what it was told, and when
  game.setState({
    enter() {},
    exit() {},
    onPlayerLeft(player) {
      seen.push({ id: player.id, rosterSize: game.connectedPlayers.size });
    }
  });

  game.removePlayer(game.connectedPlayers.get("d"));

  assert.deepEqual(seen, [{ id: "d", rosterSize: 3 }]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test 2>&1 | tail -20`

Expected: FAIL — `seen` is empty, because nothing calls `onPlayerLeft`.

- [ ] **Step 3: Add the base method**

`models/states/GameState.js` in full:

```js
export class GameState {
    enter(game) {}
    exit(game) {}
    onPlayerAction(game, socket, data) {}
    onPlayerLeft(player) {}
}
```

- [ ] **Step 4: Call it from `Game.removePlayer`**

In `models/Game.js`, add one line at the very end of `removePlayer`, after the existing host
hand-off block:

```js
        // let the running phase react (e.g. re-route the guessing turn)
        this.#state?.onPlayerLeft?.(player);
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test 2>&1 | tail -20`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add models/states/GameState.js models/Game.js tests/disconnect.test.js
git commit -m "feat: add GameState.onPlayerLeft so phases can react to a departure

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Re-route the guessing turn when the active guesser leaves

Fixes the stall. `GuessingState` snapshots `playerArr`/`#lobbySize` at `enter()` and advances the turn only via `nextPlayer.socket.once("nextTurn")`. When the active guesser disconnects, that baton dies with their socket and nothing else can advance the round until the phase timer fires.

**Files:**
- Modify: `models/states/GuessingState.js` (rewrite the turn machinery)
- Test: `tests/guessingFlow.test.js`

**Interfaces:**
- Consumes: `GameState.prototype.onPlayerLeft(player)` from Task 3.
- Produces: nothing consumed by later tasks. Tests observe turn ownership through the socket's
  registered `nextTurn` handler (the `batonHolder` helper), not through new public API.

- [ ] **Step 1: Upgrade the test file's fake socket**

The current `fakeSocket` in `tests/guessingFlow.test.js:9` has a no-op `once()`, so tests cannot
see who holds the turn. Replace that one line with:

```js
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
```

The 3 existing tests in this file don't touch `once`, so they keep passing.

- [ ] **Step 2: Write the failing tests**

Append to `tests/guessingFlow.test.js`. `makeGuessingGame()` builds `m` (Master), `ins`, `c1`, `c2`.

```js
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
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test 2>&1 | tail -25`

Expected: FAIL — "the turn must not die with the departed player" (`batonHolder` is `undefined`
after the active guesser is removed).

- [ ] **Step 4: Rewrite `models/states/GuessingState.js`**

Replace the file in full. The turn logic moves out of the `enter()` closure into methods so
`onPlayerLeft` can reuse it, and the roster is read live instead of snapshotted.

```js
import { GameState } from "./GameState.js";

export class GuessingState extends GameState {

    #game;
    #duration = 18000;
    #activeGuesserId = null;
    #previousGuesserId = null;
    #wordFound = false;
    #timerExpirationRun = false;
    #timer;

    constructor(game) {
        super();
        this.#game = game;
    }

    enter() {
        console.log("entering guessing state");
        const startTime = Date.now();
        // the client drives every phase off a single "stateChange" switch
        this.#game.emit("stateChange", {
            state: "guessing",
            data: {
                startTime: startTime,
                endTime: startTime + this.#duration
            }
        });

        this.#timer = setTimeout(() => {
            this.handleTimerExpired();
        }, this.#duration);

        const masterSocket = this.#game.masterPlayer.socket;
        masterSocket.once("wordFound", () => {
            this.#wordFound = true;
            this.handleTimerExpired();
        });

        this.#passTurnTo(this.#nextEligible(null));

        this.#game.emitToPlayer(this.#game.masterPlayer.id, "showGuessButton", {
            text: "They've got it!",
            master: true
        });
    }

    // live read of the roster: next non-Master player after `afterId`, wrapping.
    // null when nobody is eligible (everyone but the Master has left).
    #nextEligible(afterId) {
        const eligible = [...this.#game.players.values()]
            .filter(p => p.id !== this.#game.masterPlayer?.id);
        if (eligible.length === 0) return null;

        const i = eligible.findIndex(p => p.id === afterId); // -1 wraps to index 0
        return eligible[(i + 1) % eligible.length];
    }

    #passTurnTo(player) {
        if (!player) return;
        this.#previousGuesserId = this.#activeGuesserId;
        this.#activeGuesserId = player.id;

        // TEMP may need some kind of check to authorise who is clicking the button
        // otherwise game could be manipulated.
        this.#game.emitToPlayer(player.id, "showGuessButton", {
            text: "OK ITS ON ITS UP TO YOU",
            master: false
        });
        this.#game.emit("showGuesser", player.id);

        player.socket.once("nextTurn", () => {
            this.#passTurnTo(this.#nextEligible(this.#activeGuesserId));
        });
    }

    // only matters if the leaver held the turn: their "nextTurn" handler died with
    // their socket, so nothing else would ever advance the round
    onPlayerLeft(player) {
        if (player.id !== this.#activeGuesserId) return;

        // resume from the player before them so the turn order is preserved
        const next = this.#nextEligible(this.#previousGuesserId);
        if (!next) return; // round is about to be reset by shouldEndRound
        this.#passTurnTo(next);
    }

    handleTimerExpired() {
        if (this.#timerExpirationRun) return;
        this.#timerExpirationRun = true;

        this.#game.wordFound = this.#wordFound;
        this.#game.nextState();
        console.log("GOING TO REVEAL STATE");
    }

    exit() {
        // stop the round timer from firing after we've moved on
        clearTimeout(this.#timer);
    }
}
```

Note the dropped imports: `getIo` and `Roles` were both unused in the original file.

The departed player's dangling `once("nextTurn")` needs no cleanup — the socket is gone.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test 2>&1 | tail -25`

Expected: PASS, including the 3 pre-existing `guessingFlow` tests.

- [ ] **Step 6: Commit**

```bash
git add models/states/GuessingState.js tests/guessingFlow.test.js
git commit -m "fix: re-route the guessing turn when the active guesser leaves

The turn advanced only via a once('nextTurn') handler bound to the active
player's socket, so a disconnect stalled the round until the phase timer.
Read the roster live and hand the baton on via onPlayerLeft.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Prune departed tie candidates in `VoteState`

During the 15s Master-decides window, `#tieCandidates` can hold a player who has since left — leaving the Master picking a ghost.

**Files:**
- Modify: `models/states/VoteState.js`
- Test: `tests/voteFlow.test.js`

**Interfaces:**
- Consumes: `GameState.prototype.onPlayerLeft(player)` from Task 3.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write the failing tests**

Append to `tests/voteFlow.test.js`. The `makeVotingGame`, `lastResult` and `has` helpers already
exist there.

```js
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test 2>&1 | tail -25`

Expected: FAIL — the first test finds `lastResult(captured)` still `undefined`, because a
departure does not touch `#tieCandidates`.

- [ ] **Step 3: Add the override to `models/states/VoteState.js`**

Insert after `startTieBreak`:

```js
    // a tie candidate leaving must not leave the Master picking a ghost
    onPlayerLeft(player) {
        if (this.#finished || !this.#tieCandidates) return;

        this.#tieCandidates = this.#tieCandidates.filter(id => id !== player.id);

        if (this.#tieCandidates.length === 1) {
            this.finish(this.#tieCandidates[0]); // only one left standing
        } else if (this.#tieCandidates.length === 0) {
            this.finish(null);                   // defensive; see note below
        }
    }
```

The zero-candidate branch is defensive only — removals arrive one at a time, so the list always
collapses to 1 and finishes before it can reach 0. It is kept as a guard, and deliberately has no
test asserting an unreachable path.

Nothing is needed for the main 18s voting window: `Game.#removeVote` already prunes the leaver's
cast vote from the tally.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test 2>&1 | tail -25`

Expected: PASS, including the 7 pre-existing `voteFlow` tests.

- [ ] **Step 5: Commit**

```bash
git add models/states/VoteState.js tests/voteFlow.test.js
git commit -m "fix: drop departed players from the tie-break candidates

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Tell players why the round ended

Wires the reason from Task 2 through `server.js` to the client, which currently yanks everyone to the lobby with no explanation.

**Files:**
- Modify: `components/constants/text.js`
- Modify: `server.js:160-165` (the disconnect handler's reset branch) and add a `roleLabel` helper
- Modify: `components/Game/Game.jsx` (import `TEXT`; `handleLobbyState` at line 233)

**Interfaces:**
- Consumes: `Game.prototype.endRoundReason(leaver)` and `resetGame(abort)` from Task 2.
- Produces: the wire payload `stateChange { state: "lobby", data: { reason, playerName, role? } }`,
  where `role` is present only when `reason === "critical_role_left"`.

**Note:** do not use `utils/insertText.js`. It is dead and broken — it imports a named `{ TEXT }`
that `text.js` does not export, and its regex matches the literal string `{{varName}}`. Follow the
working inline `.replace` pattern already used at `Game.jsx:167`. Deleting it belongs to
ROADMAP §2.

- [ ] **Step 1: Add the copy**

`components/constants/text.js` in full:

```js
const TEXT = Object.freeze({

    overlay: {
        insider: "You are the Insider. {{name}} is choosing a word",
        commoner: "You are a commoner. {{name}} is choosing a word",
        master: "Select a word:"
    },

    abort: {
        critical_role_left: "{{name}} ({{role}}) left — round ended.",
        too_few_players: "Too few players — round ended."
    }

})

export default TEXT;
```

- [ ] **Step 2: Wire the reason through `server.js`**

Add a module-level helper below the imports (near the `players` map):

```js
// display copy for the two round-ending roles (see TEXT.abort)
function roleLabel(player) {
    return player.gameRole === Roles.GAME.MASTER ? "the Master" : "the Insider";
}
```

In the `disconnect` handler, replace the `shouldEndRound` branch:

```js
            // check if we should reset or just refresh the roster for everyone left
            const reason = game.endRoundReason(player);
            if (reason) {
                const abort = { reason, playerName: player.name };
                if (reason === "critical_role_left") abort.role = roleLabel(player);
                game.resetGame(abort);
            } else {
                // just refresh the roster (and any newly promoted host) for everyone left
                emitRoomToPlayers(game);
            }
```

`roleLabel` is only reached on the `critical_role_left` branch, where `wasCriticalRole` guarantees
`gameRole` is Master or Insider.

- [ ] **Step 3: Render it on the client**

In `components/Game/Game.jsx`, add to the imports:

```js
import TEXT from "../constants/text.js";
```

Replace `handleLobbyState` (currently declared with no parameter, though the switch at line 253
already passes `data`):

```js
    // server reset us back to the pre-start lobby (e.g. a disconnect ended the round)
    const handleLobbyState = (data = {}) => {
      stopTimer(); // stop timer so it aint running in lobby
      setShowOverlay(false);
      setResult(null);
      setTargetWord(null);
      setWordOptions([]);
      setGuessButtonActive(false);
      setGuessingPlayer(null);
      setShowStartButton(true);

      // explain an interrupted round; a host-triggered return sends no reason
      const copy = data.reason ? TEXT.abort[data.reason] : null;
      setGameMessage(
        copy
          ? copy.replace("{{name}}", data.playerName ?? "A player").replace("{{role}}", data.role ?? "")
          : "not assigned"
      );
    };
```

- [ ] **Step 4: Run the tests**

Run: `npm test 2>&1 | tail -10`

Expected: PASS. No test covers the client (there is no browser harness) — this confirms the
`server.js` and `text.js` edits didn't break the server suite.

- [ ] **Step 5: Verify by hand**

There is no integration harness, so this path is checked manually.

```bash
npm run dev
```

Open 4 tabs at `http://localhost:3000` — each tab is a separate player. Create a room in tab 1,
join from tabs 2–4 with the room code, start from tab 1. Then:

1. **Critical role leaves.** During the guessing phase, close the tab whose player is the Master.
   Expected: the remaining tabs return to the lobby showing
   `<name> (the Master) left — round ended.`
2. **Table too small.** Restart with 5 tabs, start the round, then close two non-Master,
   non-Insider tabs. Expected on the second close: `Too few players — round ended.`
3. **Host's own Return to Lobby.** Play a round to the result screen and press Return to Lobby.
   Expected: lobby message reads `not assigned` — unchanged, no abort copy.
4. **Turn baton (Task 4 in the real app).** With 5 tabs mid-guessing, close the tab that is
   currently highlighted as the guesser. Expected: the highlight moves to another player
   immediately rather than the phase hanging until the timer runs out.

- [ ] **Step 6: Commit**

```bash
git add components/constants/text.js server.js components/Game/Game.jsx
git commit -m "feat: tell players why a disconnect ended the round

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Update project docs

The spec's changes land across ROADMAP items; leaving them stale is how `CLAUDE.md` drifted in the first place.

**Files:**
- Modify: `ROADMAP.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: all previous tasks.
- Produces: nothing.

- [ ] **Step 1: Update `ROADMAP.md`**

- Mark **§4 Master rotation** as `☑ done`, noting it was resolved by id-based rotation
  (`Game.nextMaster()`) while fixing the `playAgain` crash.
- Under **§1**, add that the follow-up round-reaction work is done: `GameState.onPlayerLeft`,
  the guessing-turn re-route, tie-candidate pruning, and the abort reason shown to players.
- Under **§2 dead code**, remove the `pages/index.js` bullet (already deleted in `f6d2881`) and
  add `utils/insertText.js` — dead, imports a non-existent named `{ TEXT }`, and its regex
  matches a literal `{{varName}}`.
- Under **§10**, note the added coverage: Master rotation, abort reason codes, guessing baton
  re-route, tie-candidate pruning.

- [ ] **Step 2: Update `CLAUDE.md`**

Correct these now-stale statements in the "Gotchas / known dead code" section:

- Remove the `pages/index.js` bullet (the file is gone).
- Remove "**`GuessingState` references `this.#game.players`**, but `Game` only exposes
  `connectedPlayers` (no `players` getter)" — the getter exists at `models/Game.js:347`.
- Remove "**Disconnect handling is broken**: `players.delete[socket.id]`" — fixed in `60f57be`
  and extended by this branch.
- In the `VoteState` bullet, drop "**Master rotation** (Play Again reuses the same Master)" from
  the missing list.
- Fix the state durations line: Guessing is **18s**, not 180s.

- [ ] **Step 3: Verify the claims you just wrote**

```bash
npm test 2>&1 | tail -5
grep -rn "roundCount" --include="*.js" --include="*.jsx" . | grep -v node_modules
ls pages 2>&1
grep -n "get players" models/Game.js
```

Expected: tests pass; no `roundCount` hits; `pages` does not exist; the `players` getter is found.

- [ ] **Step 4: Commit**

```bash
git add ROADMAP.md CLAUDE.md
git commit -m "docs: refresh roadmap and CLAUDE.md after disconnect round reactions

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Done criteria

- `npm test` passes, with new coverage for Master rotation, abort reason codes, the guessing
  baton re-route, and tie-candidate pruning.
- `playAgain()` after a departure assigns a valid Master instead of throwing.
- The active guesser disconnecting hands the turn to a remaining player immediately.
- An interrupted round returns everyone to the lobby with copy naming who left and why.
- `grep -rn "roundCount"` returns nothing.
- The four manual scenarios in Task 6 Step 5 behave as described.
