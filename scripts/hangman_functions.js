class Hangman { 
  constructor(word, allowedGuesses) {
    this.word = word.toLowerCase().split("");
    this.allowedGuesses = allowedGuesses;
    this.guessedLetters = [];
    this.status = "playing";
  }
  get puzzle() {
    let puzzle = "";
    this.word.forEach((letter) => {
      if (this.guessedLetters.includes(letter) || letter === " ") {
        puzzle += letter;

      } else {
        puzzle += "*";

      }
    });
    return puzzle;
  }
  makeGuess(guess) {
    if (this.status === "playing") {
      guess = guess.toLowerCase();
      const isUnique = !this.guessedLetters.includes(guess);
      const isBadGuess = !this.word.includes(guess);
  
      if (isUnique) {
        this.guessedLetters.push(guess);
  
      }  
      if (isUnique && isBadGuess) {
        this.allowedGuesses -= 1;
      }
      this.status;
    }
  }
  calculateStatus() {
    const finished = this.word.every((letter) => this.guessedLetters.includes(letter) || letter === " ")
        
    if (this.allowedGuesses <= 0) {
      this.status = "failed";
    } else if (finished) {
      this.status = "finished";
    } else {
      this.status = "playing";
    }

    return this.status;
  }
  get statusMessage() {
    if (this.status === "playing") {
      return `Playing: You have ${this.allowedGuesses} guesses remaining.`
    } else if (this.status === "failed") {
      return `Failed: Nice try! The word was "${this.word.join("")}".`
    } else if (this.status === "finished") {
      return "Finished: Great job! You guessed the word."
    }
  }
}