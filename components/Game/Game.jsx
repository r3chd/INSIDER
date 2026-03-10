// imports
import { useEffect, useState } from 'react';
import { socket } from "../../socket.js";
import styles from "./Game.module.css";
import PlayerDisplay from "../playerDisplay/PlayerDisplay.jsx";
import WordButton from "../WordButton/WordButton.jsx";
import MenuButton from "../menu/MenuButton.jsx"


export default function Game({ isActive, fillRef }) {
  // would be funny if the code generates the word 'ERROR'
  // R: is that even possible chat does it not alwasy include a number?
  const [roomCode, setRoomCode] = useState('ERROR'); 
  const [hostId, setHostId] = useState("not assigned");

  const [gameMessage, setGameMessage] = useState("not assigned");
  
  // setting the word
  const [wordOptions, setWordOptions] = useState([]);
  const [targetWord, setTargetWord] = useState(null);

  // overlay variables
  const [overlayMessage, setOverlayMessage] = useState("DEBUG message");
  const [showOverlay, setShowOverlay] = useState(false);

  // timer
  let timerCanRun = true;
  const [timerWhiteout, setTimerWhiteout] = useState(true); //  Timer direction

  // main button variables
  const [buttonActive, setButtonActive] = useState(false);
  const [buttonMessage, setButtonMessage] = useState("GUESS / SKIP");
  const [isMasterButton, setIsMasterButton] = useState(false);

  // guesser's turn (who has the button)
  const [guessingPlayer, setGuessingPlayer] = useState(null);

  // voting
  const [votedPlayer, setVotedPlayer] = useState(null);

  // current gameState
  const [gameState, setGameState] = useState(null);

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
      progress = Math.min(Math.max((now - start) / (end - start), 0), 1); // caps 100%
    
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
        requestAnimationFrame(animate); // keep mainloop going
      }
    }
    requestAnimationFrame(animate);
  }

  // for when one of the three word options is pressed by the master
  const handleWordSelect = (word) => {
    socket.emit("wordSelected", word);
    // clear words
    setWordOptions([]);
  }

  // for the guess state - alternate or master submits
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

  // R: this is during voting phase?
  const handleCardClick = (clickedPlayer) => {
    // On a card and ID being pressed:
    // Update the UI on this end
    // send an emit that increments the votes overall?
    // if player.votes = 0;???
    console.log(clickedPlayer, "Id player");
  }

  // --------------- SOCKET RECEIVERS --------------- //

  useEffect(() => {
    const handleSetWord = (data) => setTargetWord(data.word);
    const handleHideOverlay = () => setShowOverlay(false);

    const handleSetupState = (data) => {
        // everyone gets overlay
        setShowOverlay(true);

        // everyone gets custom massage
        setOverlayMessage(data.overlayMessage.replace("{{name}}", data.masterPlayer));
        
        // show words only to master
        if (data.words !== null) {
            setWordOptions(data.words);
        }

        // start timer
        startTimer(data.startTime, data.endTime)
    }

    const handleGuessingState = (data) => {
      timerCanRun = true;
      startTimer(data.startTime, data.endTime);
      setGameMessage("finding the word")
      setWordOptions([]); // clear from previous
    }

    const handleShowButton = (data) => {
      setButtonMessage(data.text);
      setIsMasterButton(data.master);
      setButtonActive(true);
    }

    const handleShowGuesser = (guesser) => {
      setGuessingPlayer(guesser)
    }

    const handleRevealState = (data) => {
      setShowOverlay(true);
      setButtonActive(false);
      startTimer(data.startTime, data.endTime);
      setGuessingPlayer(null); // clear guess highlight
      // could be replaced by some kind of animation
      setOverlayMessage(`The word was ${data.word} and it was ${data.success ? "found" : "not found"}`);
    }

    const handleVoteState = (data) => {
      startTimer(data.startTime, data.endTime)
      setGameMessage("vote for the guy")
    }

    const handleStateUpdate = (data) => {
      setGameState(data);
      console.log(data);
    }

    socket.on("wordAssigned", handleSetWord);
    socket.on("startSetupState", handleSetupState);
    socket.on("hideOverlay", handleHideOverlay);
    socket.on("startGuessingState", handleGuessingState);
    socket.on("showButton", handleShowButton);
    socket.on("showGuesser", handleShowGuesser);
    socket.on("startRevealState", handleRevealState);
    socket.on("startVoteState", handleVoteState);
    socket.on("stateUpdated", handleStateUpdate);


    return() => {
      socket.off("wordAssigned", handleSetWord);
      socket.off("startSetupState", handleSetupState);
      socket.off("hideOverlay", handleHideOverlay);
      socket.off("startGuessingState", handleGuessingState);
      socket.off("showButton", handleShowButton);
      socket.off("showGuesser", handleShowGuesser);
      socket.off("startRevealState", handleRevealState);
      socket.off("startVoteState", handleVoteState);
      socket.off("stateUpdated", handleStateUpdate);
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
            <h1 className={styles.h1}>{gameMessage}</h1>
            <PlayerDisplay showEmpty={false} guessingPlayer={guessingPlayer} gameState={gameState} onCardClick={handleCardClick}/>
            <MenuButton children={buttonMessage} onClick={handleButtonPressed} active={buttonActive} />
        </div>
    </div>
  );
}
