const VALID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
const LENGTH = 5;

export function generateRoomCode(length = 5) {
    
    let code = "";
    
    for (let i = 0; i < LENGTH; i++) {
        code += VALID_CHARS[Math.floor(Math.random() * VALID_CHARS.length)]
    }

    return code;
}
