import { useEffect } from "react";
import { useState } from "react";
import { socket } from "../../socket.js";
import styles from "./PlayerDisplay.module.css";
import Roles from "../constants/rolesEnum.js"
import MAX_PLAYERS from "../constants/gameParam.js";
import PlayerCard from "./PlayerCard.jsx"

export default function PlayerDisplay({showEmpty=true, youSocketId}) { // Arguments needed here in for loop
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
      <PlayerCard key={i} empty={false} player={player} isYou={isYou}/>
    )
  }
  // For leftovers
  if (showEmpty) {
    for (let i = playerList.players.length; i < MAX_PLAYERS; i++) { // Need to change out with max players later on
      items.push(
        <PlayerCard key={i} empty={true} />
      );
    } 
  }


  return <div className={styles.grid}>
    {items}</div>;
}
