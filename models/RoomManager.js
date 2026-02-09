import Room from "./Room.js";

import { generateRoomCode } from "../utils/roomCode.js"


export default class RoomManager {
    #rooms = new Map();

    createRoom() {

        // Code creation
        let roomCode;
        do {
            roomCode = generateRoomCode();
        } while (this.#rooms.has(roomCode));
        
        const room = new Room(roomCode);
        this.#rooms.set(roomCode, room);

        return room;
    }

    getRoom(code) {
        return this.#rooms.get(code);
    }

    deleteRoom(code) {
        this.#rooms.delete(code);
    }

    addPlayer(room, player) {
        if (!room) {
            return;
        }

        room.addPlayer(player);
    }

    removePlayer(roomCode, player) {
        const room = this.getRoom(roomCode);
        if (!room) {
            return;
        }

        room.removePlayer(player);

        if (room.isEmpty()) {
            this.deleteRoom(roomCode);
        }
    }
}