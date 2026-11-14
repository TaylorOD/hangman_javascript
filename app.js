import { PUZZLES } from "./words.js"
import {
  LETTERS, MAX_MISSES, newGame, guess, hint, misses, status, board, letterState,
  dailyPuzzle, randomPuzzle, shareText,
} from "./game.js"

const STORAGE_KEY = "hangman-v1"
const $ = (selector) => document.querySelector(selector)

const today = () => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  } catch {
    // Private windows can block storage. The game still works, it just forgets.
  }
}

const saved = load()
saved.stats ||= { played: 0, won: 0, streak: 0, best: 0 }
saved.recent ||= []
saved.mode = saved.mode === "practice" ? "practice" : "daily"

function dailyGame() {
  const date = today()
  if (saved.daily?.date !== date) saved.daily = { date, game: newGame(dailyPuzzle(PUZZLES, date)) }
  return saved.daily.game
}

function practiceGame() {
  if (!saved.practice) startPractice()
  return saved.practice
}

function startPractice() {
  const puzzle = randomPuzzle(PUZZLES, saved.recent)
  saved.recent = [puzzle.answer, ...saved.recent].slice(0, 40)
  saved.practice = newGame(puzzle)
}

const current = () => (saved.mode === "daily" ? dailyGame() : practiceGame())

function setCurrent(game) {
  if (saved.mode === "daily") saved.daily.game = game
  else saved.practice = game
}

function record(game) {
  if (game.recorded || status(game) === "playing") return game
  const stats = saved.stats
  stats.played += 1
  if (status(game) === "won") {
    stats.won += 1
    stats.streak += 1
    stats.best = Math.max(stats.best, stats.streak)
  } else {
    stats.streak = 0
  }
  return { ...game, recorded: true }
}

function play(update) {
  const before = current()
  let after = update(before)
  if (after === before) return
  after = record(after)
  setCurrent(after)
  save()
  const missed = misses(after) > misses(before)
  render({ missed })
}

// Keyboard

const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"]
const keyboard = $("#keyboard")
rows.forEach((row) => {
  const rowEl = document.createElement("div")
  rowEl.className = "key-row"
  ;[...row].forEach((letter) => {
    const key = document.createElement("button")
    key.type = "button"
    key.className = "key"
    key.dataset.letter = letter
    key.textContent = letter
    key.addEventListener("click", () => play((game) => guess(game, letter)))
    rowEl.append(key)
  })
  keyboard.append(rowEl)
})

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  const letter = event.key.toUpperCase()
  if (LETTERS.includes(letter) && event.key.length === 1) {
    event.preventDefault()
    play((game) => guess(game, letter))
  } else if (event.key === "Enter" && saved.mode === "practice" && status(current()) !== "playing") {
    if (document.activeElement?.tagName === "BUTTON") return
    nextWord()
  }
})

// Buttons

document.querySelectorAll(".mode").forEach((button) =>
  button.addEventListener("click", () => {
    saved.mode = button.dataset.mode
    current()
    save()
    render()
  })
)

$("#hint").addEventListener("click", () => play((game) => hint(game)))

function nextWord() {
  startPractice()
  save()
  render()
}
$("#next").addEventListener("click", nextWord)

$("#share").addEventListener("click", async () => {
  const text = shareText(saved.daily.game, saved.daily.date)
  const button = $("#share")
  try {
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ text })
      return
    }
    await navigator.clipboard.writeText(text)
    button.textContent = "Copied!"
  } catch (error) {
    if (error?.name === "AbortError") return
    button.textContent = "Couldn't copy"
  }
  setTimeout(() => (button.textContent = "Share result"), 2000)
})

// Drawing the page

function render({ missed = false } = {}) {
  const game = current()
  const state = status(game)
  const missCount = misses(game)

  document.querySelectorAll(".mode").forEach((button) =>
    button.setAttribute("aria-pressed", String(button.dataset.mode === saved.mode))
  )
  document.body.dataset.state = state

  $("#category").textContent = game.category

  const puzzle = $("#puzzle")
  puzzle.replaceChildren(
    ...board(game).map((word) => {
      const wordEl = document.createElement("span")
      wordEl.className = "word"
      word.forEach(({ char, shown, missed: revealed }) => {
        const tile = document.createElement("span")
        tile.className = "tile" + (shown ? " shown" : "") + (revealed ? " revealed" : "")
        tile.textContent = shown ? char : ""
        wordEl.append(tile)
      })
      return wordEl
    })
  )
  puzzle.setAttribute(
    "aria-label",
    board(game).map((word) => word.map((t) => (t.shown ? t.char : "blank")).join(" ")).join(", next word, ")
  )

  document.querySelectorAll(".part").forEach((part) =>
    part.classList.toggle("drawn", Number(part.dataset.step) <= missCount)
  )
  $("#gallows").classList.toggle("lost", state === "lost")
  $("#miss-count").textContent = `${missCount} of ${MAX_MISSES} misses`

  document.querySelectorAll(".key").forEach((key) => {
    const result = letterState(game, key.dataset.letter)
    key.dataset.result = result
    key.disabled = result !== "unused" || state !== "playing"
    key.setAttribute("aria-label", `${key.dataset.letter}${result === "unused" ? "" : result === "hit" ? ", in the answer" : ", not in the answer"}`)
  })

  const left = MAX_MISSES - missCount
  const messages = {
    playing: missCount === 0
      ? saved.mode === "daily" ? "Today's puzzle. Type or tap a letter." : "Type or tap a letter."
      : `${left} ${left === 1 ? "miss" : "misses"} left.`,
    won: missCount === 0 ? "Flawless. Not one miss." : `You got it with ${missCount} ${missCount === 1 ? "miss" : "misses"}.`,
    lost: "Hanged. The answer is on the board.",
  }
  let message = messages[state]
  if (state !== "playing" && saved.mode === "daily") message += " New puzzle tomorrow."
  $("#status").textContent = message

  $("#hint").hidden = state !== "playing"
  $("#hint").disabled = game.hintUsed || left <= 1
  $("#next").hidden = !(state !== "playing" && saved.mode === "practice")
  $("#share").hidden = !(state !== "playing" && saved.mode === "daily")

  const stats = saved.stats
  $("#stat-played").textContent = stats.played
  $("#stat-rate").textContent = `${stats.played ? Math.round((stats.won / stats.played) * 100) : 0}%`
  $("#stat-streak").textContent = stats.streak
  $("#stat-best").textContent = stats.best

  if (missed) {
    const frame = $(".board")
    frame.classList.remove("shake")
    void frame.offsetWidth
    frame.classList.add("shake")
  }
}

current()
save()
render()
