import React from "react";
import styles from "./Menu.module.css";

export default function Menu({ isActive, handleSwitch }) {
  if (!isActive) return null;

  return (
    <div className={`${styles.menu} ${isActive ? styles.active : ""}`}>

          <p> INSIDER </p>
          <div className = {styles.inputBox}>
            <p>name: </p>
            <input></input>
          </div>

          <div className={styles.buttonBox}>
            <button onClick={() => handleSwitch("game")}> create </button> <button> join </button>
          </div>

    </div>
  );
}
