
import React, { useEffect, useState } from 'react';
import styles from "./Game.module.css";
// import PlayerCard from "../playerCard/PlayerCard.jsx";

export default function Game({ isActive, playerName }) {
  const [gameMessage, setGameMessage] = useState('Why does this show');
  return (
    <div className={`${styles.game} ${isActive ? styles.active : ""}`}>
      <h1>{gameMessage}</h1>
      <p> name: {playerName} </p>
      <p> list of connected players: </p>
      <div id="board">
      </div>

      {/* <PlayerCard /> */}
      
    </div>
  );
}
