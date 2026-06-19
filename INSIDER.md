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
| State      | In-memory (`Map`s in `RoomManager`, `Room`, `Game`)     |
| Word data  | `public/assets/words.txt` via `utils/wordService.js`    |
| Tooling    | `nodemon` (dev), ESLint                                  |

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
- **FR-10** The game requires a **minimum player count** to start; the start control is
  disabled with a clear hint until met.
  > ⚠️ Reconcile the threshold: design doc says **3**, code uses **4**
  > (`MIN_PLAYERS`, `MIN_PLAYERS_TO_START`). Pick one and apply everywhere.
- **FR-11** Enforce a **maximum player count** on join (design = 8; code currently `MAX_PLAYERS = 6`).

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

### 3.7 Discussion & Voting *(largely unimplemented — primary remaining work)*
- **FR-28** Run a configurable **discussion/vote timer** (design default 2 minutes).
- **FR-29** *(Optional)* **Judge the Guesser** first: majority "yes" resolves the round based
  on whether the Guesser is the Insider.
- **FR-30** **Final Judgement:** each player votes for one other player before the timer expires.
- **FR-31** **Tie-break rules:**
  - Guesser not in the tie → the **Guesser** decides.
  - Guesser in the tie → the **Master** decides.
- **FR-32** **Win resolution:**
  - Voted player **is** the Insider → **Insider team loses**.
  - Voted player **is not** the Insider → **Insider team wins**.
  - Timer expires with **no votes** → **Insider team wins**.
  - Timer expires with votes → player with most votes is voted out.
- **FR-33** Display the **outcome / winning team** to all players.

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
  Lobby ──start──┐    │
  Game  <── socket events
        │        │    │
        ▼        ▼    ▼
====================  Socket.IO  ====================
server.js  ──▶ RoomManager ──▶ Room ──start──▶ Game
                                              │
        SetupState ─▶ GuessingState ─▶ RevealState ─▶ VoteState
        (state machine: enter/exit/onPlayerAction + timer→nextState)
```

- `io.js` — Socket.IO singleton accessor (`setIo` / `getIo`).
- `Game.js` — owns players, word, master, and the active `GameState`; `nextState()` advances phases.
- Each state follows a `setTimeout → handleTimerExpired → nextState` pattern (candidate for shared base logic).

---

## 6. Known Gaps & Tech Debt (to resolve)
- [ ] **Voting phase** unimplemented — `VoteState.handleTimerExpired` is a `TODO`; no vote tally, tie-break, or win resolution.
- [ ] **Follower role** not implemented.
- [ ] **Disconnect handling** broken — `delete players[socket.id]` doesn't work on a `Map`; players never removed from rooms; no host hand-off.
- [ ] **Min/Max player counts** inconsistent across docs and code (3 vs 4; 6 vs 8).
- [ ] **Dead code** — `pages/index.js` (old Pages-Router build, references missing `Status.jsx`, stale events) conflicts with the App Router; `models/states/GameContext.js` is an unused placeholder.
- [ ] **No persistence** — server restart wipes all rooms.
- [ ] **No turn/action authorization** — clients could spoof `nextTurn` / `wordFound`.
- [ ] **No automated tests**.

---

## 7. Suggested Build Order
1. Clean up dead code (`pages/`, `GameContext.js`) and fix disconnect/cleanup bugs.
2. Reconcile and centralize player-count + timer config.
3. Implement **VoteState**: collect votes, tally, tie-break, resolve winner, broadcast outcome.
4. Add the **Follower** role and 4+ player branching.
5. Add reconnection/state-recovery (NFR-3/4).
6. Add host-configurable timers (FR-34).
7. (Stretch) Persistence layer + separate frontend/backend hosting.
