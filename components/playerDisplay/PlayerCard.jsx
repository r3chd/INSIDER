import styles from "./PlayerCard.module.css";
import Roles from "../constants/rolesEnum.js"
import { useState } from "react";

export default function PlayerCard({empty, player, currentPlayerRole, isYou=false, voteCount, guessingPlayer, onClick }) { // Pass in something for the state

  const [wiggle, setWiggle] = useState(false);
  const getRoleText = () => {

    // what about only show in the game state
    console.log("getting role text")
    // then handle based on the state

    // This whole thing is quite messy due to how lobby roles and game roles overlap with one another..
    if (isYou) return currentPlayerRole; // Sets you to the correct value
    if (player.isMaster) return Roles.GAME.MASTER; // Game State
    if (currentPlayerRole === Roles.ROOM.MEMBER || currentPlayerRole === Roles.ROOM.LEADER) return Roles.ROOM.MEMBER; // Replace non-you and non-master to member in lobby
    if (currentPlayerRole === Roles.GAME.INSIDER) return Roles.COMMONER; // Insider knows all roles
    return ""; // Commoner knows nothing
  };

    if (empty) {
        return <div className={`${styles.squircle} ${styles.squircleEmpty}`}>
          
          ...
        </div>
    } 
    
    const handleClick = () => {
      if (!onClick || empty) return;
      onClick(player.id); 

      // play wiggle animation
      setWiggle(false); //reset, if any
      requestAnimationFrame(() => {
        setWiggle(true);
      })
      // PlayerCard and PlayerDisplay don't know the room code,
      // so this function is passed all the way through to Game
      // alternatively you could pass the code into here, but it doesn't need to know that.
    }

    return <div className={`${styles.squircle} ${styles.squircleUsed} ${guessingPlayer ? styles.guessing : ""} ${wiggle ? styles.wiggle : ""}`} onClick={handleClick}>
      <h1 className={`${styles.name} ${styles.h1}`}> {player.name} {isYou ? "YOU" : ""} {voteCount}</h1>
      <h1 className={`${styles.role} ${styles.h1}`}> { getRoleText() } </h1>
      {player.roomRole === Roles.ROOM.LEADER &&
        (<img src="..\..\assets\roomLeader.svg" alt="icon" className={styles.icon}/>)
      }
        
    </div>
}
