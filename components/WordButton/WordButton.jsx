

import styles from "./WordButton.module.css";

export default function WordButton({ word, onSelect }) {

    const wordSelected = () => {
        onSelect?.(word);
    };


  return (
    <div className={`${styles.wordButton}`} onClick={wordSelected}>
        {word}
    </div>
  );
}
