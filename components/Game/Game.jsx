
import { useEffect, useState } from 'react';
import { socket } from "../../socket.js";
import styles from "./Game.module.css";
import PlayerDisplay from "../playerDisplay/PlayerDisplay.jsx";
import WordButton from "../WordButton/WordButton.jsx";
import MenuButton from "../menu/MenuButton.jsx"


export default function Game({ isActive, fillRef }) {
  const [roomCode, setRoomCode] = useState('ERROR'); // Would be funny if the code generates the word 'ERROR'
  const [hostId, setHostId] = useState("not assigned");

  const [gameMessage, setGameMessage] = useState("not assigned");

  // Socket
  const [youSocket, setYouSocket] = useState(null);
  
  // setting the word
  const [wordOptions, setWordOptions] = useState([]);
  const [targetWord, setTargetWord] = useState(null);

  // Overlay variables
  const [overlayMessage, setOverlayMessage] = useState("DEBUG message");
  const [showOverlay, setShowOverlay] = useState(false);

  // Timer
  let timerCanRun = true;
  const [timerWhiteout, setTimerWhiteout] = useState(true); // Timer direction

  // Main Button variables
  const [buttonActive, setButtonActive] = useState(false);
  const [buttonMessage, setButtonMessage] = useState("GUESS / SKIP");
  const [isMasterButton, setIsMasterButton] = useState(false);

  // set socket on initialization
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setYouSocket(socket.id);
      console.log("your id is ", socket.id)
    } 

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket]);

  // --------------- TIMER --------------- //

  // TIMER ITSELF
  function startTimer(start, end) {
    console.log("TIMER IS RUNNING")

    const timerFill = fillRef.current;

    if (!timerFill) return;
    console.log("TIMER IS STILL RUNNING")
    // invert whiteout on each run
    setTimerWhiteout(!timerWhiteout);
    let progress = 0;

    // Disables animation to prevent jump from 100% to -100%
    timerFill.style.transition = "none";
    timerFill.style.top = timerWhiteout ? "-100%" : "0%";
    
    void timerFill.offsetHeight;
    timerFill.style.transition = "0.018s linear";

    const animate = () => {
      if (!timerCanRun) return;
      const isWhiteout = timerWhiteout;
      const now = Date.now();
      progress = Math.min(Math.max((now - start) / (end - start), 0), 1); // Caps 100%
    
      let topValue;
      if (isWhiteout) {
        // -100% -> 0%
        topValue = -100 + progress * 100;
      } else {
        // 0 -> 100%
        topValue = progress * 100;
      }
      timerFill.style.top = `${topValue}%`;

      if (progress < 1) {
        requestAnimationFrame(animate); // Keep mainloop going
      }
    }
    requestAnimationFrame(animate);
  }

  // For when one of the three word options is pressed by the master
  const handleWordSelect = (word) => {
    socket.emit("wordSelected", word);
    // Clear words
    setWordOptions([]);
  }

  // For the guess state - alternate or master submits
  const handleButtonPressed = () => {
    setButtonActive(false);
    if (isMasterButton) {
      socket.emit("wordFound");
      // Socket.emit end round ...
    } else {
      // Should play some kind of animation
      socket.emit("nextTurn");
    }
    
  }

  // --------------- SOCKET RECEIVERS --------------- //
  useEffect(() => {
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
      setGameMessage("finding the word")
    }

    const handleShowButton = (data) => {
      setButtonMessage(data.text);
      setIsMasterButton(data.master);
      setButtonActive(true);
    }

    const handleRevealState = (data) => {
      setShowOverlay(true);
      startTimer(data.startTime, data.endTime);
      // Could be replaced by some kind of animation
      setOverlayMessage(`The word was ${data.word} and it was ${data.success ? "found" : "not found"}`);
    }

    const handleVoteState = (data) => {
      startTimer(data.startTime, data.endTime)
      setGameMessage("vote for the guy")
    }

    socket.on("wordAssigned", handleSetWord);
    socket.on("startSetupState", handleSetupState);
    socket.on("hideOverlay", handleHideOverlay);
    socket.on("startGuessingState", handleGuessingState);
    socket.on("showButton", handleShowButton);
    socket.on("startRevealState", handleRevealState);
    socket.on("startVoteState", handleVoteState);


    return() => {
      socket.off("wordAssigned", handleSetWord);
      socket.off("startSetupState", handleSetupState);
      socket.off("hideOverlay", handleHideOverlay);
      socket.off("startGuessingState", handleGuessingState);
      socket.off("showButton", handleShowButton);
      socket.off("startRevealState", handleRevealState);
      socket.off("startVoteState", handleVoteState);
    }
  }, [])


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
            <h1 className={styles.h1}> {`Your target is: ${targetWord || ""}`}</h1>
            <h1>{gameMessage}</h1>
            <PlayerDisplay showEmpty={false} />
            <MenuButton children={buttonMessage} onClick={handleButtonPressed} active={buttonActive} />
        </div>
    </div>
  );
}
