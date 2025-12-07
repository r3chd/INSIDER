import { useState, useEffect } from 'react';
import { socket } from '../socket';

import Menu from '../components/Menu.jsx';
import Game from '../components/Game.jsx';
import Status from '../components/Status.jsx';
// do i need this
import Player from "../models/Player.js";

export default function Home() {
    const [isConnected, setIsConnected] = useState(false);
    const [transport, setTransport] = useState("N/A");

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

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);

        };

    }, []);

//   const [isGameActive, setIsGameActive] = useState(false);

//   // Function to transition from Menu to Game
//   const handleStartGame = () => {
//     setIsGameActive(prev => !prev);
//     // space bar now toggles
//     // setIsGameActive(true); is also fine
//   };

//   // Add a listener for the SPACE key, as specified in the original HTML
//   useEffect(() => {
//     const handleKeyDown = (event) => {
//       if (event.code === 'Space' && !isGameActive) {
//         handleStartGame();
//       }
//     };
    
//     document.addEventListener('keydown', handleKeyDown);

//     // return () => {
//     //   document.removeEventListener('keydown', handleKeyDown);
//     // };
//   }, [isGameActive]); // Re-run effect if isGameActive changes, ever
  return (
    <div>
        <p>home</p>
        <Menu />

        <Game />
        
        <Status isConnected = { isConnected } />



    </div>
  );
}
