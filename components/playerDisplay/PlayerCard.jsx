import styles from "./PlayerCard.module.css";
import Roles from "../constants/rolesEnum.js"


export default function PlayerCard({empty, player, isYou}) {
    if (empty) {
        return <div className={`${styles.squircle} ${styles.squircleEmpty}`}>
          Waiting for player..
        </div>
    } else {
        return <div className={`${styles.squircle} ${styles.squircleUsed}`}>
  
      Player: "{player.name}" {player.role === Roles.ROOM_LEADER || player.role === Roles.MASTER ? "leader" : ""}, {isYou ? "YOU" : ""} 

      {player.role === Roles.ROOM_LEADER &&
        (<img src="..\..\assets\roomLeader.svg" alt="icon" className={styles.icon}/>)
      }
        
    </div>
    }
}
