
import React, { useEffect, useState } from 'react';


export default function Game() {
  const [playerList, setPlayerList] = useState([]);
  const [gameMessage, setGameMessage] = useState('Hey Chat');
  return (
    <div id="game">
      <h1>{gameMessage}</h1>


      <div id="board">
      </div>
      
    </div>
  );
}
