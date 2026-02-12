
import { useEffect, useState } from 'react';
import { socket } from "../../socket.js";
import styles from "./Game.module.css";
import PlayerDisplay from "../playerDisplay/PlayerDisplay.jsx";

export default function Lobby({ isActive }) {
  const [roomCode, setRoomCode] = useState('ERROR'); // Would be funny if the code generates the word 'ERROR'
  const [hostId, setHostId] = useState("not assigned");

  const [currentPlayerRole, setCurrentPlayerRole] = useState("not assigned");
  const [targetWord, setTargetWord] = useState(null);

  useEffect(() => {
    const handleSetRole = (data) => {
      setCurrentPlayerRole(data.role);
    }

    const handleWordAssigned = (data) => {
      setTargetWord(data.word);
      console.log(data.word);
    }

    socket.on("roleAssigned", handleSetRole);
    socket.on("wordAssigned", handleWordAssigned);
  })


  return (
    <div className={`${styles.game} ${isActive ? styles.active : ""}`}>
      <div className={styles.gameInteractable}>
        <h1 className={styles.h1}> {currentPlayerRole} </h1>e
        <h1 className={styles.h1}> {`Your target is: ${targetWord || ""}`}</h1>
        <PlayerDisplay showEmpty={false}/>
      </div>
    </div>
  );
}
