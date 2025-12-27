import { useState }from 'react';
import styles from "./Menu.module.css";

// Menu components
import MenuButtons from "./MenuButtons";
import MenuJoin from "./MenuJoin"

export default function Menu({ isActive, handleCreate: handleCreate, handleJoin: handleJoin }) {
  if (!isActive) return null;

  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  // for menu components
  const [activeComponent, setActiveMenuComponent] = useState('buttons');

  // For setting room, name variable
  const handleNameChange = (e) => {
    setName(e.target.value);
    console.log("name changed to", name)
  }
  const onRoomCodeChange = (e) => {
    setRoomCode(e.target.value);
    console.log("room code has changed to", roomCode)
  }

  // For navigating between components
  const handleCreateButtonPressed = () => {
    handleCreate(name);
  }

  const handleBackButtonPressed = () => {
    setActiveMenuComponent('buttons');
  }

  // Specifically showing the ROOMCODE input box
  const handleJoinButtonPressed = () => {
    setActiveMenuComponent('join');
  }

  // Specifically joining a room
  const handleJoinRoomButtonPressed = () => {
    handleJoin(name, roomCode)
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

          <MenuButtons
            isActiveComponent={activeComponent==='buttons'}
            handleCreateButtonPressed={handleCreateButtonPressed}
            handleJoinButtonPressed={handleJoinButtonPressed}
          />

          <MenuJoin 
            isActiveComponent={activeComponent==='join'}
            roomCode={roomCode}
            setRoomCode={setRoomCode}
            handleBackButtonPressed={handleBackButtonPressed}
            handleJoinRoomButtonPressed={handleJoinRoomButtonPressed}
            onRoomCodeChange={onRoomCodeChange}
          />
    </div>
  );
}
