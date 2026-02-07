import styles from './MenuButton.module.css';

export default function MenuButton({ children, onClick, half, clickable=true }) {
  return (
  <button className={`${styles.button} ${half ? styles.buttonHalf : styles.buttonFull} ${clickable ? styles.clickable : styles.unclickable}`} onClick={onClick} disabled={!clickable}>
    {children}
  </button>
  );

}
