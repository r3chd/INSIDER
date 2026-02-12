
import { useEffect, useState } from 'react';
import { socket } from "../../socket.js";
import styles from "./Lobby.module.css";
import PlayerDisplay from "../playerDisplay/PlayerDisplay.jsx";
import MenuButton from "../menu/MenuButton.jsx";

export default function Lobby({ isActive }) {
  const [roomCode, setRoomCode] = useState('ERROR'); // Would be funny if the code generates the word 'ERROR'
  const [hostId, setHostId] = useState(null);

  const handleStartButtonPressed = () => {
    console.log("start butotn pressed");
    socket.emit("startGame", roomCode);
  }



  useEffect(() => {
    const handleRoomUpdate = (data) => {
      setRoomCode(data.code);
      setHostId(data.hostId);
    }

    socket.on("roomUpdated", handleRoomUpdate)
  })


  return (
    <div className={`${styles.lobby} ${isActive ? styles.active : ""}`}>
      <div className={styles.lobbyInteractable}>

        <h1 className={styles.h1}>lobby code: {roomCode} </h1>
        <PlayerDisplay showEmpty={true}/>


        {hostId === socket.id && (
              <MenuButton children="start" onClick={handleStartButtonPressed} half={false} />
         )
        }
        
      </div>
    </div>
  );
}
