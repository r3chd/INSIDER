import { socket } from "../socket.js"
import { LobbyState } from "./states/LobbyState.js";
import { SetupState } from "./states/SetupState.js";
import { GuessingState } from "./states/GuessingState.js";
import { RevealState } from "./states/RevealState.js"
import { VoteState } from "./states/VoteState.js";
import Roles from "../components/constants/rolesEnum.js"
import { MIN_PLAYERS } from "../components/constants/gameParam.js"

export default class Game {

    #connectedPlayers = new Map();
    #hostPlayer;
    #voteMap;
    #voteTally;

    constructor(code, io) {
        this.#code = code;
        this.#io = io;
        this.#state = new LobbyState(this);
        this.#targetWord = "not yet chosen"; // TEMP
        this.#voteMap = new Map(); 
        this.#voteTally = new Map();
    }

    #code;
    #io = null;
    #started = false;
    #state = null;
    #roundCount;
    #targetWord;
    #masterPlayer; // Current leader of round
    #wordFound;


    addPlayer(player) {
        this.#connectedPlayers.set(player.id, player);
        console.log(`player ${player.name}, ${player.id} added to ${this.#code}. they have role ${player.roomRole}`)
        
        // set host player
        if (player.roomRole === Roles.ROOM.LEADER) {
            this.#hostPlayer = player; // Distinguish from current role (e.g. master)
        }

        // Emit update to people
        for (const player of this.#connectedPlayers.values()) {
            if (player.id === this.#hostPlayer.id) {
                player.roomRole = Roles.ROOM.LEADER;
            } else {
                player.roomRole = Roles.ROOM.MEMBER;
            }

            player.socket.emit("roleAssigned", {
                role: player.roomRole,
                masterId: this.#hostPlayer.id
            })
        }
    }

    removePlayer(player) {
        const wasHost = player.roomRole === Roles.ROOM.LEADER;

        this.#connectedPlayers.delete(player.id);
        this.#removeVote(player.id); // leavers vote removed from total

        // give host role to next player if the host fucking dc's
        if (wasHost) {
            const next = this.#connectedPlayers.values().next().value;
            if (next) {
                next.roomRole = Roles.ROOM.LEADER;
                this.#hostPlayer = next; // cache new host player
            } else {
                this.#hostPlayer = null;
            }
        }
    }

    // drop a single voter's contribution from the tally
    #removeVote(voterId) {
        const previousVote = this.#voteMap.get(voterId);
        if (previousVote === undefined) return;

        this.#voteMap.delete(voterId);
        const prevCount = this.#voteTally.get(previousVote);
        if (prevCount <= 1) {
            this.#voteTally.delete(previousVote);
        } else {
            this.#voteTally.set(previousVote, prevCount - 1);
        }
    }

    // no players left then reclaim the room code for GameManager
    isEmpty() {
        return this.#connectedPlayers.size === 0;
    }

    // check if leaver role is important for gmae to work (FR-32)
    wasCriticalRole(player) {
        return player.gameRole === Roles.GAME.MASTER || player.gameRole === Roles.GAME.INSIDER;
    }

    // round in progress (not in lobby state)
    get inProgress() {
        return !(this.#state instanceof LobbyState);
    }

    // check if game should still run (cirtical role left or not enough players)
    shouldEndRound(leaver) {
        if (!this.inProgress) return false;
        return this.wasCriticalRole(leaver) || this.#connectedPlayers.size < MIN_PLAYERS;
    }

    hasPlayer(playerId) {
        return this.#connectedPlayers.has(playerId);
    }

    handleClick(from, to) {
        if (this.#state instanceof LobbyState) {
            this.lobbyClick(from, to);
        } else if (this.#state instanceof VoteState) {
            // either a normal vote, or the Master's tie-break pick click depending on da state
            this.#state.onClick(from, to);
        }
        // if game state = yada yada yada

        // else if yada yada 

    }

    lobbyClick(from, to) {
        console.log ("ahahahaha");
    }

    votePlayer(from, to) {
        if (from === to) return;
        // can't vote for no master fool
        if (to === this.#masterPlayer?.id) return;
        const previousVote = this.#voteMap.get(from);
        // see if a vote has already been cast
        if (previousVote === to) return; // no change needed

        if (previousVote !== undefined) {
            // vote has been cast before
            const prevCount = this.#voteTally.get(previousVote);
            if (prevCount <= 1) {
                // delete entry if zero votes
                this.#voteTally.delete(previousVote);
            } else {
                // subtract by one otherwise
                this.#voteTally.set(previousVote, prevCount - 1);
            }
        }

        this.#voteMap.set(from, to);

        this.#voteTally.set(to, (this.#voteTally.get(to) || 0) + 1)

        console.log(this.#voteTally);

        this.emit("updateVotes", Object.fromEntries(this.#voteTally));

    }

    // get the current insider ooo scary (FR-32)
    get insiderPlayer() {
        for (const player of this.#connectedPlayers.values()) {
            if (player.gameRole === Roles.GAME.INSIDER) return player;
        }
        return undefined;
    }

    // whoever got the most votes getting slimed out or null if they aint got votes (FR-32)
    getTopVoteCandidates() {
        let maxVotes = 0;
        let candidates = [];
        for (const [id, count] of this.#voteTally.entries()) {
            if (count > maxVotes) {
                maxVotes = count;
                candidates = [id];
            } else if (count === maxVotes) {
                candidates.push(id);
            }
        }
        return { candidates, maxVotes };
    }

    // results of voting phase based on who got slimed (FR-32):
    //   voted out IS the insider -> citizens win
    //   voted out is NOT the insider or nobody was -> insider team wins
    resolveWinner(votedOutId) {
        if (votedOutId == null) return "insider";
        return votedOutId === this.insiderPlayer?.id ? "citizens" : "insider";
    }

    // clear all votes and reset the vote tally (FR-32)
    clearVotes() {
        this.#voteMap.clear();
        this.#voteTally.clear();
    }

    // reset all da bullshit
    #resetRound() {
        this.clearVotes();
        this.#masterPlayer = null;
        this.#targetWord = "not yet chosen";
        this.#wordFound = false;
        for (const player of this.#connectedPlayers.values()) {
            player.gameRole = Roles.UNDEFINED;
        }
    }

    // push a fresh per-socket room view to everyone after reset
    #broadcastRoom() {
        for (const player of this.#connectedPlayers.values()) {
            this.emitToPlayer(player.id, "roomUpdated", this.toDTO(player.id));
        }
    }

    // return to lobby w/ same player (FR-32)
    resetGame() {
        this.#resetRound();
        this.#started = false;
        this.setState(new LobbyState(this)); // exit() of the current state clears its timer
        this.emit("stateChange", { state: "lobby", data: {} });
        this.#broadcastRoom();
    }

    // player again w/ same players (FR-32)
    // CURRENTLY DOESN'T REASSIGN ROLES OR WORDS IMPORTANT!!!
    playAgain() {
        this.#resetRound();
        this.setState(new SetupState(this)); // re-assigns roles + word, then runs the phases
    }

    toDTO(socketId) {
        // setup roles by conversion
        const players = Array.from(this.#connectedPlayers.values()).map(p => ({
                id: p.id,
                name: p.name,
                roomRole: p.roomRole,
                gameRole: p.gameRole
            }))

        const hostPlayer = players.find(p => p.roomRole === Roles.ROOM.LEADER);
        console.log("processing room update");
        return {
            code: this.#code,
            players,
            hostId: hostPlayer ? hostPlayer.id : null,
            yourId: socketId
        }
    }

    start(connectedPlayers) {
        if (this.#started) return;
        this.#started = true;
        this.#roundCount = this.#connectedPlayers.size - 1; // 0 index
        this.nextState(); // move from lobby to setup
    }




    setState(newState) {
        this.#state?.exit?.();
        this.#state = newState;
        this.#state.enter();
    }

    nextState() {
        if (this.#state instanceof LobbyState) {
            this.setState(new SetupState(this));
        } else if (this.#state instanceof SetupState) {
            this.setState(new GuessingState(this));
        } else if (this.#state instanceof GuessingState) {
            this.setState(new RevealState(this));
        } else if (this.#state instanceof RevealState) {
            this.setState(new VoteState(this));
        }

    }

    emit(event, data) { // To a room - everyone should know
        console.log("emitting", event, data)
        if (data === undefined) {
            this.#io.to(this.#code).emit(event); // Where data is not necessary
            return;
        }
        
        this.#io.to(this.#code).emit(event, data);
    }

    emitToPlayer(socketId, event, data) { // To a person - only they should know
        if (data === undefined) {
            this.#io.to(socketId).emit(event); // Where data is not necessary
            return;
        }
        
        this.#io.to(socketId).emit(event, data);
    }

    get roundCount() {
        return this.#roundCount;
    }

    set targetWord(targetWord){
        this.#targetWord = targetWord;
    }

    get targetWord() {
        return this.#targetWord;
    }

    set masterPlayer(masterPlayer) {
        this.#masterPlayer = masterPlayer;
    }

    get masterPlayer() {
        return this.#masterPlayer;
    }

    // the current room host's socket id (the LEADER)
    get hostId() {
        for (const player of this.#connectedPlayers.values()) {
            if (player.roomRole === Roles.ROOM.LEADER) return player.id;
        }
        return null;
    }

    set wordFound(wordFound) {
        this.#wordFound = wordFound;
    }

    get wordFound() {
        return this.#wordFound;
    }

    get state() {
        return this.#state;
    }

    get connectedPlayers() {
        return this.#connectedPlayers;
    }

    // player map referred to as 'player' in states
    get players() {
        return this.#connectedPlayers;
    }

    get code() {
        return this.#code;
    }
}
