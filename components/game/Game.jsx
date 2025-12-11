
import React, { useEffect, useState } from 'react';
import styles from "./Game.module.css";

export default function Game({ isActive }) {
  const [playerList, setPlayerList] = useState([]);
  const [gameMessage, setGameMessage] = useState('Why does this show');
  return (
    <div className={`${styles.game} ${isActive ? styles.active : ""}`}>
      <h1>{gameMessage}</h1>


      <div id="board">
      </div>
      
    </div>
  );
}
