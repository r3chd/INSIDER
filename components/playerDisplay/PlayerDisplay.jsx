import { useEffect } from "react";
import { useState } from "react";
import { socket } from "../../socket.js";
import styles from "./PlayerDisplay.module.css";
import Roles from "../constants/rolesEnum.js"
import MAX_PLAYERS from "../constants/gameParam.js";


export default function PlayerCard() { // Arguments needed here in for loop
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
    
    // This can definitely be reduced to one, or at least moved into the div?
    if (player.role === Roles.ROOM_LEADER) {
      items.push(
      <div key={player.id} className={`${styles.squircle} ${styles.squircleUsed}`}>
  
        Player KING : {player.name} : role : {player.role}
        <img src="..\..\assets\roomLeader.svg" alt="icon" className={styles.icon}/>
      </div>
      )
    }
    else {
      items.push(
        <div key={player.id} className={`${styles.squircle} ${styles.squircleUsed}`}>
          Player {i + 1} : {player.name} : role : {player.role}
        </div>
      );
    }
  }

  for (let i = 0; i < MAX_PLAYERS - playerList.players.length; i++) { // Need to change out with max players later on
    items.push(
      <div key={i} className={`${styles.squircle} ${styles.squircleEmpty}`}>
        Waiting for player..
      </div>
    );
  } 

  return <div className={styles.column}>
    {items}</div>;
}
