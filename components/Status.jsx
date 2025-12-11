import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io();
export default function Status({ isConnected }) {
  // We'll attach the start logic here, likely listening for the SPACE key
  // You would typically use a useEffect hook and a state handler here 
  // to manage key presses, but for simplicity, we keep the UI structure.
    // useEffect(() => {
    //     io.on("playerUpdate", (backendPlayers) => {
    //         document.getElementById("aaa").innerText = 'Players: ${Object.keys(players).length}';
    //     });
    // });
    useEffect(() => {
        socket.on('playerUpdate', (backendPlayers) => {
            console.log(backendPlayers);
        })
    })



  return (
    <div id="menu" className="active">
      <p>State: {'' + isConnected }</p>
      <p>Players connected: {}</p>
    </div>
  );
}
