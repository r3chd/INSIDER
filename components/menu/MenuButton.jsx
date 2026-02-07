import styles from './MenuButton.module.css';

export default function MenuButton({ children, onClick, half }) {
  return (
  <button className={`${styles.button} ${half ? styles.buttonHalf : styles.buttonFull} `} onClick={onClick} >
    {children}
  </button>
  );

}
