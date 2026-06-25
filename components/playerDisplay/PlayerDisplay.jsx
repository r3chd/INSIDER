import { useEffect, useState, useRef } from "react";
import { socket } from "../../socket.js";
import styles from "./PlayerDisplay.module.css";
import MAX_PLAYERS from "../constants/gameParam.js";
import PlayerCard from "./PlayerCard.jsx"

export default function PlayerDisplay({showEmpty=true, guessingPlayer, onCardClick, room}) { // Arguments needed here in for loop
  const [youRole, setYouRole] = useState(null);
  const [votes, setVotes] = useState({}); // empty map
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // parent pass down room data to make sure we have latest room data
  const playerList = { players: room?.players ?? [] };
  const youSocket = room?.yourId ?? null;
  const hostPlayer = room?.hostId ?? null;



  // const clickHandlerRef = useRef(onCardClick);

  // useEffect(() => {
  //   clickHandlerRef.current = onCardClick;
  // }, [onCardClick]);


  const onCardClickDisplay = (playerId) => {
    onCardClick(playerId); // pass to game above
    setSelectedPlayer(playerId); // update display
  }

  useEffect(() => {
      const handleRoleAssignment = (data) => {
        // Set personal role
        setYouRole(data.gameRole);
      }

      const handleUpdateVotes = (data) => {
        setVotes(data)
      }

      socket.on("roleAssigned", handleRoleAssignment);
      socket.on("updateVotes", handleUpdateVotes);
      return () => {
        socket.off("roleAssigned", handleRoleAssignment);
        socket.off("updateVotes", handleUpdateVotes);
      };
  }, []);


  return (<div className={styles.grid}>
    {/* Render Active Players */}
    {playerList.players.map((player) => (
      <PlayerCard 
        key={player.id} 
        empty={false} 
        player={player} 
        voteCount={votes[player.id] || 0}
        guessingPlayer={guessingPlayer === player.id} 
        currentPlayerRole={youRole} 
        isYou={youSocket === player.id} 
        isLeader={youSocket === hostPlayer} // to do here
        isSelected={selectedPlayer === player.id && selectedPlayer != youSocket}
        onClick={onCardClickDisplay} // pass to function in this display
      />
    ))}

    {/* Render Empty Slots */}
    {showEmpty && [...Array(MAX_PLAYERS - playerList.players.length)].map((_, i) => (
      <PlayerCard key={`empty-${i}`} empty={true} onClick={null} />
    ))}
  </div>)
}
