# Disconnect handling, part 2: making the round react to a departure

**Date:** 2026-07-30
**Status:** approved, ready for implementation planning
**Follows:** ROADMAP §1 (roster bookkeeping, done) · closes ROADMAP §4 (Master rotation)

## Problem

ROADMAP §1 made the *roster* survive a departure: the leaver is removed, their vote is
pruned, the host is handed off, empty rooms are reclaimed. That part is solid and covered by
12 tests.

What it did not do is make the *round machinery* react. A departure now leaves the game
running, which exposed two defects and one gap. All three were reproduced against the current
code at `8433f96`, not inferred.

### A. `playAgain()` throws after anyone leaves

`Game.start()` sets `#roundCount = size - 1` once (`models/Game.js:257`) and never updates it.
`SetupState.assignRoles()` picks the Master by that array index (`SetupState.js:93`). If the
roster shrank, no index matches, `#masterPlayer` stays `null` from `#resetRound()`, and
`SetupState.js:107` dereferences it.

Reproduction: 5 players → `start()` → one leaves → `playAgain()` →
`TypeError: Cannot read properties of null (reading 'id')`.

### B. Guessing stalls when the active guesser leaves

`GuessingState` snapshots `playerArr` and `#lobbySize` at `enter()`, and the only thing that
advances the turn is `nextPlayer.socket.once("nextTurn", handlePlayerTurn)`. When the active
guesser disconnects, that baton dies with their socket and no remaining player can advance the
round — it hangs until the phase timer expires. The stale snapshot would also keep dealing
turns to the departed player.

Reproduction: 5 players (stays at/above `MIN_PLAYERS` after the departure, so
`shouldEndRound` correctly returns `false` and the round continues) → active guesser leaves →
no remaining player holds the `nextTurn` handler.

### C. The round aborts with no explanation

`resetGame()` emits `stateChange: { state: "lobby", data: {} }`. Players are yanked back to the
lobby mid-round with no indication of what happened or who left.

## Non-goals

- **Reconnection / state recovery** (ROADMAP §7). A refreshing player still loses their seat.
- **Follower role** (§5), **runoff re-vote** (§6), **action authorization** (§8).
- Fixing `utils/insertText.js`. It is dead and broken — it imports a named `{ TEXT }` that
  `text.js` does not export, and its regex matches the literal string `{{varName}}` instead of
  interpolating. Nothing imports it. This spec follows the working pattern instead (inline
  `.replace("{{name}}", …)`, as at `Game.jsx:167`). Deleting `insertText.js` belongs with
  ROADMAP §2 dead-code cleanup.

## Approach

The active state learns about a departure through a **push hook**, not polling and not by
reading the roster alone.

A live-roster read is necessary but cannot fix B on its own: nothing would wake the state up,
because the event that drives the turn is bound to the socket that just vanished. So the design
uses both — the hook supplies the wake-up, live reads stop departed players being dealt turns.

Rejected: a per-state heartbeat that checks whether the active player still exists. It works but
adds a timer to every state and re-derives what the disconnect event already tells us.

## Design

### 1. `GameState` base gains `onPlayerLeft`

```js
// models/states/GameState.js
onPlayerLeft(player) {}   // no-op; states override as needed
```

Only `GuessingState` and `VoteState` override it. `LobbyState`, `SetupState` and `RevealState`
inherit the no-op — a departure during those phases needs no round-machinery response beyond
the existing `shouldEndRound` check.

### 2. `Game` — id-based Master rotation

Replace the frozen `#roundCount` index with id-based tracking:

```js
#lastMasterId = null;

nextMaster() {
  const ids = [...this.#connectedPlayers.keys()];
  if (ids.length === 0) return null;              // room already emptied
  const i = ids.indexOf(this.#lastMasterId);      // -1 when unset or last Master left
  const next = ids[(i + 1) % ids.length];         // -1 wraps to index 0
  this.#lastMasterId = next;
  return this.#connectedPlayers.get(next);
}
```

**`#lastMasterId` must not be cleared by `#resetRound()`.** It is the rotation cursor; clearing
it would restart rotation at player 0 every round and reintroduce a fixed Master. Only
`nextMaster()` writes it.

If the previous Master has left, `indexOf` returns `-1` and rotation resumes at index 0. That is
a deliberate, acceptable fallback — the alternative (remembering a departed player's position)
adds bookkeeping for no gameplay benefit.

Remove `#roundCount`, its assignment in `start()`, and the `roundCount` getter. Confirmed used
in only three places: `Game.js:257`, `SetupState.js:88`, `SetupState.js:93`.

### 3. `SetupState.assignRoles()` — select by identity

```js
const master = this.#game.nextMaster();   // never null when players remain
master.gameRole = Roles.GAME.MASTER;
this.#game.masterPlayer = master;

// insider: uniform pick among the non-Master players
const eligible = playersArray.filter(p => p.id !== master.id);
const insider = eligible[Math.floor(Math.random() * eligible.length)];
```

This also retires the `do…while (insider_num === roundCount)` rejection loop, which spins
forever when only one player is eligible. Filter-then-pick cannot loop.

While here, fix the adjacent dead guard at `SetupState.js:83`: `playersArray.size` is
`undefined` on an Array (should be `.length`), so the small-lobby break never fires. It is
currently masked by the `MIN_PLAYERS` gate upstream.

### 4. `Game` — notify the state, and name the abort reason

```js
removePlayer(player) {
  // ... existing roster / vote / host bookkeeping, unchanged ...
  this.#state?.onPlayerLeft?.(player);   // AFTER bookkeeping: state sees the post-departure roster
}
```

Ordering matters: the state must observe the roster it will actually operate on.

Replace the bare boolean with a reason, so the boolean and the player-facing message cannot
drift apart:

```js
endRoundReason(leaver) {
  if (!this.inProgress) return null;
  if (this.wasCriticalRole(leaver)) return "critical_role_left";
  if (this.#connectedPlayers.size < MIN_PLAYERS) return "too_few_players";
  return null;
}

shouldEndRound(leaver) { return this.endRoundReason(leaver) !== null; }
```

`shouldEndRound` keeps its current signature and semantics, so the 5 existing tests that call it
continue to pass unchanged.

`resetGame(abort = null)` forwards the payload:

```js
this.emit("stateChange", { state: "lobby", data: abort ?? {} });
```

Existing no-arg callers (the host's Return to Lobby button) keep emitting `{}` and are unaffected.

### 5. `GuessingState` — live roster, and re-route the baton

Track the active guesser **by id** rather than by index into a snapshot, and read
`game.players` live on each turn:

- `nextEligible()` — walks the live roster from the current guesser's position, skipping the
  Master, wrapping at the end.
- `onPlayerLeft(player)` — if `player.id !== activeGuesserId`, do nothing (they were not holding
  the baton). If they were, immediately hand it to `nextEligible()`.
- **Guard:** if no eligible guesser remains, do nothing and return. This happens when the
  departure also drops the room below `MIN_PLAYERS`; `server.js` checks `shouldEndRound`
  immediately after `removePlayer` and resets the round, so the state is about to be torn down.
  Attempting to re-route here would throw on an empty candidate set.

The dangling `once("nextTurn")` on the departed socket needs no cleanup — the socket is gone.

### 6. `VoteState.onPlayerLeft(player)`

Only meaningful while `#tieCandidates` is non-null (the Master-decides window). Remove the
leaver's id from `#tieCandidates`, then:

- 1 candidate remaining → `finish(that candidate)`
- 0 remaining → `finish(null)` (insider team wins, matching the existing timeout branch)
- 2+ remaining → keep waiting on the Master

The leaver's own cast vote is already pruned by `Game.#removeVote`. During the main 18s window
no action is needed for the same reason.

### 7. Client — render the abort reason

`components/constants/text.js` — a new `abort` group alongside the existing `overlay` group,
inside the same frozen `TEXT` object:

```js
const TEXT = Object.freeze({
  overlay: { /* unchanged */ },
  abort: {
    critical_role_left: "{{name}} ({{role}}) left — round ended.",
    too_few_players:    "Too few players — round ended."
  }
});
```

`Game.jsx`: `handleLobbyState` currently declares no parameter (`Game.jsx:233`) while the
switch already passes `data` (`Game.jsx:253`). Accept it, and when `data.reason` is present,
show the corresponding copy as the lobby message — substituting `{{name}}` / `{{role}}` inline,
matching `Game.jsx:167`. With no reason (host pressed Return to Lobby) behaviour is unchanged.

`server.js` passes the reason through at the one call site:

```js
const reason = game.endRoundReason(player);
if (reason) {
  const abort = { reason, playerName: player.name };
  if (reason === "critical_role_left") abort.role = roleLabel(player);
  game.resetGame(abort);
} else {
  emitRoomToPlayers(game);
}
```

`role` is only meaningful for `critical_role_left`, so it is only set on that branch — the
`too_few_players` copy has no `{{role}}` placeholder.

`roleLabel(player)` is a small module-level helper in `server.js` mapping the leaver's
`gameRole` to display copy: `Roles.GAME.MASTER → "the Master"`, `Roles.GAME.INSIDER →
"the Insider"`. It is only ever called on the `critical_role_left` branch, where `gameRole` is
guaranteed to be one of those two by `wasCriticalRole`.

## Testing

Extends the existing files in their current fake-socket / fake-`io` style. No new harness.

**`tests/disconnect.test.js`**

- Master rotates to a different player across consecutive rounds.
- `playAgain()` after a departure assigns a valid Master instead of throwing *(regression: bug A)*.
- Rotation cursor survives `resetGame()` — two rounds separated by a lobby return still rotate.
- `nextMaster()` returns `null` on an empty roster rather than `undefined`.
- `endRoundReason` returns `"critical_role_left"` for Master and for Insider,
  `"too_few_players"` below the minimum, and `null` in the lobby or for a harmless departure.

**`tests/guessingFlow.test.js`**

- Active guesser leaves (roster stays at/above `MIN_PLAYERS`) → a *remaining* player holds the
  baton *(regression: bug B)*.
- A non-active player leaving does not disturb the current guesser.
- A departed player is never dealt a subsequent turn.
- The Master is still skipped in the rotation after a departure.
- No eligible guesser remaining → `onPlayerLeft` returns without throwing.

**`tests/voteFlow.test.js`**

- A tied candidate leaving during tie-break collapses the tie to the survivor.
- All tied candidates leaving resolves to `null` (insider team wins).

## Behaviour change to be aware of

Master rotation is a **gameplay** change, not just a crash fix: the same player no longer
masters every round. This was accepted deliberately — the stale-index code is the shared root
cause of bug A and of ROADMAP §4, and fixing it by identity resolves both. Called out here so it
is not mistaken for an unintended side effect of disconnect work.
