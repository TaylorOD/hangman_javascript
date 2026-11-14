export const MAX_MISSES = 6
export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

const isLetter = (char) => char >= "A" && char <= "Z"

export function newGame({ category, answer }) {
  return { category, answer: answer.toUpperCase(), guesses: [], hintUsed: false }
}

export function misses(game) {
  return game.guesses.filter((letter) => !game.answer.includes(letter)).length + (game.hintUsed ? 1 : 0)
}

export function isSolved(game) {
  return [...game.answer].every((char) => !isLetter(char) || game.guesses.includes(char))
}

export function status(game) {
  if (isSolved(game)) return "won"
  if (misses(game) >= MAX_MISSES) return "lost"
  return "playing"
}

export function guess(game, letter) {
  letter = String(letter).toUpperCase()
  if (!isLetter(letter) || letter.length !== 1) return game
  if (status(game) !== "playing" || game.guesses.includes(letter)) return game
  return { ...game, guesses: [...game.guesses, letter] }
}

// Shows one missing letter, and the hangman gets one more line for it.
export function hint(game, random = Math.random) {
  if (game.hintUsed || status(game) !== "playing" || misses(game) >= MAX_MISSES - 1) return game
  const missing = [...new Set([...game.answer].filter((char) => isLetter(char) && !game.guesses.includes(char)))]
  const letter = missing[Math.floor(random() * missing.length)]
  return { ...game, guesses: [...game.guesses, letter], hintUsed: true }
}

export function letterState(game, letter) {
  if (!game.guesses.includes(letter)) return "unused"
  return game.answer.includes(letter) ? "hit" : "miss"
}

// The answer split into words, with each letter shown or hidden.
export function board(game) {
  const done = status(game) !== "playing"
  return game.answer.split(" ").map((word) =>
    [...word].map((char) => ({
      char,
      shown: !isLetter(char) || game.guesses.includes(char) || done,
      missed: done && isLetter(char) && !game.guesses.includes(char),
    }))
  )
}

export function dayNumber(date) {
  const [year, month, day] = date.split("-").map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000)
}

function seededShuffle(items, seed) {
  const list = [...items]
  let state = seed
  const random = () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

// Everyone gets the same puzzle on the same day, and it walks the whole list before repeating.
export function dailyPuzzle(puzzles, date) {
  const order = seededShuffle(puzzles, 2026)
  return order[dayNumber(date) % order.length]
}

export function randomPuzzle(puzzles, recent = [], random = Math.random) {
  const fresh = puzzles.filter((puzzle) => !recent.includes(puzzle.answer))
  const pool = fresh.length ? fresh : puzzles
  return pool[Math.floor(random() * pool.length)]
}

export function shareText(game, date) {
  const missed = misses(game)
  const result = status(game) === "won" ? `solved with ${missed} ${missed === 1 ? "miss" : "misses"}` : "got hanged"
  const squares = "🟥".repeat(missed) + "⬜".repeat(MAX_MISSES - missed)
  return `Hangman ${date}\n${result}${game.hintUsed ? " (used a hint)" : ""}\n${squares}\nhttps://www.taylordorsett.com/hangman_javascript/`
}
