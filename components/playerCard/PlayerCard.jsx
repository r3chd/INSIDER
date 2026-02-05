import { useEffect } from "react";
import { useState } from "react";
import { socket } from "../../socket.js";
import styles from "./PlayerCard.module.css";
import Roles from "../constants/rolesEnum.js"

export default function PlayerCard() { // Arguments needed here in for loop
  const [playerList, setPlayerList] = useState({
    players: [],
  });

  const parseDTOPlayers = dto => ({
    players: dto.players.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role
    }))
  });

  const items = [];

    useEffect(() => {

        const handlePlayerUpdate = (data) => {
            console.log("socket update, data", data);
            setPlayerList(parseDTOPlayers(data));
        }

        socket.on("playersUpdated", handlePlayerUpdate);
    }, []);


  for (let i = 0; i < playerList.players.length; i++) {
    const player = playerList.players[i];
    
    if (player.role === Roles.ROOM_LEADER) {
      items.push(
      <div key={player.id} className={styles.squircle}>
        Player KING : {player.name} : role : {player.role}
      </div>
      )
    }
    else {
      items.push(
        <div key={player.id} className={styles.squircle}>
          Player {i + 1} : {player.name} : role : {player.role}
        </div>
      );
    }


  }

  for (let i = 0; i < 3; i++) { // Need to change out with max players later on
    items.push(
      <div key={i} className={styles.squircle}>
        Waiting for player..
      </div>
    );
  } 

  return <div className="column">
    {items}</div>;
}
