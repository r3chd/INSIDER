import { useState }from 'react';
import styles from "./Menu.module.css";

// Menu components
import MenuButton from "./MenuButton";

const EMPTY_NAME_MSG = "Please enter a name to create or join.";

export default function Menu({ handleCreate, handleJoin, joinError}) {
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
  }
  const onRoomCodeChange = (e) => {
    // codes are always uppercase
    setRoomCode(e.target.value.toUpperCase());
  }

  // For navigating between components
  const handleCreateButtonPressed = () => {
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
    <div className={styles.menu}>

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

            <MenuButton onClick={handleCreateButtonPressed}> create </MenuButton>
            <MenuButton onClick={handleJoinTransitionPressed}> join </MenuButton>
          </div>


          {/* Second Div */}
          <div className = {`${styles.buttonBox} ${createActive ? "" : styles.active}`}>

            <MenuButton onClick={handleBackButtonPressed}> X </MenuButton>
            <p></p>
            <input onChange={onRoomCodeChange} value={roomCode} aria-invalid={!!joinError}></input>
            <MenuButton children="join" onClick={handleJoinRoomPressed}/>

          </div>

          {joinError && <p className={styles.nameError} role="alert">{joinError}</p>}

      </div>
    </div>
  );
}
