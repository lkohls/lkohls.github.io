const GAME_DURATION = 5 * 60;
const timerElement = document.getElementById("timer");
const scoreElement = document.getElementById("score");
const statusElement = document.getElementById("status");
const questionElement = document.getElementById("question");
const answerInput = document.getElementById("answer");
const answerForm = document.getElementById("answer-form");
const submitButton = document.getElementById("submit-btn");
const startButton = document.getElementById("start-btn");

let timeLeft = GAME_DURATION;
let score = 0;
let currentProblem = null;
let timerId = null;
let gameActive = false;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function updateTimer() {
  timerElement.textContent = formatTime(timeLeft);
}

function updateScore() {
  scoreElement.textContent = score;
}

function setInputEnabled(enabled) {
  answerInput.disabled = !enabled;
  submitButton.disabled = !enabled;
  if (enabled) {
    answerInput.focus();
  }
}

function setStatus(message) {
  statusElement.textContent = message;
}

function generateProblem() {
  const left = Math.floor(Math.random() * 20) + 1;
  const right = Math.floor(Math.random() * 20) + 1;
  currentProblem = {
    left,
    right,
    answer: left + right,
  };
  questionElement.textContent = `${left} + ${right} = ?`;
}

function startGame() {
  clearInterval(timerId);

  score = 0;
  timeLeft = GAME_DURATION;
  updateScore();
  updateTimer();

  generateProblem();
  setInputEnabled(true);
  setStatus("Solve the problem quickly.");
  gameActive = true;
  startButton.textContent = "Restart";

  timerId = window.setInterval(() => {
    timeLeft -= 1;
    updateTimer();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  clearInterval(timerId);
  gameActive = false;
  setInputEnabled(false);
  setStatus(`Time is up. You solved ${score} problem${score === 1 ? "" : "s"}.`);
  startButton.textContent = "Start Again";
}

startButton.addEventListener("click", () => {
  startGame();
});

answerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!gameActive || !currentProblem) {
    return;
  }

  const submittedAnswer = Number(answerInput.value);

  if (submittedAnswer === currentProblem.answer) {
    score += 1;
    updateScore();
    setStatus("Correct.");
  } else {
    setStatus(`Incorrect. The answer was ${currentProblem.answer}.`);
  }

  answerInput.value = "";
  generateProblem();
});

updateTimer();
setInputEnabled(false);
