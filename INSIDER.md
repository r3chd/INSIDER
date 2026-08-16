# INSIDER — Project Requirements & Plan

A web-based, real-time multiplayer implementation of the party game **Insider**.
This document captures the **requirements** for the project, derived from the game
design in `INSIDER.md` and the current state of the codebase.

---

## 1. Project Summary

Players join a shared room and try to guess a secret word during a timed Q&A round,
then vote to identify a hidden traitor (the **Insider**). The server enforces role
secrecy, controls all timers, and drives phase transitions; clients only render state
and send player actions.

---

## 2. Tech Stack (as built)

| Layer      | Technology                                              |
|------------|---------------------------------------------------------|
| Frontend   | React 19 + Next.js 16 (App Router, `app/`)              |
| Backend    | Custom Node HTTP server (`server.js`) + Socket.IO       |
| Realtime   | `socket.io` / `socket.io-client` (WebSockets)           |
| State      | In-memory (`Map`s in `GameManager` and `Game`)          |
| Word data  | `public/assets/words.txt` via `utils/wordService.js`    |
| Tooling    | `nodemon` (dev), ESLint, `node --test` (unit tests)     |

**Constraint:** one Node process serves both the Next.js UI and the Socket.IO server.

---

## 3. Functional Requirements

### 3.1 Players & Rooms
- **FR-1** Support **3–8 players** per room (game design target).
- **FR-2** A player must provide a **non-empty name** to create or join a room.
- **FR-3** The host creates a room and receives a unique **5-character alphanumeric** room code.
- **FR-4** Other players join an existing room using its code; invalid codes are rejected.
- **FR-5** A player cannot join the same room twice with the same connection.
- **FR-6** The room list and player list stay **synchronized in real time** across all clients.
- **FR-7** Handle **disconnects**: remove the player from their room, update remaining
  players, and delete the room when it becomes empty.
- **FR-8** Promote a new host (or end the room) if the host disconnects.

### 3.2 Lobby & Game Start
- **FR-9** Only the **host** sees and can use the **Start** button.
- **FR-10** The game requires a **minimum player count** (`MIN_PLAYERS = 3`) to start; the start
  control is disabled with a clear hint until met.
- **FR-11** Enforce a **maximum player count** (`MAX_PLAYERS = 8`) on join — `GameManager.addPlayer`
  refuses the join and the joiner sees a `room_full` error.

### 3.3 Roles
- **FR-12** On game start, assign exactly one **Master** and one **Insider**; all others are **Commoners**.
- **FR-13** Add the optional **Follower** role when the lobby has **4+ players** *(not yet implemented)*.
- **FR-14** Reveal the **Master publicly**; keep every other role **hidden** from other players.
- **FR-15** Each player is privately told **their own role** only.
- **FR-16** Role rules:
  - **Master** — knows the word; cannot ask questions; cannot be voted for.
  - **Insider** — knows the word; on the Insider team; wins by getting the word guessed without being voted out.
  - **Follower** — on the Insider team; knows who the Insider is; protects the Insider.
  - **Commoner** — asks questions to find the word.

### 3.4 Word Selection
- **FR-17** Generate **3 unique random words** from the word list for the Master.
- **FR-18** The **Master selects** the secret word within the setup timer.
- **FR-19** If the Master doesn't choose in time, the server **auto-selects** a random word.
- **FR-20** Reveal the chosen word **only** to the Master and the Insider.

### 3.5 Q&A / Guessing Phase
- **FR-21** Run a configurable **Q&A timer** (default 3 minutes).
- **FR-22** Allocate a **turn order** and pass an "ask" action between non-Master players.
- **FR-23** The **Master** confirms when the word has been guessed (ends the phase early).
- **FR-24** Record the **Guesser** (player who guessed correctly).
- **FR-25** On timer expiry without a guess, mark the round **word not found** and continue.
- **FR-26** *(Hardening)* Validate that turn/guess actions come from the **authorized** player.

### 3.6 Reveal Phase
- **FR-27** Briefly show all players the **word** and whether it was **found**.

### 3.7 Discussion & Voting *(implemented — `VoteState`; Master-decides tie-break)*
- **FR-28** Run a configurable **discussion/vote timer** *(implemented as a fixed 18s vote
  timer; not yet host-configurable, see FR-34)*.
- **FR-29** *(Optional)* **Judge the Guesser** first: majority "yes" resolves the round based
  on whether the Guesser is the Insider. *(not implemented)*
- **FR-30** **Final Judgement:** each player votes for one other player before the timer expires.
  *(implemented; the Master cannot be voted for — enforced server-side in `Game.votePlayer`)*
- **FR-31** **Tie-break rules:** *(implemented as **Master-decides only** — a 15s step where the
  Master eliminates one of the tied candidates)*
  - Guesser not in the tie → the **Guesser** decides. *(not implemented — Master decides instead)*
  - Guesser in the tie → the **Master** decides. *(implemented)*
- **FR-32** **Win resolution:** *(implemented in `Game.resolveWinner`)*
  - Voted player **is** the Insider → **Insider team loses** (citizens win).
  - Voted player **is not** the Insider → **Insider team wins**.
  - Timer expires with **no votes** → **Insider team wins**.
  - Timer expires with votes → player with most votes is voted out.
- **FR-33** Display the **outcome / winning team** to all players. *(implemented — a `result`
  screen naming the winning team and the Insider, with host-only **Play Again** / **Return to
  Lobby** controls)*

### 3.8 Configurability
- **FR-34** Allow the host to adjust **timer durations** (Q&A, discussion).

---

## 4. Non-Functional Requirements
- **NFR-1 Authority** — the **server is authoritative**; clients never see hidden roles/word for others.
- **NFR-2 Realtime** — phase changes and player updates propagate within ~1s.
- **NFR-3 Consistency** — late-joining/refreshing clients can recover current room/game state.
- **NFR-4 Resilience** — reconnection support; a single disconnect must not crash the room.
- **NFR-5 Persistence (future)** — README targets MongoDB; current build is in-memory only.
- **NFR-6 Deployability** — frontend and backend hostable (single combined server today).

---

## 5. Architecture (current)

```
Client (React / Next.js app/)
  Menu ──create/join──┐
  Game  <── socket events (stateChange / roomUpdated)
        │        │
        ▼        ▼
====================  Socket.IO  ====================
server.js  ──▶ GameManager ──▶ Game ──start──▶ GameState
                                │
   LobbyState ─▶ SetupState ─▶ GuessingState ─▶ RevealState ─▶ VoteState
                (enter/exit/onPlayerAction + timer→nextState)         │
                                                                      ▼
                          tally ─▶ resolveWinner ─▶ [Master tie-break] ─▶ result
                          (resetGame / playAgain loop back to LobbyState)
```

- `io.js` — Socket.IO singleton accessor (`setIo` / `getIo`).
- `GameManager.js` — owns a `Map` of all `Game` rooms keyed by code (`models/Room.js` /
  `RoomManager.js` are dead/commented out; `Game` is the real room aggregate).
- `Game.js` — owns players, word, master, vote tally, and the active `GameState`; `nextState()`
  advances phases, while `resetGame()` / `playAgain()` return the room to `LobbyState`.
- Most states follow a `setTimeout → handleTimerExpired → nextState` pattern (candidate for shared
  base logic). **`VoteState` is the exception:** instead of calling `nextState()` it tallies votes,
  resolves a winner, optionally runs a 15s Master tie-break, then emits a terminal `result`.

---

## 6. Known Gaps & Tech Debt (to resolve)
- [x] **Voting phase** — implemented: `VoteState` tallies votes, resolves the winner
  (`Game.resolveWinner`), runs a Master-decides tie-break, and emits a terminal `result`
  with Play Again / Return to Lobby. Covered by unit tests (see below).
- [ ] **Master rotation** — `Play Again` reuses the **same Master** every round; the Master
  should rotate (or be re-randomized) between rounds.
- [ ] **Runoff / Guesser tie-break** — ties are settled by the Master only. The design's
  runoff re-vote and "Guesser decides" branch (FR-29, FR-31) are not implemented.
- [ ] **Follower role** not implemented (FR-13).
- [x] **Disconnect handling** — implemented: `server.js`'s `disconnect` resolves the leaver's room
  and calls `GameManager.removePlayer`; `Game.removePlayer` clears the leaver's cast vote and hands
  off `ROOM.LEADER` host on the host leaving; `Game.isEmpty()` reclaims empty rooms. An in-progress
  round bails to the lobby (`Game.shouldEndRound` → `resetGame()`) when a Master/Insider leaves
  (`Game.wasCriticalRole`) or the table drops below `MIN_PLAYERS` (4). `SetupState`/
  `RevealState` now cancel their phase timers on `exit()` so the bail-out can't leave a phantom round.
  Covered by `tests/disconnect.test.js` and `tests/stateTimers.test.js`.
- [ ] **Min/Max player counts** inconsistent across docs and code (3 vs 4; 6 vs 8); `MAX_PLAYERS`
  is defined but not enforced on join.
- [ ] **Dead code** — `pages/index.js` (old Pages-Router build, references missing `Status.jsx`,
  stale events) conflicts with the App Router; `models/states/GameContext.js` is an unused
  placeholder; `models/Room.js` is fully commented out.
- [ ] **No persistence** — server restart wipes all rooms.
- [ ] **No turn/action authorization** — clients could spoof `nextTurn` / `wordFound`.
- [~] **Automated tests** — vote/win resolution is covered (`tests/voteResolution.test.js`,
  `tests/voteFlow.test.js`, run via `npm test`); the rest of the flow is still hand-tested only.

---

## 7. Suggested Build Order
1. ~~Implement **VoteState**: collect votes, tally, tie-break, resolve winner, broadcast outcome.~~ ✅ done
2. ~~**Fix disconnect handling + host hand-off**~~ ✅ done (see §8). Next: clean up dead code
   (`pages/index.js`, `GameContext.js`, `models/Room.js`).
3. Reconcile and centralize player-count + timer config (MIN/MAX, enforce MAX on join).
4. **Master rotation** between rounds (so `Play Again` doesn't reuse the same Master).
5. Add the **Follower** role and 4+ player branching (FR-13).
6. Upgrade the tie-break: runoff re-vote / "Guesser decides" (FR-29, FR-31).
7. Add reconnection/state-recovery (NFR-3/4) and host-configurable timers (FR-34).
8. (Stretch) Persistence layer + separate frontend/backend hosting.

---

## 8. Disconnect Handling & Host Hand-off  ✅ *(done — see `ROADMAP.md` §1; next step is dead-code cleanup, §2)*

With a full round now playable end-to-end (setup → guessing → reveal → vote → result →
play again), the most valuable next step is **making rooms survive players leaving**, because
that's the first thing real multiplayer testing will break.

**Problem.** `server.js`'s `disconnect` handler is `players.delete[socket.id]` — that's a no-op
(it indexes the `delete` operator instead of calling `Map.prototype.delete`). Consequently:
- A player who closes their tab is never removed from `Game.connectedPlayers`, so they linger as a
  "ghost" in everyone's player list and still count toward `MIN_PLAYERS`.
- If the **host** disconnects, the room is stuck — start / Play Again / Return to Lobby are gated on
  `game.hostId === socket.id`, and the `ROOM.LEADER` is never reassigned, so no live socket matches.
- Empty rooms are never reclaimed from `GameManager`, so they leak.

**What already exists (just not wired up):** `GameManager.removePlayer(roomCode, player)` and
`GameManager.deleteGame(code)` are implemented, and `Game.removePlayer(player)` deletes from
`connectedPlayers`. The gaps are: `server.js`'s `disconnect` never calls them; `Game.isEmpty()`
(which `GameManager.removePlayer` already calls) does **not** exist; there is no host hand-off; and
nothing clears a leaver's vote or re-broadcasts the roster.

**Proposed work (server-authoritative, mirrors the existing emit pattern):**
1. Track which room each socket joined (or scan `GameManager`'s games) so `disconnect` can resolve
   the player's `Game`.
2. Add `Game.isEmpty()` (returns `connectedPlayers.size === 0`) so `GameManager.removePlayer`'s
   empty-room cleanup actually works, and have `Game.removePlayer` also drop any vote the leaver cast
   (clear them from `#voteMap` / `#voteTally`).
3. **Host hand-off:** if the leaver was the `ROOM.LEADER`, promote the next remaining player to
   `ROOM.LEADER` (the `hostId` getter already follows `ROOM.LEADER`, so the guards then track the new
   host automatically).
4. If the leaver was mid-game and was the **Master** or **Insider**, end the round gracefully
   (resolve / `resetGame()` back to `LobbyState`) rather than leaving an unwinnable game.
5. Re-broadcast `roomUpdated` (and a host-change/`stateChange` event) so every client reflects the
   new roster and host immediately.

**Tests first (TDD):** add `tests/disconnect.test.js` covering — non-host leaves (roster shrinks,
count drops), host leaves (next player becomes the new `hostId`), last player leaves (room removed
via `isEmpty`), and a voter leaving clears their tally entry. Then implement `isEmpty` + the
`disconnect` wiring + host promotion to green.
