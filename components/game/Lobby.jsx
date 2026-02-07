
import { useEffect, useState } from 'react';
import { socket } from "../../socket.js";
import styles from "./Lobby.module.css";
import PlayerDisplay from "../playerDisplay/PlayerDisplay.jsx";
import MenuButton from "../menu/MenuButton.jsx";

export default function Game({ isActive }) {
  const [gameMessage, setGameMessage] = useState('Why does this show');
  const [lobbyCode, setLobbyCode] = useState('ERROR'); // Would be funny if the code generates the word 'ERROR'
  const [hostId, setHostId] = useState(null);

  const handleStartButtonPressed = () => {
    console.log("start butotn pressed");
  }



  useEffect(() => {
    const handleRoomUpdate = (data) => {
      setLobbyCode(data.code);
      setHostId(data.hostId);
      console.log("socket id id", socket.id);
      console.log("host id id", data.hostId);

      console.log("socket.id", typeof socket.id);
      console.log("hostId", typeof data.hostId);
      console.log(data.hostId == socket.id);

    }

    socket.on("roomUpdated", handleRoomUpdate)
  })


  return (
    <div className={`${styles.lobby} ${isActive ? styles.active : ""}`}>
      <div className={styles.lobbyInteractable}>
        <h1 className={styles.h1}>{gameMessage}</h1>

        <h1 className={styles.h1}>lobby code: {lobbyCode} </h1>
        <PlayerDisplay />

        <MenuButton children="start" onClick={handleStartButtonPressed} half={false} clickable={hostId === socket.id}/>
      </div>
    </div>
  );
}
