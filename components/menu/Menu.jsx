import { useState }from 'react';
import styles from "./Menu.module.css";

// Menu components
import MenuButton from "./MenuButton";

export default function Menu({ isActive, handleCreate: handleCreate, handleJoin: handleJoin}) {
  if (!isActive) return null;

  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  // for menu components
  const [createActive, setCreateActive] = useState(true);
  // as opposed to 'join' active instead

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
    // setActiveMenuComponent('buttons');
    setCreateActive(true);
  }

  // Specifically showing the ROOMCODE input box
  const handleJoinTransitionPressed = () => {
    // setActiveMenuComponent('join');
    setCreateActive(false);
  }

  // Specifically joining a room
  const handleJoinRoomPressed = () => {
    handleJoin(roomCode, name)
  }


  return (
    <div className={`${styles.menu} ${isActive ? styles.active : ""}`}>

      <div className={styles.menuInteractable}>
          <p> INSIDER </p>

          
          <div className = {styles.inputBox}>
            <p>name: </p>
            <input onChange={handleNameChange}></input>
          </div>


          {/* Make two divs - one for buttons and join */}
          {/* Each div should have an active an inactive */}
          {/* Each should have the buttons within */}

          {/* First Div */}
          <div className = {`${styles.buttonBox} ${createActive ? styles.active : ""}`}>

            <MenuButton children="create" onClick={handleCreateButtonPressed}/>
            <MenuButton children="join" onClick={handleJoinTransitionPressed}/>
          </div>


          {/* Second Div */}
          <div className = {`${styles.buttonBox} ${createActive ? "" : styles.active}`}>

            <MenuButton children="back" onClick={handleBackButtonPressed}/>
            <p> or join one </p>
            <input onChange={onRoomCodeChange}></input>
            <MenuButton children="join" onClick={handleJoinRoomPressed}/>

          </div>

      </div>
    </div>
  );
}
