import { useState, useEffect } from 'react';
import { socket } from "../socket.js";

import Menu from '../components/menu/Menu.jsx';
import Game from '../components/game/Game.jsx';
import Status from '../components/Status.jsx';

import styles from './style.module.css';

import { generateRoomCode } from "../utils/roomCode.js"


export default function Home() {

    const [activeView, setActiveView] = useState('menu');
    const [isConnected, setIsConnected] = useState(false);
    const [transport, setTransport] = useState("N/A");
    const [players, setPlayers] = useState();
    const [currentRoom, setCurrentRoom] = useState();
    const [connectedRoom, setConnectedRoom] = useState();

    const handleSwitch = (view) => { 
      
      const room = generateRoomCode();
      setCurrentRoom(room); // results in useEffect emitting the joinroom

      setActiveView(view) 
    };

    useEffect(() => {
      if (!currentRoom) return;
      socket.emit("joinRoom", `${currentRoom}`);
    }, [currentRoom]);

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
            setPlayers(players);
        })

        socket.on("updateRoom", (room) => {

          const playerIds = room._connectedPlayers.map(player => player._id);
          socket.emit("console", playerIds);
          setConnectedRoom(playerIds);
          
          // setConnectedRoom(room._test);
          socket.emit("console", `ROOM: ${Object.keys(room)}, ${Object.values(room)}`);
        })

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("updatePlayers")
        };
        
    }, []);

  return (
    <div className={styles.container}>
      <div className={styles.main}>
          <Menu isActive={activeView === "menu"} handleSwitch={handleSwitch} />
          <Game 
            isActive={activeView === "game"} 
            roomCode={currentRoom} // User may not need to know this // possibly pass in a Room instance
            connectedPlayers={connectedRoom}
          />
          <Status 
            isConnected = { isConnected } 
            players =  { players }
            // Want to pass backend to frontend
          />
        <p>Transport: { transport }</p>
      </div>
    </div>
  );
}
