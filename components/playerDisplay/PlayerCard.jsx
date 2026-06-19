import styles from "./PlayerCard.module.css";
import Roles from "../constants/rolesEnum.js"
import { useState } from "react";

export default function PlayerCard({empty, player, currentPlayerRole, isYou=false, isLeader=false, isSelected=false, voteCount, guessingPlayer, onClick }) { // Pass in something for the state

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

      if (isLeader) {
        console.log("player powers activated")
      } // this code works

      // play wiggle animation
      setWiggle(false); //reset, if any
      requestAnimationFrame(() => {
        setWiggle(true);
      })


      // Need to implement the following
      // If the gamestate is lobby, 
      // otherwise, wiggle animation
    }

    return <div className={`${styles.squircle} ${styles.squircleUsed} ${guessingPlayer ? styles.guessing : ""} ${wiggle ? styles.wiggle : ""}`} onClick={handleClick}>
      <h1 className={`${styles.name} ${styles.h1}`}> {player.name} {isYou ? "YOU" : ""} {voteCount}</h1>
      <h1 className={`${styles.role} ${styles.h1}`}> { getRoleText() } </h1>
      {player.roomRole === Roles.ROOM.LEADER &&
        (<img src="..\..\assets\roomLeader.svg" alt="icon" className={styles.icon}/>)
      }

      {isSelected && isLeader && 
      (<div className={styles.overlay}> 
       <h2 className={styles.h2}>kick player?</h2>
        <div className={styles.overlayButtons}> 
          <button>yes</button> 
          {/* need to add functions to each of these (kicking the player) */}
          <button>nup</button> 
          {/* this is just 'set selected to false' */}
        </div>

       </div>)}
        
    </div>
}
