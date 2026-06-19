"use client";

// imports
import { useState, useEffect, useRef } from 'react';
import { socket } from "../socket.js";

import Menu from '../components/menu/Menu.jsx';
import Lobby from '../components/Lobby/Lobby.jsx';
import Game from '../components/Game/Game.jsx';
import styles from './style.module.css';

// home page
export default function Home() {

    // state of connectivity
    const [isConnected, setIsConnected] = useState(false);

    // R: what is the point of showing the transport for debugging?
    // j: this is a part of socket.io - we don't need to know this as any 
    // connection will have websocket as higher priority to polling (websocket is better too)
    // this was just in the setup with seeing whether or not the socket connected in the first place
    const [transport, setTransport] = useState("N/A");

    // views
    const [activeView, setActiveView] = useState('menu');

    // timer information
    const timerFillRef = useRef(null);

    // unsure if needed 
    // R: if what is needed, this bottom section here?
    // j: thing i already deleted - it was a useState for an unused var

    // this runs when the "create" button is hit
    const handleCreate = (playerName) => { 
      
      // creates in backend
      socket.emit("createRoom", playerName);

      setActiveView('game');
    };

    // this runs when the "join" button is hit
    const handleJoin = (roomCode, playerName) => {

      socket.emit("joinRoom", {roomCode, playerName})

      setActiveView('game'); // change from menu to game lobby HERE
    }

    // connectivity code (connection and socket receiving)
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

        // event driven on connection, disconnection and game started
        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        // cleanup events
        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
        };
        
    }, []);

  return (
    <div className={styles.container}>
      <div className={styles.timerBack}>
        <div ref={timerFillRef} className={styles.timerFill}> </div>
        {/* this is the timer fill */}
          <div className={styles.main}>
              <div className={styles.logo}><img src='/assets/templogo.svg'></img> <p>insider</p></div>
            
              <div className={styles.content}>
                {activeView === 'menu' && (
                  <Menu handleCreate={handleCreate} handleJoin={handleJoin} />
                )}

              {activeView === 'game' && <Game fillRef = {timerFillRef} />}

              <p>Transport: { transport }</p>
            </div>
          </div>
      </div>
    </div>
  );


  return (
    <div className={styles.container}>
      <div className={styles.timerBack}>
        <div ref={timerFillRef} className={styles.timerFill}> </div>
        {/* this is the timer fill */}
          <div className={styles.main}>
              <div className={styles.logo}><img src='/assets/templogo.svg'></img> <p>insider</p></div>
            
            <div className={styles.content}>
              <Menu isActive={activeView === 'menu'}  
                handleCreate={handleCreate} 
                handleJoin={handleJoin} /> 
              <Lobby 
                isActive={activeView === 'lobby'} 
              />
              <Game isActive={activeView === 'game'} 
                fillRef = {timerFillRef} />

              <p>Transport: { transport }</p>
            </div>
          </div>
      </div>
    </div>
  );
}
