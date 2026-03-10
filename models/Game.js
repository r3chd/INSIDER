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


    constructor(code, io) {
        this.#code = code;
        this.#io = io;
        this.#state = new LobbyState(this);
        this.#targetWord = "not yet chosen"; // TEMP
    }

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

    toDTO(socketId) {
        // setup roles by conversion
        const players = Array.from(this.#connectedPlayers.values()).map(p => ({
                id: p.id,
                name: p.name,
                roomRole: p.roomRole,
                gameRole: p.gameRole,
                votes: p.votes
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

    get connectedPlayers() {
        return this.#connectedPlayers;
    }

    get code() {
        return this.#code;
    }

    start(connectedPlayers) {
        if (this.#started) return;
        this.#started = true;
        this.#roundCount = this.#connectedPlayers.size - 1; // 0 index
        this.nextState(); // move from lobby to setup
    }
    

    /// OLD BELOW ///




    #code;
    #io = null;
    #started = false;
    #state = null;
    #roundCount;
    #targetWord;
    #masterPlayer; // Current leader of round
    #wordFound;




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
}
