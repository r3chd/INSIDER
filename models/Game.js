import { socket } from "../socket.js"
import { LobbyState } from "./states/LobbyState.js";
import { SetupState } from "./states/SetupState.js";
import { GuessingState } from "./states/GuessingState.js";
import { RevealState } from "./states/RevealState.js"
import { VoteState } from "./states/VoteState.js";
import Roles from "../components/constants/rolesEnum.js"

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
        this.#connectedPlayers.delete(player.id);
    }

    hasPlayer(playerId) {
        return this.#connectedPlayers.has(playerId);
    }

    handleClick(from, to) {
        if (this.#state instanceof LobbyState) {
            this.lobbyClick(from, to);
        } else if (this.#state instanceof VoteState) { // TODO set up the responding actions
            this.votePlayer(from, to);
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
