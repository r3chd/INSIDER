
import { useEffect, useState } from 'react';
import { socket } from "../../socket.js";
import styles from "./Game.module.css";
import PlayerDisplay from "../playerDisplay/PlayerDisplay.jsx";
import WordButton from "../WordButton/WordButton.jsx";
import MenuButton from "../menu/MenuButton.jsx"


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
  let timerCanRun = true;
  const [timerWhiteout, setTimerWhiteout] = useState(true);
  const [timerFill, setTimerFill] = useState(null);

  // Main Button variables
  const [buttonMessage, setButtonMessage] = useState("GUESS / SKIP");

  useEffect(() => {
    if (fillRef.current) {
      setTimerFill(fillRef.current);
    }
  }, [fillRef])

  function startTimer(start, end) {
    
    if (!timerFill) return;
    // invert whiteout
    setTimerWhiteout(!timerWhiteout);


    const animate = () => {
      if (!timerCanRun) return;
      const isWhiteout = timerWhiteout;

      const now = Date.now();
      const progress = Math.min(Math.max((now - start) / (end - start), 0), 1); // Caps 100%
    
      let topValue;
      // timerFill.style.top = `${progress * 100}%`;
      if (isWhiteout) {
        // -100% -> 0%
        topValue = -100 + progress * 100;
      } else {
        topValue = progress * 100;
      }
      timerFill.style.top = `${topValue}%`;


      if (progress < 1) {
        requestAnimationFrame(animate); // Keep mainloop going
      } else {
        socket.emit("timerExpired"); // Backup timer expiration
      }
    }

    requestAnimationFrame(animate);
  }

  // For when one of the buttons is pressed
  const handleWordSelect = (word) => {
    socket.emit("wordSelected", word);
  }

  const handleButtonPressed = () => {
    socket.emit("guessMade");
  }


  useEffect(() => {
    const handleSetRole = (data) => setCurrentPlayerRole(data.role);
    const handleSetWord = (data) => setTargetWord(data.word);
    const handleHideOverlay = () => setShowOverlay(false);
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

    const handleGuessingState = (data) => {
      timerCanRun = true;
      startTimer(data.startTime, data.endTime);
    }

    const handleShowButton = (data) => {
      setButtonMessage(data.text);
    }

    socket.on("roleAssigned", handleSetRole);
    socket.on("wordAssigned", handleSetWord);
    socket.on("startSetupState", handleSetupState);
    socket.on("hideOverlay", handleHideOverlay);
    socket.on("startGuessingState", handleGuessingState)
    socket.on("showButton", handleShowButton)
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
            <MenuButton children={buttonMessage} onClick={handleButtonPressed}/>
        </div>
    </div>
  );
}
