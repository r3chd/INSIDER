import fs from "fs";

const words = fs.readFileSync(new URL("../public/assets/words.txt", import.meta.url), "utf8")
  .trim()
  .split(/\r?\n/); // Array from the start

export default function getRandomWord() {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
}
