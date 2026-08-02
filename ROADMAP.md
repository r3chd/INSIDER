# INSIDER — Roadmap & Future Feature Implementations

A reference list of the work remaining on the project, ordered roughly by value/dependency.
The core single-round loop (create/join → setup → guessing → reveal → **vote** → result →
Play Again / Return to Lobby) is **done**. Everything below is what's left.

Sources of truth: requirements in `INSIDER.md` (FR-/NFR- IDs referenced below), rules in
`INSIDER.md`, architecture notes in `CLAUDE.md`.

Status legend: ☐ not started · ◐ partial · ☑ done

---

## 1. Disconnect handling & host hand-off  ☑  *(done)*

**Why first:** the first thing real multiplayer testing breaks. Relevant: FR-7, FR-8, NFR-4.

**Done:** `server.js`'s `disconnect` now resolves the leaver's room (tracked per-socket as
`currentRoomCode`) and calls `gameManager.removePlayer`. `Game.removePlayer` drops the leaver's
cast vote (`#removeVote`) and, if they were the `ROOM.LEADER`, promotes the next remaining player
to host (keeping `#hostPlayer` in sync). `Game.isEmpty()` lets `GameManager` reclaim empty rooms.
If the departure doesn't break the round the roster is just re-broadcast (`roomUpdated`); otherwise the
round bails to the lobby via `resetGame()`. `Game.shouldEndRound(leaver)` makes that call: a round in
progress ends when the **Master or Insider** leaves (`Game.wasCriticalRole`) **or** the table drops
below `MIN_PLAYERS` (4). That reset exposed a latent bug — `SetupState`/`RevealState` never cancelled their
phase timers on `exit()` — now fixed so a stale timer can't start a phantom round. Covered by
`tests/disconnect.test.js` and `tests/stateTimers.test.js`.

**Round reactions (follow-up):** the above only kept the roster in sync — it didn't make the *round
itself* react. `GameState.onPlayerLeft(player)` is a new overridable hook that `Game.removePlayer`
calls as its final statement, so any phase can respond to a departure. `GuessingState` uses it to
re-route the turn to a remaining player immediately if the active guesser disconnects, instead of
stalling until the phase timer expires. `VoteState.onPlayerLeft` drops departed players from the
tie-break candidate list so the Master is never asked to pick a ghost. `Game.endRoundReason(leaver)`
names *why* an in-progress round has to end (`"critical_role_left"` | `"too_few_players"`), and
`resetGame(abort)` carries that reason (plus `TEXT.abort` copy) to the client so players see who left
and why, instead of a bare "not assigned" message. Covered by the expanded `tests/disconnect.test.js`,
`tests/guessingFlow.test.js`, and `tests/voteFlow.test.js` (32 → 49 tests total).

**Problem:** `server.js`'s `disconnect` handler is `players.delete[socket.id]` — a no-op (it
indexes the `delete` operator instead of calling `Map.prototype.delete`). Consequences:
- Closed tabs linger as "ghost" players and still count toward `MIN_PLAYERS`.
- If the **host** disconnects, the room is stuck — start / Play Again / Return to Lobby are
  gated on `game.hostId === socket.id` and `ROOM.LEADER` is never reassigned.
- Empty rooms are never reclaimed from `GameManager` (leak).

**Already exists (just not wired up):** `GameManager.removePlayer(roomCode, player)`,
`GameManager.deleteGame(code)`, `Game.removePlayer(player)`.

**Work:**
1. Resolve the leaver's `Game` on `disconnect` (track each socket's room, or scan `GameManager`).
2. Add `Game.isEmpty()` (`connectedPlayers.size === 0`) so `GameManager.removePlayer`'s
   empty-room cleanup actually fires; have `Game.removePlayer` also clear the leaver's vote
   from `#voteMap` / `#voteTally`.
3. **Host hand-off:** if the leaver was `ROOM.LEADER`, promote the next remaining player to
   `ROOM.LEADER` (the `hostId` getter follows `ROOM.LEADER`, so guards track the new host).
4. If the leaver was the **Master** or **Insider** mid-game, end the round gracefully
   (resolve / `resetGame()` back to `LobbyState`) instead of leaving an unwinnable game.
5. Re-broadcast `roomUpdated` (+ a host-change / `stateChange`) so clients reflect the new roster.

**Tests first (TDD), `tests/disconnect.test.js`:** non-host leaves (roster shrinks, count drops);
host leaves (next player becomes new `hostId`); last player leaves (room removed via `isEmpty`);
voter leaves (their tally entry is cleared).

---

## 2. Clean up dead code  ☐  *(next step)*

Remove/retire code that conflicts with the live App Router build:
- `models/states/GameContext.js` — unused placeholder.
- `models/Room.js` — fully commented out (`Game.js` is the real room aggregate).
- `app/page.js` — has a second, dead `return` block (only the first renders).
- `utils/insertText.js` — dead: imports a non-existent named `{ TEXT }` from
  `components/constants/text.js` (which only has a default export, so the import is `undefined`),
  and its replace regex matches the literal string `{{varName}}` rather than interpolating the
  variable name, so it could never have substituted a real placeholder like `{{name}}` anyway.
- `npm run lint` is stale and broken: `next lint` was removed in recent Next.js versions, so the
  script fails immediately (`Invalid project directory provided, no such directory: .../lint`).
  Confirmed pre-existing, not caused by any work on `disconnect-round-reactions` — it fails the
  same way on the pre-branch baseline (`8433f96`). Not fixed here, just flagged so `npm run lint`
  in `CLAUDE.md` isn't trusted at face value.

---

## 3. Reconcile & centralize player-count + timer config  ☐

Relevant: FR-1, FR-10, FR-11.
- **Min players:** design says **3**, code uses **4** (`MIN_PLAYERS`, `MIN_PLAYERS_TO_START`).
  Pick one and apply everywhere.
- **Max players:** design says **8**, code defines `MAX_PLAYERS = 6` and **does not enforce it
  on join**. Enforce on join and reconcile the number.
- Centralize these (and timer durations) in one config location instead of scattered constants.

---

## 4. Master rotation between rounds  ☑  *(done)*

Relevant: §6 tech debt. Play Again used to reuse the same Master every round — worse, the Master was
tracked by a frozen array index set at `start()`, so a shrunken roster (a player left mid-game) could
point past the end of the array and leave the Master `null`, crashing `SetupState`. Fixed by tracking
the Master by player id instead: `Game.nextMaster()` walks the connected-player map from a rotation
cursor (`#lastMasterId`, which deliberately survives the round reset) and wraps around, so `playAgain()`
after a departure always assigns a valid Master instead of throwing.

---

## 5. Follower role  ☐

Relevant: FR-13, FR-16.
- Add the optional **Follower** role, activated when the lobby has **4+ players**.
- Follower is on the **Insider team**, **knows who the Insider is**, and protects them.
- Update role assignment in `SetupState`, the per-player private role reveal, and win resolution
  so the Follower is counted on the Insider side.

---

## 6. Upgrade the tie-break (runoff / "Guesser decides")  ◐

Relevant: FR-29, FR-31. Currently implemented as **Master-decides only** (a 15s step).
- **"Guesser decides" branch:** when the Guesser is **not** among the tied candidates, the
  **Guesser** breaks the tie (not the Master).
- **Runoff re-vote:** add a second vote round between tied candidates instead of settling every
  tie by a single person's decision.
- *(Optional, FR-29)* **Judge the Guesser** step before the final vote: a majority "yes" resolves
  the round based on whether the Guesser is the Insider.

---

## 7. Reconnection / state recovery + host-configurable timers  ☐

- **Reconnection / state recovery** (NFR-3, NFR-4): a refreshing or late-joining client can
  recover the current room/game state rather than landing in a blank/limbo view.
- **Host-configurable timers** (FR-34): let the host adjust Q&A and discussion/vote durations
  before/at start (depends on the centralized timer config from step 3).

---

## 8. Action authorization hardening  ☐

Relevant: FR-26, NFR-1. Clients can currently spoof `nextTurn` / `wordFound`. Validate that
turn/guess/vote actions originate from the **authorized** player before applying them
server-side (the server is authoritative — don't trust the emitter).

---

## 9. (Stretch) Persistence + deployability  ☐

Relevant: NFR-5, NFR-6. Current build is in-memory only — a server restart wipes all rooms.
- Add a persistence layer (README targets **MongoDB**).
- Optionally split frontend/backend hosting (today a single combined Node process).

---

## 10. Broaden automated test coverage  ◐

Only vote/win resolution is covered today (`tests/voteResolution.test.js`,
`tests/voteFlow.test.js`, run via `npm test`). The rest of the flow is hand-tested only. Add
coverage as each feature above lands (disconnect, role assignment incl. Follower, Master
rotation, tie-break branches, config enforcement).

**Now covered:** Master rotation (`nextMaster()`'s cursor wrap-around, `playAgain()` after a
departure), abort reason codes (`endRoundReason` → `critical_role_left` / `too_few_players`), the
guessing baton re-route on disconnect, and tie-candidate pruning in `VoteState.onPlayerLeft` — see
`tests/disconnect.test.js`, `tests/guessingFlow.test.js`, `tests/voteFlow.test.js` (32 → 49 tests).
Still hand-tested only: role assignment (incl. the unbuilt Follower role), the unbuilt tie-break
branches (§6), and player-count/timer config enforcement (§3).
