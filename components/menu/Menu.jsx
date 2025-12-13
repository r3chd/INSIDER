import { useState }from 'react';
import styles from "./Menu.module.css";

export default function Menu({ isActive, handleSwitch }) {
  if (!isActive) return null;

  const [name, setName] = useState("");
  const handleChange = (e) => {
    setName(e.target.value);
  };
  return (
    <div className={`${styles.menu} ${isActive ? styles.active : ""}`}>

          <p> INSIDER </p>
          <div className = {styles.inputBox}>
            <p>name: </p>
            <input value={name} onChange={handleChange}></input>
          </div>

          <div className={styles.buttonBox}>
            <button onClick={() => handleSwitch("game", name)}> create </button>
            <button> join </button>
          </div>

    </div>
  );
}