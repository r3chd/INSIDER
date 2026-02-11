"use client";

import { useState, useEffect } from 'react';
import { socket } from "../socket.js";

import Menu from '../components/menu/Menu.jsx';
import Lobby from '../components/Lobby/Lobby.jsx';
import Game from '../components/Game/Game.jsx';
import styles from './style.module.css';

export default function Home() {

    // State of connectivity
    const [isConnected, setIsConnected] = useState(false);
    const [transport, setTransport] = useState("N/A");

    // views
    const [activeView, setActiveView] = useState('menu');

    // information that the user should know
    const [roomPlayers, setRoomPlayers] = useState();

    // Unsure if needed
    const [activePlayerName, setActivePlayerName] = useState();

    // this runs when the "create" button is hit
    const handleCreate = (playerName) => { 
      // creates in backend
      socket.emit("createRoom", playerName);

      // repetition here
      setActivePlayerName(playerName);
      setActiveView('lobby');
    };

    const handleJoin = (roomCode, playerName) => {
      socket.emit("joinRoom", {roomCode, playerName})

      setActivePlayerName(playerName);
      setActiveView('lobby'); // Change to game HERE
    }

    // Connectivity code (connection and socket receiving)
    useEffect(() => {
        if (socket.connected) {
            onConnect();
        }

        function onConnect() {
            setIsConnected(true);
            setTransport(socket.io.engine.transport.name);

            socket.io.engine.on("upgrade", (transport) => {
                setTransport(transport.name);
            });
        }

        function onDisconnect() {
            setIsConnected(false);
            setTransport("N/A");
        }
        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        socket.on("roomUpdated", (data) => {
          console.log(data);
          // Need to display the data somewhere
        });

        socket.on("gameStarted", () => {
          setActiveView('game');
        })

        // Disables these codes i guess
        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
        };
        
    }, []);

  return (
    <div className={styles.container}>
      <div className={styles.main}>
          <div className={styles.logo}><img src='/assets/templogo.svg'></img> <p>insider</p></div>
        
        <div className={styles.content}>
          <Menu isActive={activeView === 'menu'}  
            handleCreate={handleCreate} 
            handleJoin={handleJoin} /> 
          <Lobby 
            isActive={activeView === 'lobby'} 
          />
          <Game isActive={activeView === 'game'} />

          <p>Transport: { transport }</p>
        </div>

      </div>
    </div>
  );
}
