
import { useEffect, useState } from 'react';
import { socket } from "../../socket.js";
import styles from "./Game.module.css";
import PlayerDisplay from "../playerDisplay/PlayerDisplay.jsx";

export default function Lobby({ isActive }) {
  const [roomCode, setRoomCode] = useState('ERROR'); // Would be funny if the code generates the word 'ERROR'
  const [hostId, setHostId] = useState(null);

  return (
    <div className={`${styles.game} ${isActive ? styles.active : ""}`}>
      <div className={styles.gameInteractable}>
        <PlayerDisplay />
      </div>
    </div>
  );
}
