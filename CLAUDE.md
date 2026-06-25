# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A real-time multiplayer web implementation of the party game **Insider** (rules in `INSIDER.md`).
The server is authoritative: it assigns roles, keeps the word secret, runs all timers, and drives
phase transitions. Clients only render state and forward player actions over Socket.IO.

## Commands

```bash
npm install        # install deps
npm run dev        # dev server with auto-reload (nodemon server.js) — http://localhost:3000
npm run build      # next build (production bundle)
npm start          # production server (NODE_ENV=production node server.js)
npm run lint       # next lint (ESLint 9)
```

`npm test` runs the Node built-in runner (`node --test`) over `tests/*.test.js` — currently the
vote/win-resolution logic (`tests/voteResolution.test.js` for the pure resolver, `tests/voteFlow.test.js`
for `VoteState` orchestration + reset). There is **no** browser/integration harness, so gameplay is
still exercised by hand: run `npm run dev` and open multiple browser tabs — **each tab is a separate
player/socket**. Create a room in tab 1 (note the room code), join from other tabs, then start from the
host tab. `MIN_PLAYERS` (4) tabs are required to start. The server logs connections, room/role
assignment, and emitted events to the terminal.

## Architecture

### Single process, two roles
`server.js` is the entry point (not `next dev`). One Node process serves **both** the Next.js UI and
the Socket.IO server: `app.prepare()` then `createServer(handler)` wraps the Next handler, and a
`socket.io` `Server` attaches to the same HTTP server. Module type is ESM (`"type": "module"`);
classes use private fields (`#field`).

### Socket.IO singletons
- `socket.js` — **client** singleton (`io()`), guarded for SSR (`{}` on the server).
- `io.js` — **server** singleton accessor: `server.js` calls `setIo(io)`, and any server module
  (e.g. states) reads it via `getIo()`.

### Server-authoritative state machine (the core)
The whole game is a state machine living in `models/`:

```
GameManager  →  Game  →  GameState (one of models/states/*)
 (all rooms)   (one room    LobbyState → SetupState → GuessingState → RevealState → VoteState
                + players,
                + word, host)
```

- `GameManager` owns a `Map` of all games keyed by room code; `createGame`, `getGame`, `addPlayer`.
- `Game` is the **room aggregate**: it holds `connectedPlayers`, the room `code`, `hostPlayer`,
  `masterPlayer`, `targetWord`, vote tallies, and the current `#state`. `Game.nextState()` is the
  hardcoded phase progression; `Game.setState()` calls `state.exit()` then `newState.enter()`.
- Each `GameState` (extends `GameState` base with `enter()/exit()/onPlayerAction()`) follows the
  same pattern: on `enter()` it emits a phase payload, registers `socket.once(...)` action handlers,
  and starts a `setTimeout(this.#duration)` → `handleTimerExpired()` → `game.nextState()`. Durations
  are per-state private fields (Setup 10s, Guessing 180s, Reveal 5s, Vote 18s). This repeated
  timer→nextState pattern is acknowledged tech debt and a candidate for shared base logic.
  `VoteState` is the **exception**: it does not call `nextState()`. On its 18s timer it tallies votes
  and resolves a winner, branching into a Master-decides tie-break (15s) when the lead is tied, then
  emits a terminal `result`. `Game.resetGame()` / `Game.playAgain()` return the room to `LobbyState`
  (Return to Lobby) or start a fresh round (Play Again).

### How server talks to clients (keep hidden info hidden)
- `Game.emit(event, data)` → broadcasts to the whole room (`io.to(code)`).
- `Game.emitToPlayer(socketId, event, data)` → one socket only. Used for per-player secrets:
  the Master's word options, each player's own `gameRole`, the secret word (Master + Insider only).
- `Game.toDTO(socketId)` builds a **per-socket view** of room state (`roomUpdated`), embedding
  `yourId` so the client knows which player it is and whether it is host.

### Client mirrors the server states
`components/Game/Game.jsx` is the in-game client. It listens for a single `stateChange` event with
shape `{ state, data }` and switches on `state`
(`"setup" | "guessing" | "reveal" | "vote" | "tiebreak" | "result" | "lobby"`) to drive local UI
(overlay, timer animation, guess button, guesser highlight, and the end-of-game result with the host's
Play Again / Return to Lobby controls). Timer payloads carry `startTime`/`endTime` so the client
animates a fill bar against wall-clock time.

`app/page.js` owns the **top-level view** (`menu` / `game`) **and the room state**. It listens for
`roomUpdated` / `joinError` and only switches to `game` once the server confirms a create/join — so a
bad/lowercase code keeps the joiner on the menu with an error instead of a phantom lobby. The confirmed
room flows **down as a `room` prop** to `Game` and `PlayerDisplay` (they no longer own a `roomUpdated`
listener, which avoids missing the first event during the mount). The shared timer `ref` is passed down too.

### Roles & constants
`components/constants/` holds enums/config imported by **both** server and client (unusual but
intentional): `rolesEnum.js` (`ROOM.LEADER/MEMBER` vs `GAME.MASTER/INSIDER/COMMONER`),
`gameParam.js` (`MIN_PLAYERS`, `MAX_PLAYERS`), `text.js` (overlay copy with `{{name}}` placeholders).
Note the two role axes: **room role** (host vs member) is separate from **game role** (assigned at
SetupState). `utils/wordService.js` loads `public/assets/words.txt` and returns 3 unique random words.

## Gotchas / known dead code

The README's "Project Structure" is partly aspirational — trust the code over it:
- **`models/Room.js` is entirely commented out.** `Game.js` is the real room aggregate.
  README references to `RoomManager.js`/`Room.js` are stale.
- **`pages/index.js` is dead** old Pages-Router code (imports a missing `Status.jsx`); the live UI is
  the App Router under `app/`. `models/states/GameContext.js` is an unused placeholder.
- **`app/page.js` has two `return` statements** — only the first renders; the second block is dead.
- **`GuessingState` references `this.#game.players`**, but `Game` only exposes `connectedPlayers`
  (no `players` getter) — this path is mid-refactor. `GuessingState.js` is the file currently being edited.
- **Disconnect handling is broken**: `players.delete[socket.id]` in `server.js` is a no-op on a `Map`;
  players are never removed from rooms and there's no host hand-off.
- **Player-count config is inconsistent**: `MIN_PLAYERS = 4` (code) vs 3 (design); `MAX_PLAYERS = 6`
  is defined but not enforced on join.
- **`VoteState` is now implemented** (tally → win resolution → Master-decides tie-break → `result`,
  plus host Play Again / Return to Lobby). Still missing: the **Follower role**, **Master rotation**
  (Play Again reuses the same Master), and a **runoff re-vote** (ties are settled by the Master, not a
  second vote). The Master cannot be voted out, enforced in `Game.votePlayer`.

`INSIDER.md` has full game rules and design; the README's plan section tracks requirements and the
suggested build order for the unfinished phases.
