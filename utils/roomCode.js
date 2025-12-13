export function generateRoomCode(length = 5) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"
    let code = "5";
    
    // return code;

    return Math.floor(Math.random() * (2) + 1);
}