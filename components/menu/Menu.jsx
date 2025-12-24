import { useState }from 'react';
import styles from "./Menu.module.css";

export default function Menu({ isActive, handleCreate: handleCreate, handleJoin: handleJoin }) {
  if (!isActive) return null;

  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const handleNameChange = (e) => {
    setName(e.target.value);
  }
  const handleRoomCodeChange = (e) => {
    setRoomCode(e.target.value);
  }

  return (
    <div className={`${styles.menu} ${isActive ? styles.active : ""}`}>

          <p> INSIDER </p>

          
          <div className = {styles.inputBox}>
            <p>name: </p>
            <input 
            //</div></div>value={name} 
            onChange={handleNameChange}></input>
          </div>

          <div className = {styles.inputBox}>
            <p> or join one... </p>
            <input onChange={handleRoomCodeChange}></input>
          </div>

          <div className={styles.buttonBox}>
            <button onClick={() => handleCreate(name)}> create </button>
            <button onClick={() => handleJoin(name, roomCode)}> join </button>
          </div>


    </div>
  );
}
