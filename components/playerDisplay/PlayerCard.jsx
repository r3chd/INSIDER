import styles from "./PlayerCard.module.css";
import Roles from "../constants/rolesEnum.js"


export default function PlayerCard({empty, player, currentPlayerRole, isYou=false, guessingPlayer, onClick}) {


  const getRoleText = () => {
    // This whole thing is quite messy due to how lobby roles and game roles overlap with one another..
    if (isYou) return currentPlayerRole; // Sets you to the correct value
    if (player.isMaster && currentPlayerRole === Roles.ROOM_MEMBER) return Roles.ROOM_LEADER; // Lobby State
    if (player.isMaster) return Roles.MASTER; // Game State
    if (currentPlayerRole === Roles.ROOM_MEMBER || currentPlayerRole === Roles.ROOM_LEADER) return Roles.ROOM_MEMBER; // Replace non-you and non-master to member in lobby
    if (currentPlayerRole === Roles.INSIDER) return Roles.COMMONER; // Insider knows all roles
    return "???"; // Commoner knows nothing
  };

    if (empty) {
        return <div className={`${styles.squircle} ${styles.squircleEmpty}`}>
          
          ...
        </div>
    } 
    
    const handleClick = () => {
      if (!onClick || empty) return;
      onClick(player.id);
    }

    return <div className={`${styles.squircle} ${styles.squircleUsed} ${guessingPlayer ? styles.guessing : ""}`} onClick={handleClick}>
      <h1 className={`${styles.name} ${styles.h1}`}> {player.name} {isYou ? "YOU" : ""} {player.votes}</h1>
      <h1 className={`${styles.role} ${styles.h1}`}>{ getRoleText() } </h1>
      {player.role === Roles.ROOM_LEADER &&
        (<img src="..\..\assets\roomLeader.svg" alt="icon" className={styles.icon}/>)
      }
        
    </div>
}
