import { test } from "node:test"
import assert from "node:assert/strict"
import { PUZZLES, CATEGORIES } from "../../words.js"
import {
  MAX_MISSES, newGame, guess, hint, misses, status, board, letterState,
  dailyPuzzle, randomPuzzle, shareText, dayNumber,
} from "../../game.js"

const play = (game, letters) => [...letters].reduce(guess, game)
const fox = () => newGame({ category: "Animals", answer: "Red Fox" })

test("every answer is letters and single spaces", () => {
  for (const { answer } of PUZZLES) assert.match(answer, /^[A-Z']+( [A-Z']+)*$/, answer)
})

test("no answer shows up twice", () => {
  const answers = PUZZLES.map((p) => p.answer)
  assert.equal(new Set(answers).size, answers.length)
})

test("every category has plenty of puzzles", () => {
  for (const [name, list] of Object.entries(CATEGORIES)) assert.ok(list.length >= 15, name)
})

test("right guesses fill in every copy of the letter", () => {
  const game = play(fox(), "E")
  assert.deepEqual(board(game).flat().map((t) => t.shown), [false, true, false, false, false, false])
  assert.equal(misses(game), 0)
})

test("wrong guesses count as misses", () => {
  const game = play(fox(), "ZQ")
  assert.equal(misses(game), 2)
  assert.equal(letterState(game, "Z"), "miss")
  assert.equal(letterState(game, "E"), "unused")
})

test("guessing a letter twice or a non letter changes nothing", () => {
  const game = play(fox(), "Z")
  assert.equal(guess(game, "z"), game)
  assert.equal(guess(game, "1"), game)
  assert.equal(guess(game, "AB"), game)
})

test("solving every letter wins", () => {
  assert.equal(status(play(fox(), "REDFOX")), "won")
})

test("six misses loses and shows the answer", () => {
  const game = play(fox(), "ABCGHI")
  assert.equal(misses(game), MAX_MISSES)
  assert.equal(status(game), "lost")
  assert.ok(board(game).flat().every((t) => t.shown))
  assert.deepEqual(board(game).flat().filter((t) => t.missed).map((t) => t.char), ["R", "E", "D", "F", "O", "X"])
})

test("no guesses count after the game ends", () => {
  const game = play(fox(), "REDFOX")
  assert.equal(guess(game, "Z"), game)
})

test("a hint shows a missing letter and costs one miss", () => {
  const game = hint(play(fox(), "R"), () => 0)
  assert.ok(game.hintUsed)
  assert.equal(misses(game), 1)
  assert.equal(game.guesses.at(-1), "E")
})

test("only one hint per game, and never on the last miss", () => {
  const once = hint(fox(), () => 0)
  assert.equal(hint(once, () => 0), once)
  const almost = play(fox(), "ABCGH")
  assert.equal(hint(almost), almost)
})

test("everyone gets the same daily puzzle on the same date", () => {
  assert.deepEqual(dailyPuzzle(PUZZLES, "2026-11-14"), dailyPuzzle(PUZZLES, "2026-11-14"))
  assert.notDeepEqual(dailyPuzzle(PUZZLES, "2026-11-14"), dailyPuzzle(PUZZLES, "2026-11-15"))
})

test("the daily puzzle goes through the whole list before repeating", () => {
  const start = dayNumber("2026-01-01")
  const seen = new Set()
  for (let day = 0; day < PUZZLES.length; day++) {
    const date = new Date((start + day) * 86400000).toISOString().slice(0, 10)
    seen.add(dailyPuzzle(PUZZLES, date).answer)
  }
  assert.equal(seen.size, PUZZLES.length)
})

test("practice skips recent puzzles", () => {
  const recent = PUZZLES.slice(1).map((p) => p.answer)
  assert.equal(randomPuzzle(PUZZLES, recent).answer, PUZZLES[0].answer)
})

test("share text has the date, result and no spoilers", () => {
  const text = shareText(play(fox(), "ZREDFOX"), "2026-11-14")
  assert.match(text, /Hangman 2026-11-14/)
  assert.match(text, /solved with 1 miss\n/)
  assert.match(text, /🟥⬜⬜⬜⬜⬜/)
  assert.doesNotMatch(text, /FOX/i)
})
