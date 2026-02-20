import styles from "./PlayerCard.module.css";
import Roles from "../constants/rolesEnum.js"


export default function PlayerCard({empty, player, currentPlayerRole, isYou=false}) {


  const getRoleText = () => {
    if (isYou) return currentPlayerRole;
    if (player.isMaster) return "MASTER";
    return "???";
  };

    if (empty) {
        return <div className={`${styles.squircle} ${styles.squircleEmpty}`}>
          
          ...
        </div>
    } else {
        return <div className={`${styles.squircle} ${styles.squircleUsed}`}>
          <h1 className={`${styles.name} ${styles.h1}`}> {player.name} {isYou ? "YOU" : ""}</h1>

        {/* Case one: Master - show everyone as ???*/}
        {/* Case two: insider - show everyone as ??? besides master */}
        {/* Case three: commoner - show everyone as ??? besides master*/}
        {/* If its you, show the role, else if its the master, show master */}
          <h1 className={`${styles.role} ${styles.h1}`}>{ getRoleText() } </h1>



      {player.role === Roles.ROOM_LEADER &&
        (<img src="..\..\assets\roomLeader.svg" alt="icon" className={styles.icon}/>)
      }
        
    </div>
    }
}
