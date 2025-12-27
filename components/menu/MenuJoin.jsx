import styles from "./Menu.module.css";

export default function MenuJoin({ isActiveComponent, roomCode, onRoomCodeChange: onRoomCodeChange, 
    handleBackButtonPressed: handleBackButtonPressed,
    handleJoinRoomButtonPressed: handleJoinRoomButtonPressed}) {

    if (!isActiveComponent) return null;

    return (
        <div className = {styles.inputBox}>
            <button onClick={() => handleBackButtonPressed()}> back </button>
            <p> or join one... </p>
            <input onChange={(e) => onRoomCodeChange(e)}></input>

            <button onClick={() => handleJoinRoomButtonPressed()}> join </button>
        </div>

    );

}



