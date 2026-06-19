const RoomRoles = Object.freeze({
    LEADER: "Room Leader",
    MEMBER: "Room Member",
})

const GameRoles = Object.freeze({
    MASTER: "Master",
    INSIDER: "Insider",
    COMMONER: "Commoner"
});

const Roles = Object.freeze({
   ROOM: RoomRoles,
   GAME: GameRoles,
   UNDEFINED: "undefined"
});

export default Roles;
