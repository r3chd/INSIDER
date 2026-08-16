"use client";

// imports
import { useState, useEffect, useRef } from 'react';
import { socket } from "../socket.js";

import Menu from '../components/menu/Menu.jsx';
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

    // room state (view switch can wait on server confirmation)
    const [room, setRoom] = useState(null);
    const [joinError, setJoinError] = useState("");

    // timer information
    const timerFillRef = useRef(null);

    // unsure if needed 
    // R: if what is needed, this bottom section here?
    // j: thing i already deleted - it was a useState for an unused var

    // this runs when the "create" button is hit
    const handleCreate = (playerName) => {

      // creates in backend, we switch to the game view once the server
      // confirms by sending roomUpdated (see useEffect below)
      setJoinError("");
      socket.emit("createRoom", playerName);
    };

    // this runs when the "join" button is hit
    const handleJoin = (roomCode, playerName) => {

      // normalize so a lowercase/whitespace code still matches the room
      const code = (roomCode ?? "").trim().toUpperCase();
      setJoinError("");
      socket.emit("joinRoom", { roomCode: code, playerName });
      // wait for server to confirm before swtiching to game view
      // with roomUpdated, or report joinError if the room does not exist
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

        // server confirms a room was created/joined
        function onRoomUpdated(data) {
            setRoom(data);
            setActiveView('game');
        }

        // join failed then stay on the menu and surface why
        function onJoinError(data) {
            setJoinError(
                data?.reason === "room_not_found"
                    ? `No room found with code "${data.code}".`
                    : "Could not join that room."
            );
        }

        // event driven on connection, disconnection and game started
        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("roomUpdated", onRoomUpdated);
        socket.on("joinError", onJoinError);

        // cleanup events
        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("roomUpdated", onRoomUpdated);
            socket.off("joinError", onJoinError);
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
                  <Menu handleCreate={handleCreate} handleJoin={handleJoin} joinError={joinError} />
                )}

              {activeView === 'game' && <Game fillRef = {timerFillRef} room={room} />}

              <p>Transport: { transport }</p>
            </div>
          </div>
      </div>
    </div>
  );
}
