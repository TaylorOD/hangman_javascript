const puzzleEl = document.querySelector("#puzzle");
const guessesEl = document.querySelector("#guesses");
const statusEl = document.querySelector("#status");

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

  hangmanGame.puzzle.split("").forEach((letter) => {
    const letterEl = document.createElement("span")
    letterEl.textContent = letter
    puzzleEl.appendChild(letterEl)
  })

}

const startGame = async () => {
  const puzzle = await getPuzzle("2")
  hangmanGame = new Hangman(puzzle, 5)
  render()
}

document.querySelector("#reset").addEventListener("click", startGame)

startGame()