import styles from './MenuButton.module.css';

export default function MenuButton({ children, onClick, half, active=true }) {
  if (!active) return;
  return (
  <button className={`${styles.button} ${half ? styles.buttonHalf : styles.buttonFull} `} onClick={onClick}>
    {children}
  </button>
  );

}
