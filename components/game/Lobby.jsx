
import { useEffect, useState } from 'react';
import { socket } from "../../socket.js";
import styles from "./Lobby.module.css";
import PlayerCard from "../playerCard/PlayerCard.jsx";

export default function Game({ isActive }) {
  const [gameMessage, setGameMessage] = useState('Why does this show');
  
  const [lobbyCode, setLobbyCode] = useState('ERROR'); // Would be funny if the code generates the word 'ERROR'


  useEffect(() => {
    const handleCodeUpdate = (code) => {
      console.log(code);
      setLobbyCode(code);
    }

    socket.on("roomCreated", handleCodeUpdate)

  })


  return (
    <div className={`${styles.lobby} ${isActive ? styles.active : ""}`}>
      <div className={styles.lobbyInteractable}>
        <h1 className={styles.h1}>{gameMessage}</h1>

        <h1 className={styles.h1}>lobby code: {lobbyCode} </h1>
        <PlayerCard />
      </div>
    </div>
  );
}
