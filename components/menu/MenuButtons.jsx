import styles from "./Menu.module.css";

export default function MenuButtons({ isActiveComponent, 
    handleCreateButtonPressed: handleCreateButtonPressed, 
    handleJoinButtonPressed: handleJoinButtonPressed}) {

    if (!isActiveComponent) return null;

    return (
        <div className={styles.buttonBox}>
            <button onClick={() => handleCreateButtonPressed()}> create </button>
            <button onClick={() => handleJoinButtonPressed()}> join </button>
        </div>
    );

}
