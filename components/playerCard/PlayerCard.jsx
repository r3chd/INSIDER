import { useState }from 'react';

import styles from "./PlayerCard.module.css";

export default function PlayerCard() { // Arguments needed here in for loop
  const items = [];
  const count = 6; // edit this

  for (let i = 0; i < count; i++) {
    items.push(
      <div key={i} className="squircle">
        Item {i + 1}
      </div>
    );
  }

  return <div className="column">{items}</div>;
}
