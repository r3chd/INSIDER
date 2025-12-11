import { useState, useEffect } from 'react';
import { socket } from "../socket.js";

import Menu from '../components/menu/Menu.jsx';
import Game from '../components/game/Game.jsx';
import Status from '../components/Status.jsx';

import styles from './style.module.css';

export default function Home() {

    const [activeView, setActiveView] = useState('menu');

    const handleSwitch = (view) => { setActiveView(view) 
      console.log(players);

    };

    const [isConnected, setIsConnected] = useState(false);
    const [transport, setTransport] = useState("N/A");
    const [players, setPlayers] = useState({});
    
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
            console.log(players);
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
          <Game isActive={activeView === "game"} />
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
