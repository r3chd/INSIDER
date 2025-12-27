
import React, { useEffect, useState } from 'react';
import styles from "./Game.module.css";

export default function Game({ isActive, roomCode, playerName }) {
  const [gameMessage, setGameMessage] = useState('Why does this show');
  return (
    <div className={`${styles.game} ${isActive ? styles.active : ""}`}>
      <h1>{gameMessage}</h1>
      <p>connected room: {roomCode} - room code </p>
      <p> name: {playerName} </p>
      <p> list of connected players: </p>
      <div id="board">
      </div>
      
    </div>
  );
}
