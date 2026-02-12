import fs from "fs";

const words = fs.readFileSync(new URL("../public/assets/words.txt", import.meta.url), "utf8")
  .trim()
  .split(/\r?\n/); // Array from the start

function getRandomWord() {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
}

export default function generateRandomWords() {
    let words = [];
    while (words.length < 3) {
        const randomWord = getRandomWord();
        if (!words.includes(randomWord)) {
        words.push(randomWord);
        }
    }

    return words;
}
