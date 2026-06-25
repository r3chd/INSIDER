# INSIDER

A web-based, real-time multiplayer implementation of the party game **Insider**.

Players join a shared room and race to guess a secret word during a timed Q&A round —
then vote to unmask the hidden traitor (the **Insider**) who knew the word all along.
The server is authoritative: it assigns roles, keeps the word secret, runs all timers,
and drives the transitions between game phases.

> 📖 Full game rules and design: [`INSIDER.md`](./INSIDER.md)
> 🗺️ Requirements, architecture, and remaining work: [`INSIDER_PLAN.md`](./INSIDER_PLAN.md)

---

## Tech Stack

| Layer    | Technology                                          |
|----------|-----------------------------------------------------|
| Frontend | React 19 + Next.js 16 (App Router)                  |
| Backend  | Custom Node HTTP server + Socket.IO (realtime)      |
| State    | In-memory (no database yet)                         |
| Tooling  | nodemon (dev reload), ESLint                         |

A single Node process serves **both** the Next.js UI and the Socket.IO server
(see `server.js`).

---

## Running the Project (for testing)

### Prerequisites

- **Node.js 20.9+** (Next.js 16 requirement; this repo is developed on Node 24/25)
- **npm** (ships with Node)

Check what you have installed:

```bash
node --version
npm --version
```

### Required packages

All dependencies are declared in `package.json` and installed with a single
`npm install`. For reference, the key ones are:

- **Runtime:** `next`, `react`, `react-dom`, `express`, `socket.io`, `socket.io-client`
- **Dev:** `nodemon`, `eslint`

### Steps

1. **Clone and enter the project**
   ```bash
   git clone https://github.com/r3chd/INSIDER.git
   cd INSIDER
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the dev server** (Next.js + Socket.IO with auto-reload via nodemon)
   ```bash
   npm run dev
   ```

4. **Open the app**

   Visit [http://localhost:3000](http://localhost:3000)

### Testing multiplayer locally

Each browser tab/window gets its own socket connection, i.e. counts as a **separate
player**. To play a full game:

1. In **tab 1**, enter a name and click **create** — note the room code shown in the lobby.
2. In **tabs 2, 3, 4…**, enter a name, click **join**, and type the room code.
   - A minimum of **4 players** (4 tabs) is currently required to start.
3. Back in the **host tab** (tab 1), click **start**.
4. Watch the phases play out: role/word setup → Q&A guessing → reveal → vote → result
   (the host can then **Play Again** or **Return to Lobby**).

> 💡 Use incognito/private windows or different browsers if tabs share state oddly.
> The server logs connections, room creation, and role assignment to the terminal —
> handy for debugging.

---

## Available Scripts

| Command         | What it does                                              |
|-----------------|-----------------------------------------------------------|
| `npm run dev`   | Start the dev server (`nodemon server.js`) with reload    |
| `npm run build` | Build the Next.js production bundle (`next build`)        |
| `npm start`     | Run the production server (`NODE_ENV=production`)         |
| `npm run lint`  | Run ESLint (`next lint`)                                  |
| `npm test`      | Run the unit tests (`node --test`, Node's built-in runner)|

---

## Project Structure

```
INSIDER/
├── server.js              # Custom server: Next.js + Socket.IO event handlers
├── socket.js              # Client-side Socket.IO connection
├── io.js                  # Server-side Socket.IO singleton (set/get)
├── app/                   # Next.js App Router UI
│   ├── page.js            # Main page: Menu / Lobby / Game view switching
│   └── layout.js
├── components/            # React UI components
│   ├── menu/              # Create / join screen
│   ├── Lobby/             # Lobby + start button
│   ├── Game/              # In-game UI (overlay, timer, buttons)
│   ├── playerDisplay/     # Player cards
│   ├── WordButton/        # Word-selection buttons
│   └── constants/         # Roles, game params, text
├── models/                # Backend game logic
│   ├── RoomManager.js     # Tracks all rooms
│   ├── Room.js            # A single room of players
│   ├── Player.js          # A connected player
│   ├── Game.js            # Game instance + state machine driver
│   └── states/            # SetupState → GuessingState → RevealState → VoteState
├── utils/                 # roomCode, wordService, insertText
└── public/assets/         # words.txt, logos/icons
```

---

## Current Status

Working end-to-end: room create/join, live lobby sync, host-gated start, role & word
assignment, the Q&A turn loop, the reveal screen, and the **voting phase** — vote tally,
win/lose resolution, a Master-decides tie-break, and a result screen with **Play Again /
Return to Lobby**.

**Not yet implemented:** the optional Follower role, Master rotation between rounds, a
runoff re-vote for ties, persistence, and robust disconnect handling.

See [`INSIDER_PLAN.md`](./INSIDER_PLAN.md) for the full breakdown and suggested build order.

> ⚠️ Note: `pages/index.js` is an old Pages-Router version kept for reference and is **not**
> the active entry point — the live UI lives in `app/`.
