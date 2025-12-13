
import React, { useEffect, useState } from 'react';
import styles from "./Game.module.css";

export default function Game({ isActive, roomCode, connectedPlayers: connectedRoom }) {
  const [playerList, setPlayerList] = useState([]);
  const [gameMessage, setGameMessage] = useState('Why does this show');
  return (
    <div className={`${styles.game} ${isActive ? styles.active : ""}`}>
      <h1>{gameMessage}</h1>
      <p>{roomCode}</p>
      <p>connected room: {connectedRoom}</p>
      <div id="board">
      </div>
      
    </div>
  );
}
