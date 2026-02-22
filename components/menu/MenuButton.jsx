import styles from './MenuButton.module.css';

export default function MenuButton({ children, onClick, half, active = true, disabled = false }) {
  if (!active) return null;
  return (
    <button
      type="button"
      className={`${styles.button} ${half ? styles.buttonHalf : styles.buttonFull} ${disabled ? styles.buttonDisabled : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
