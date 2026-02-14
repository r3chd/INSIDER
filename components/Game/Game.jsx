
import { useEffect, useState } from 'react';
import { socket } from "../../socket.js";
import styles from "./Game.module.css";
import PlayerDisplay from "../playerDisplay/PlayerDisplay.jsx";
import WordButton from "../WordButton/WordButton.jsx";

export default function Game({ isActive, fillRef }) {
  const [roomCode, setRoomCode] = useState('ERROR'); // Would be funny if the code generates the word 'ERROR'
  const [hostId, setHostId] = useState("not assigned");

  const [currentPlayerRole, setCurrentPlayerRole] = useState("not assigned");
  
  // setting the word
  const [wordOptions, setWordOptions] = useState([]);
  const [targetWord, setTargetWord] = useState(null);

  // Overlay variables
  const [overlayMessage, setOverlayMessage] = useState("DEBUG message");
  const [showOverlay, setShowOverlay] = useState(false);

  // Timer
  let timerRunning = true;
  const timerFill = fillRef.current; // Get the timer element

  function startTimer(start, end) {
    
    if (!timerFill) return;

    const animate = () => {
      if (!timerRunning) return;

      const now = Date.now();
      const progress = Math.min(Math.max((now - start) / (end - start), 0), 1); // Caps 100%
    
      timerFill.style.height = `${progress * 100}%`;

      if (progress < 1) {
        requestAnimationFrame(animate); // Keep mainloop going
      } else {
        socket.emit("Something")
      }
    }

    requestAnimationFrame(animate);
  }

  function endTimerEarly() {
    timerRunning = false;
    if (fillRef.current) {
      fillRef.current.style.height = "100%";
    }
  }

  // For when one of the buttons is pressed
  const handleWordSelect = (word) => {
    console.log(word);
    socket.emit("wordSelected", word);
  }


  useEffect(() => {
    const handleSetRole = (data) => {
      setCurrentPlayerRole(data.role);
    }

    const handleSetWord = (data) => {
      setTargetWord(data.word);
      console.log(data.word);
    }

    const handleSetupState = (data) => {
        // Everyone gets overlay
        setShowOverlay(true);

        // Everyone gets custom message
        setOverlayMessage(data.overlayMessage.replace("{{name}}", data.masterPlayer));
        
        // Show words only to master
        if (data.words !== null) {
            setWordOptions(data.words);
        }

        // Start timer
        startTimer(data.startTime, data.endTime)
    }

    const handleHideOverlay = () => {
        setShowOverlay(false);
        endTimerEarly();
    }

    socket.on("roleAssigned", handleSetRole);
    socket.on("wordAssigned", handleSetWord);
    socket.on("startSetupState", handleSetupState);
    socket.on("hideOverlay", handleHideOverlay)
  })


  return (

    
    <div className={`${styles.game} ${isActive ? styles.active : ""}`}>
        <div className={`${styles.overlay} ${showOverlay ? styles.active : ""}`}>
            <div className={styles.overlayBox}>
                <h1>{overlayMessage}</h1>

                <div className={styles.overlayButtonBox}>
                    {wordOptions.map((word, i) => (
                        <WordButton key={word} word={word} onSelect={handleWordSelect} />
                    ))}
                </div>
            </div>
            

        </div>
        <div className={styles.gameInteractable}>
            <h1 className={styles.h1}> {currentPlayerRole} </h1>e
            <h1 className={styles.h1}> {`Your target is: ${targetWord || ""}`}</h1>
            <PlayerDisplay showEmpty={false}/>
        </div>
    </div>
  );
}
