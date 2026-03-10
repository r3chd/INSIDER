
import { useEffect, useState } from 'react';
import { socket } from "../../socket.js";
import styles from "./Lobby.module.css";
import PlayerDisplay from "../playerDisplay/PlayerDisplay.jsx";
import MenuButton from "../menu/MenuButton.jsx";
import { MIN_PLAYERS } from "../constants/gameParam.js";

export default function Lobby({ isActive }) {
  const [roomCode, setRoomCode] = useState('ERROR'); // Would be funny if the code generates the word 'ERROR'
  const [hostId, setHostId] = useState(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [gameState, setGameState] = useState(null);
  
  const canStart = playerCount >= MIN_PLAYERS;

  const handleStartButtonPressed = () => {
    if (!canStart) return;
    console.log("start button pressed");
    socket.emit("startGame", roomCode);
  }

  // R: what is the point of this right now, to be able to click in the lobby. is it also to do with the 0 above each player lol
  const handleLobbyClick = (toPlayer) => {
    console.log("lobby clicked", toPlayer);
    // TEMP
  }

  useEffect(() => {
    const handleRoomUpdate = (data) => {
      setRoomCode(data.code);
      setHostId(data.hostId);
      setPlayerCount(data.players?.length ?? 0);
    }

    const handleStateUpdated = (data) => {
      setGameState(data);
      console.log(data);
    }

    socket.on("roomUpdated", handleRoomUpdate);
    socket.on("stateUpdated", handleStateUpdated);
  })


  return (
    <div className={`${styles.lobby} ${isActive ? styles.active : ""}`}>
      <div className={styles.lobbyInteractable}>

        <h1 className={styles.h1}>lobby code: {roomCode} </h1>
        <PlayerDisplay showEmpty={true} gameState={gameState} onCardClick={handleLobbyClick}/>

        {hostId === socket.id && (
          <>
            {!canStart && (
              <p className={styles.minPlayersHint}>
                Need at least {MIN_PLAYERS} players to start ({playerCount}/{MIN_PLAYERS}).
              </p>
            )}
            <MenuButton
              children="start"
              onClick={handleStartButtonPressed}
              half={false}
              disabled={!canStart}
            />
          </>
        )}
        
      </div>
    </div>
  );
}
