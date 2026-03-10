import { useEffect, useState, useRef } from "react";
import { socket } from "../../socket.js";
import styles from "./PlayerDisplay.module.css";
import MAX_PLAYERS from "../constants/gameParam.js";
import PlayerCard from "./PlayerCard.jsx"

export default function PlayerDisplay({showEmpty=true, guessingPlayer, onCardClick}) { // Arguments needed here in for loop
  const [playerList, setPlayerList] = useState({ players: [] });
  const [youSocket, setYouSocket] = useState(null);
  const [youRole, setYouRole] = useState(null);



  const clickHandlerRef = useRef(onCardClick);

  useEffect(() => {
    clickHandlerRef.current = onCardClick;
  }, [onCardClick]);


  const items = [];

  const parseDTOPlayers = (dto) => {
    setYouSocket(dto.yourId);

    return {
      players: dto.players.map(p => ({
        id: p.id,
        name: p.name,
        roomRole: p.roomRole,
        votes: p.votes,
        isMaster: false
      }))
    };
  };

  useEffect(() => {
      const handleRoomUpdate = (data) => {
          setPlayerList(parseDTOPlayers(data));
      }

      const handleRoleAssignment = (data) => {
        // Set personal role
        setYouRole(data.roomRole);

        setPlayerList(prev => ({
          players: prev.players.map(p => ({
            ...p,
            isMaster: p.id === data.masterId
          }))
        }))
      }

      const handleVoteSent = (data) => {
        console.log("yelling all the time")
      } // IS THIS NECESSARY

      socket.on("roomUpdated", handleRoomUpdate);
      socket.on("roleAssigned", handleRoleAssignment)
      return () => {
        socket.off("roomUpdated", handleRoomUpdate);
        socket.off("roleAssigned", handleRoleAssignment);
      };
  }, []);


  return (<div className={styles.grid}>
    {/* Render Active Players */}
    {playerList.players.map((player) => (
      <PlayerCard 
        key={player.id} 
        empty={false} 
        player={player} 
        guessingPlayer={guessingPlayer === player.id} 
        currentPlayerRole={youRole} 
        isYou={youSocket === player.id} 
        onClick={onCardClick} // Passing it directly here
      />
    ))}

    {/* Render Empty Slots */}
    {showEmpty && [...Array(MAX_PLAYERS - playerList.players.length)].map((_, i) => (
      <PlayerCard key={`empty-${i}`} empty={true} onClick={null} />
    ))}
  </div>)
}
