import { useEffect } from "react";
import { useState } from "react";
import { socket } from "../../socket.js";
import styles from "./PlayerCard.module.css";

export default function PlayerCard() { // Arguments needed here in for loop
  const [playerList, setPlayerList] = useState({
    players: [],
  });

  const parseDTOPlayers = dto => ({
    players: dto.players.map(p => ({
        id: p.id,
        name: p.name
    }))
  });

  const items = [];
  const count = 6; // edit this

    useEffect(() => {

        const handleUpdate = (data) => {
            console.log("socket update, data", data);
            setPlayerList(parseDTOPlayers(data));
        }

        socket.on("playersUpdated", handleUpdate);
    }, []);


  for (let i = 0; i < playerList.players.length; i++) {
    const player = playerList.players[i];
    
    
    items.push(
      <div className="${styles.squircle}"> // need to fix
        Player {i + 1} : {player.name}
      </div>
    );
  }

  return <div className="column">{items}</div>;
}
