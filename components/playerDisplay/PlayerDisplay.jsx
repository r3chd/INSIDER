import { useEffect } from "react";
import { useState } from "react";
import { socket } from "../../socket.js";
import styles from "./PlayerDisplay.module.css";
import Roles from "../constants/rolesEnum.js"
import MAX_PLAYERS from "../constants/gameParam.js";
import PlayerCard from "./PlayerCard.jsx"

export default function PlayerDisplay({showEmpty=true}) { // Arguments needed here in for loop
  const [playerList, setPlayerList] = useState({
    players: [],
  });

  const [youSocket, setYouSocket] = useState(null);
  const [youRole, setYouRole] = useState(null);

  const items = [];

  const parseDTOPlayers = (dto) => {
    setYouSocket(dto.yourId);

    return {
      players: dto.players.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        isMaster: false
      }))
    };
  };

  useEffect(() => {
      const handleRoomUpdate = (data) => {
          console.log("socket update, data", data);
          setPlayerList(parseDTOPlayers(data));
      }

      const handleRoleAssignment = (data) => {
        // Set personal role
        setYouRole(data.role);

        setPlayerList(prev => ({
          players: prev.players.map(p => ({
            ...p,
            isMaster: p.id === data.masterId
          }))
        }))

      }
      socket.on("roomUpdated", handleRoomUpdate);
      socket.on("roleAssigned", handleRoleAssignment)

      return () => {
        socket.off("roomUpdated", handleRoomUpdate);
        socket.off("roleAssigned", handleRoleAssignment);
      };
  }, []);



  for (let i = 0; i < playerList.players.length; i++) {
    const player = playerList.players[i];    
    items.push(
      <PlayerCard key={player.id} empty={false} player={player} currentPlayerRole={youRole} isYou={youSocket === player.id}/>
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
