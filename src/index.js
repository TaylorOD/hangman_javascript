import Hangman from "./hangman_functions"
import getPuzzle from "./requests"

const puzzleEl = document.querySelector("#puzzle");
const guessesEl = document.querySelector("#guesses");
const statusEl = document.querySelector("#status");
const guessedLettersEl = document.querySelector("#guessed");

let hangmanGame

window.addEventListener("keypress", (e) => {
  const guess = String.fromCharCode(e.charCode)

  hangmanGame.makeGuess(guess)
  hangmanGame.calculateStatus()
  render()
  
})

const render = () => {
  puzzleEl.innerHTML = ""
  statusEl.textContent = hangmanGame.statusMessage;
  guessedLettersEl.innerHTML = ""

  hangmanGame.puzzle.split("").forEach((letter) => {
    const letterEl = document.createElement("span")
    letterEl.textContent = letter
    puzzleEl.appendChild(letterEl)
  })

  hangmanGame.guessedLetters.forEach((letter) => {
    const guessedLetterEl = document.createElement("span")
    guessedLetterEl.textContent = letter
    guessed.appendChild(guessedLetterEl)
  })


}

const startGame = async () => {
  const puzzle = await getPuzzle("2")
  hangmanGame = new Hangman(puzzle, 5)
  render()
}

document.querySelector("#reset").addEventListener("click", startGame)

startGame()