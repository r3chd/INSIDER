import { useState }from 'react';
import styles from "./Menu.module.css";

// Menu components
import MenuButton from "./MenuButton";

const EMPTY_NAME_MSG = "Please enter a name to create or join.";

export default function Menu({ isActive, handleCreate: handleCreate, handleJoin: handleJoin}) {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [nameError, setNameError] = useState("");

  // for menu components
  const [createActive, setCreateActive] = useState(true);
  // as opposed to 'join' active instead

  // For setting room, name variable
  const handleNameChange = (e) => {
    setName(e.target.value);
    if (nameError) setNameError("");
    console.log("name changed to", name)
  }
  const onRoomCodeChange = (e) => {
    setRoomCode(e.target.value);
    console.log("room code has changed to", roomCode)
  }

  // For navigating between components
  const handleCreateButtonPressed = () => {
    handleCreate(name.trim()); // TEMP TO GET INTO GAME FASTER
    if (!name.trim()) {
      setNameError(EMPTY_NAME_MSG);
      return;
    }
    setNameError("");
    handleCreate(name.trim());
  }

  const handleBackButtonPressed = () => {
    setCreateActive(true);
  }

  // Specifically showing the ROOMCODE input box
  const handleJoinTransitionPressed = () => {
    setCreateActive(false);
  }

  // Specifically joining a room
  const handleJoinRoomPressed = () => {
    if (!name.trim()) {
      setNameError(EMPTY_NAME_MSG);
      return;
    }
    setNameError("");
    handleJoin(roomCode, name.trim());
  }


  return (
    <div className={`${styles.menu} ${isActive ? styles.active : ""}`}>

      <div className={styles.menuInteractable}>

          
          <div className = {styles.inputBox}>
            <p>name: </p>
            <input onChange={handleNameChange} value={name} aria-invalid={!!nameError}></input>
          </div>
          {nameError && <p className={styles.nameError} role="alert">{nameError}</p>}


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

            <MenuButton children="X" onClick={handleBackButtonPressed}/>
            <p></p>
            <input onChange={onRoomCodeChange}></input>
            <MenuButton children="join" onClick={handleJoinRoomPressed}/>

          </div>

      </div>
    </div>
  );
}
