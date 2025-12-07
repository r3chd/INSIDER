'use client'; // This must be a Client Component
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client'; // Import the client library


const SOCKET_SERVER_URL = 'https://localhost:4000';
const socket = io(SOCKET_SERVER_URL);

export default function Game() {
  const [playerList, setPlayerList] = useState([]);
  const [gameMessage, setGameMessage] = useState('Hey Chat');

  // This useEffect hook handles the client-side Socket.IO logic
  useEffect(() => {
    // 1. Listen for player list updates or other game events
    socket.on('player_update', (list) => {
        setPlayerList(list);
    });

    // 2. Add other Socket.IO listeners here (e.g., 'game_state_update')
    // For now, we'll keep the connection simple.

    // 3. Cleanup function to disconnect listeners when component unmounts
    return () => {
      socket.off('player_update');
      // socket.disconnect(); // Only disconnect if you want the connection to close fully
    };
  }, []);

  return (
    <div id="game">
      <h1>{gameMessage}</h1>
      <div id="board">
        {/* Your game board logic will go here */}
      </div>
      
      {/* <p id="player-list">
        Players: {playerList.length > 0 ? playerList.join(', ') : 'Waiting for players...'}
      </p> */}
    </div>
  );
}
