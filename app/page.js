"use client";

import { useState, useEffect } from 'react';
import { socket } from "../socket.js";

import Menu from '../components/menu/Menu.jsx';
import Game from '../components/game/Game.jsx';
import Status from '../components/Status.jsx';
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
      setActiveView("game");
    };

    const handleJoin = (roomCode, playerName) => {
      socket.emit("console", roomCode); // Did this fix it? Unsure.
      socket.emit("joinRoom", {roomCode, playerName})

      setActivePlayerName(playerName);
      setActiveView("game");
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
        socket.on("updatePlayers", (players) => {
            console.log("HELLO FUCKING LOW?")
            setRoomPlayers(players);
            socket.emit("console", players);
            console.log("WHAT THE FUCK") // lmao richard
        });

        socket.on("roomUpdated", (data) => {
          console.log(data);
          // Need to display the data somewhere
        });
        
        socket.on("Players", (room) => {
          // Code should simply 'get' the players list from the backend.
        })

        // Disables these codes i guess
        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("updatePlayers")
        };
        
    }, []);

  return (
    <div className={styles.container}>
      <div className={styles.main}>
          <Menu isActive={activeView === "menu"} 
            handleCreate={handleCreate} 
            handleJoin={handleJoin} /> 
          <Game 
            isActive={activeView === "game"} 
          />
          <Status 
            isConnected = { isConnected } 
            players =  { roomPlayers }
            // Want to pass backend to frontend
          />
        <p>Transport: { transport }</p>
      </div>
    </div>
  );
}
