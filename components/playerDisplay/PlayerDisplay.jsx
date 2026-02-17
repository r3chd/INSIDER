import { useEffect } from "react";
import { useState } from "react";
import { socket } from "../../socket.js";
import styles from "./PlayerDisplay.module.css";
import Roles from "../constants/rolesEnum.js"
import MAX_PLAYERS from "../constants/gameParam.js";


export default function PlayerCard({showEmpty=true, youSocketId}) { // Arguments needed here in for loop
  const [playerList, setPlayerList] = useState({
    players: [],
  });

  const items = [];

  const parseDTOPlayers = dto => ({
    players: dto.players.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role
    }))
  });

    useEffect(() => {
        const handleRoomUpdate = (data) => {
            console.log("socket update, data", data);
            setPlayerList(parseDTOPlayers(data));
        }
        socket.on("roomUpdated", handleRoomUpdate);
    }, []);


  for (let i = 0; i < playerList.players.length; i++) {
    const player = playerList.players[i];
    const isYou = player.id === youSocketId;
    console.log(youSocketId);
    items.push(
    <div key={player.id} className={`${styles.squircle} ${styles.squircleUsed}`}>
  
      Player {i + 1}: "{player.name}" {player.role === Roles.ROOM_LEADER || player.role === Roles.MASTER ? "leader" : ""}, {isYou ? "YOU" : ""} 

      {player.role === Roles.ROOM_LEADER &&
        (<img src="..\..\assets\roomLeader.svg" alt="icon" className={styles.icon}/>)
      }
        
    </div>
    )
  }
  // For leftovers
  if (showEmpty) {
    for (let i = 0; i < MAX_PLAYERS - playerList.players.length; i++) { // Need to change out with max players later on
      items.push(
        <div key={i} className={`${styles.squircle} ${styles.squircleEmpty}`}>
          Waiting for player..
        </div>
      );
    } 
  }


  return <div className={styles.column}>
    {items}</div>;
}
