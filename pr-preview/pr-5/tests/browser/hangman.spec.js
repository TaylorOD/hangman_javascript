import { test, expect } from "@playwright/test"
import { PUZZLES } from "../../words.js"
import { dailyPuzzle } from "../../game.js"

const DATE = "2026-11-14"
const today = dailyPuzzle(PUZZLES, DATE)
const letters = (answer) => [...new Set(answer.replace(/[^A-Z]/g, ""))]
const wrongLetters = (answer) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").filter((l) => !answer.includes(l))

async function type(page, list) {
  for (const letter of list) await page.keyboard.press(letter.toLowerCase())
}

const shown = (page) => page.locator("#puzzle .tile").evaluateAll((tiles) => tiles.map((t) => t.textContent).join(""))

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(`${DATE}T12:00:00`))
  await page.goto("/")
})

test("starts on today's puzzle with its category", async ({ page }) => {
  await expect(page.locator("#category")).toHaveText(today.category)
  await expect(page.locator("#puzzle .tile")).toHaveCount(today.answer.replace(/ /g, "").length)
  await expect(page.locator("#status")).toHaveText("Today's puzzle. Type or tap a letter.")
})

test("solving the daily puzzle wins and saves the result", async ({ page }) => {
  await type(page, letters(today.answer))
  await expect(page.locator("#status")).toContainText("Flawless")
  await expect(page.locator("#share")).toBeVisible()
  await expect(page.locator("#stat-played")).toHaveText("1")
  await expect(page.locator("#stat-rate")).toHaveText("100%")
  await expect(page.locator(".key").first()).toBeDisabled()

  await page.reload()
  await expect(page.locator("#status")).toContainText("New puzzle tomorrow")
  expect(await shown(page)).toBe(today.answer.replace(/ /g, ""))
})

test("six misses draws the whole man and shows the answer", async ({ page }) => {
  await type(page, wrongLetters(today.answer).slice(0, 6))
  await expect(page.locator(".part.drawn")).toHaveCount(6)
  await expect(page.locator("#gallows")).toHaveClass(/lost/)
  await expect(page.locator("#status")).toContainText("Hanged")
  await expect(page.locator(".tile.revealed")).toHaveCount(today.answer.replace(/ /g, "").length)
  await expect(page.locator("#stat-streak")).toHaveText("0")
})

test("tapping keys marks hits and misses", async ({ page }) => {
  const hit = letters(today.answer)[0]
  const miss = wrongLetters(today.answer)[0]
  await page.locator(`.key[data-letter="${hit}"]`).click()
  await page.locator(`.key[data-letter="${miss}"]`).click()
  await expect(page.locator(`.key[data-letter="${hit}"]`)).toHaveAttribute("data-result", "hit")
  await expect(page.locator(`.key[data-letter="${miss}"]`)).toHaveAttribute("data-result", "miss")
  await expect(page.locator("#miss-count")).toHaveText("1 of 6 misses")
  await expect(page.locator(".part.drawn")).toHaveCount(1)
})

test("a hint fills a letter, costs a miss, and only works once", async ({ page }) => {
  await page.locator("#hint").click()
  await expect(page.locator("#miss-count")).toHaveText("1 of 6 misses")
  await expect(page.locator("#puzzle .tile.shown")).not.toHaveCount(0)
  await expect(page.locator("#hint")).toBeDisabled()
})

test("progress survives a reload", async ({ page }) => {
  await type(page, [letters(today.answer)[0], wrongLetters(today.answer)[0]])
  const before = await shown(page)
  await page.reload()
  expect(await shown(page)).toBe(before)
  await expect(page.locator("#miss-count")).toHaveText("1 of 6 misses")
})

test("practice gives a new word after each game", async ({ page }) => {
  await page.locator('.mode[data-mode="practice"]').click()
  await expect(page.locator('.mode[data-mode="practice"]')).toHaveAttribute("aria-pressed", "true")
  const first = await page.evaluate(() => JSON.parse(localStorage.getItem("hangman-v1")).practice.answer)
  await type(page, letters(first))
  await expect(page.locator("#next")).toBeVisible()
  await expect(page.locator("#share")).toBeHidden()
  await page.locator("#next").click()
  const second = await page.evaluate(() => JSON.parse(localStorage.getItem("hangman-v1")).practice.answer)
  expect(second).not.toBe(first)
  await expect(page.locator("#status")).toHaveText("Type or tap a letter.")

  await page.locator('.mode[data-mode="daily"]').click()
  await expect(page.locator("#category")).toHaveText(today.category)
})

test("share copies a spoiler free result", async ({ page, context, browserName }, info) => {
  test.skip(info.project.name === "phone", "phones open the share sheet instead")
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await type(page, letters(today.answer))
  await page.locator("#share").click()
  await expect(page.locator("#share")).toHaveText("Copied!")
  const text = await page.evaluate(() => navigator.clipboard.readText())
  expect(text).toContain(`Hangman ${DATE}`)
  expect(text).not.toContain(today.answer)
})

test("the longest answers fit without scrolling sideways", async ({ page }) => {
  const longest = [...PUZZLES].sort((a, b) =>
    Math.max(...b.answer.split(" ").map((w) => w.length)) - Math.max(...a.answer.split(" ").map((w) => w.length))
  )[0]
  await page.evaluate((puzzle) => {
    localStorage.setItem("hangman-v1", JSON.stringify({
      mode: "practice",
      practice: { ...puzzle, guesses: [], hintUsed: false },
    }))
  }, longest)
  await page.reload()
  await expect(page.locator("#category")).toHaveText(longest.category)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test("works when storage is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked") } })
  })
  await page.reload()
  await page.keyboard.press(letters(today.answer)[0].toLowerCase())
  await expect(page.locator("#puzzle .tile.shown")).not.toHaveCount(0)
})
