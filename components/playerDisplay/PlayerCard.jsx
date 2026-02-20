import styles from "./PlayerCard.module.css";
import Roles from "../constants/rolesEnum.js"


export default function PlayerCard({empty, player, isYou}) {
    if (empty) {
        return <div className={`${styles.squircle} ${styles.squircleEmpty}`}>
          
          ...
        </div>
    } else {
        return <div className={`${styles.squircle} ${styles.squircleUsed}`}>
          <h1 className={`${styles.name} ${styles.h1}`}> {player.name}</h1>


          <h1 className={`${styles.role} ${styles.h1}`}> {player.role}</h1>



      {player.role === Roles.ROOM_LEADER &&
        (<img src="..\..\assets\roomLeader.svg" alt="icon" className={styles.icon}/>)
      }
        
    </div>
    }
}
