// imports
import { useEffect, useState } from 'react';
import { socket } from "../../socket.js";
import styles from "./Game.module.css";
import PlayerDisplay from "../playerDisplay/PlayerDisplay.jsx";
import WordButton from "../WordButton/WordButton.jsx";
import MenuButton from "../menu/MenuButton.jsx"
import { MIN_PLAYERS } from "../constants/gameParam.js";

export default function Game({ fillRef, room }) {
  // this is just the room code assignment, makes sure the server's roomUpdated before showing view
  const roomCode = room?.code ?? 'ERROR';
  const hostId = room?.hostId ?? "not assigned";
  const playerCount = room?.players?.length ?? 0;
  const [showStartButton, setShowStartButton] = useState(true);

  const handleStartButtonPressed = () => {
    socket.emit("startGame", roomCode);
    setShowStartButton(false);
  }

  const canStart = playerCount >= MIN_PLAYERS;


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
  const [buttonActive, setGuessButtonActive] = useState(false);
  const [guessButtonMessage, setGuessButtonMessage] = useState("GUESS / SKIP");
  const [isMasterButton, setIsMasterButton] = useState(false);

  // guesser's turn (who has the button)
  const [guessingPlayer, setGuessingPlayer] = useState(null);

  // current gameState (unsure if needed)
  const [gameState, setGameState] = useState(null);

  // --------------- TIMER --------------- //

  // TIMER ITSELF
  function startTimer(start, end) {

    const timerFill = fillRef.current;

    if (!timerFill) return;
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
    socket.emit("wordSelected", word); // TEMP need roomcode
    // clear words
    setWordOptions([]);
  }

  // for the guess state - alternate or master submits
  const handleButtonPressed = () => {
    setGuessButtonActive(false);
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
    socket.emit("playerClicked", {
      clickingPlayer: socket.id,
      clickedPlayer: clickedPlayer,
      room: roomCode
    })

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

    // 
    const handleGuessButton = (data) => {
      setGuessButtonMessage(data.text);
      setIsMasterButton(data.master);
      setGuessButtonActive(true);
    }

    const handleShowGuesser = (guesser) => {
      setGuessingPlayer(guesser)
    }

    const handleRevealState = (data) => {
      setShowOverlay(true);
      setGuessButtonActive(false);
      startTimer(data.startTime, data.endTime);
      setGuessingPlayer(null); // clear guess highlight
      // could be replaced by some kind of animation
      setOverlayMessage(`The word was ${data.word} and it was ${data.success ? "found" : "not found"}`);
    }

    const handleVoteState = (data) => {
      startTimer(data.startTime, data.endTime)
      setGameMessage("vote for the guy")
    }

    socket.on("stateChange", ({ state, data }) => {
      switch(state) {
        case "setup": handleSetupState(data); break;
        case "guessing": handleGuessingState(data); break;
        case "reveal": handleRevealState(data); break;
        case "vote": handleVoteState(data); break;
      }
    })

    socket.on("wordAssigned", handleSetWord);
    socket.on("hideOverlay", handleHideOverlay);
    socket.on("showGuessButton", handleGuessButton);
    socket.on("showGuesser", handleShowGuesser);

    return() => {
      socket.off("wordAssigned", handleSetWord);
      socket.off("hideOverlay", handleHideOverlay);
      socket.off("showGuessButton", handleGuessButton);
      socket.off("showGuesser", handleShowGuesser);
    }
  }, [])


  return (
    <div className={styles.game}>
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
            <h1 className={styles.h1}> {roomCode} </h1>
            <h1 className={styles.h1}> {`Your target is: ${targetWord || ""}`}</h1>
            <h1 className={styles.h1}>{gameMessage}</h1>
            <PlayerDisplay showEmpty={true} guessingPlayer={guessingPlayer} currentGameState={gameState} onCardClick={handleCardClick} room={room}/>

            <MenuButton children={guessButtonMessage} onClick={handleButtonPressed} active={buttonActive} />
            
            {/* Start button condition for host */}
            {(hostId === socket.id) && (showStartButton) && (
              <>
                  {!canStart && (
                    <p className={styles.minPlayersHint}>
                      Need at least {MIN_PLAYERS} players to start ({playerCount}/{MIN_PLAYERS}).
                    </p>
                  )}
              <MenuButton 
                onClick={handleStartButtonPressed} 
                half={false} 
                disabled={!canStart}> start </MenuButton></>)}
        </div>
    </div>
  );
}
