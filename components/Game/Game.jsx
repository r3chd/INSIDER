
import { useEffect, useState } from 'react';
import { socket } from "../../socket.js";
import styles from "./Game.module.css";
import PlayerDisplay from "../playerDisplay/PlayerDisplay.jsx";
import WordButton from "../WordButton/WordButton.jsx";

export default function Lobby({ isActive }) {
  const [roomCode, setRoomCode] = useState('ERROR'); // Would be funny if the code generates the word 'ERROR'
  const [hostId, setHostId] = useState("not assigned");

  const [currentPlayerRole, setCurrentPlayerRole] = useState("not assigned");
  
  // setting the word
  const [wordOptions, setWordOptions] = useState([]);
  const [targetWord, setTargetWord] = useState(null);

  // Overlay variables
  const [overlayMessage, setOverlayMessage] = useState("DEBUG message");
  const [showOverlay, setShowOverlay] = useState(false);

  // For when one of the buttons is pressed
  const handleWordSelect = (word) => {
    console.log(word);
    socket.emit("wordSelected", word);

    setShowOverlay(false);
  }


  useEffect(() => {
    const handleSetRole = (data) => {
      setCurrentPlayerRole(data.role);
    }

    const handleSetWord = (data) => {
      setTargetWord(data.word);
      console.log(data.word);
    }

    const handleSelectWord = (data) => {
      setShowOverlay(true);
      setWordOptions(data.words);
    }

    const handleOverlayMessage = (message) => {
        setShowOverlay(true);
        setOverlayMessage(message);
    }

    socket.on("roleAssigned", handleSetRole);
    socket.on("wordAssigned", handleSetWord);
    socket.on("showOverlayMessage", handleOverlayMessage);
    socket.on("showRandomWords", handleSelectWord);
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
