const GAME_DURATION = 3 * 60;
const motivationalPhrases = ["Nice work!", "You’re doing great!", "Keep it up!"];
const resultsEndpointParam = new URLSearchParams(window.location.search).get("resultsEndpoint");
const RESULTS_ENDPOINT = resultsEndpointParam || "https://script.google.com/macros/s/AKfycbzc08Ud4I47SJiFMrdstapRXZqODP2WsED4NCKh4zxBlcOPMT6r7xzLf65OQviREY24uA/exec";

const state = {
  phase: "landing",
  firstCondition: null,
  secondCondition: null,
  currentCondition: null,
  surveyOne: {},
  surveyTwo: {},
  scoreOne: 0,
  scoreTwo: 0,
  sessionId: null,
  startedAt: null,
};

const landingSection = document.getElementById("landing-section");
const progressSection = document.getElementById("progress-section");
const conditionOneSection = document.getElementById("condition-one-section");
const surveyOneSection = document.getElementById("survey-one-section");
const conditionTwoSection = document.getElementById("condition-two-section");
const surveyTwoSection = document.getElementById("survey-two-section");
const completeSection = document.getElementById("complete-section");

const progressLabel = document.getElementById("progress-label");
const progressFill = document.getElementById("progress-fill");
const assignmentLabel = document.getElementById("assignment-label");
const conditionOneTitle = document.getElementById("condition-one-title");
const conditionTwoTitle = document.getElementById("condition-two-title");

const timerElement = document.getElementById("timer");
const scoreElement = document.getElementById("score");
const statusElement = document.getElementById("status");
const questionElement = document.getElementById("question");
const answerInput = document.getElementById("answer");
const answerForm = document.getElementById("answer-form");
const submitButton = document.getElementById("submit-btn");
const startButton = document.getElementById("start-btn");
const continueConditionOneButton = document.getElementById("continue-after-condition-one");

const timerTwoElement = document.getElementById("timer-two");
const scoreTwoElement = document.getElementById("score-two");
const statusTwoElement = document.getElementById("status-two");
const questionTwoElement = document.getElementById("question-two");
const answerTwoInput = document.getElementById("answer-two");
const answerTwoForm = document.getElementById("answer-form-two");
const submitTwoButton = document.getElementById("submit-btn-two");
const startTwoButton = document.getElementById("start-btn-two");
const continueConditionTwoButton = document.getElementById("continue-after-condition-two");
const completionStatusElement = document.getElementById("completion-status");

let timeLeft = GAME_DURATION;
let score = 0;
let currentProblem = null;
let timerId = null;
let gameActive = false;
let currentMode = "basic";
let roundState = { streak: 0, level: 0 };

function getDifficultyConfig(level) {
  if (level === 0) {
    return {
      label: "Level 1",
      scoreValue: 1,
      min: 1,
      max: 20,
      description: "standard addition",
    };
  }

  if (level === 1) {
    return {
      label: "Level 2",
      scoreValue: 3,
      min: 50,
      max: 99,
      description: "three-digit answers",
    };
  }

  return {
    label: "Level 3",
    scoreValue: 7,
    min: 100,
    max: 999,
    description: "four-digit answers",
  };
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function updateTimer() {
  if (state.phase === "condition1") {
    timerElement.textContent = formatTime(timeLeft);
  } else if (state.phase === "condition2") {
    timerTwoElement.textContent = formatTime(timeLeft);
  }
}

function updateScore() {
  if (state.phase === "condition1") {
    scoreElement.textContent = score;
  } else if (state.phase === "condition2") {
    scoreTwoElement.textContent = score;
  }
}

function setInputEnabled(enabled) {
  if (state.phase === "condition1") {
    answerInput.disabled = !enabled;
    submitButton.disabled = !enabled;
    if (enabled) {
      answerInput.focus();
    }
  } else if (state.phase === "condition2") {
    answerTwoInput.disabled = !enabled;
    submitTwoButton.disabled = !enabled;
    if (enabled) {
      answerTwoInput.focus();
    }
  }
}

function setStatus(message) {
  if (state.phase === "condition1") {
    statusElement.textContent = message;
  } else if (state.phase === "condition2") {
    statusTwoElement.textContent = message;
  }
}

function setCompletionStatus(message) {
  if (completionStatusElement) {
    completionStatusElement.textContent = message;
  }
}

function generateSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function generateProblem() {
  const difficulty = getDifficultyConfig(roundState.level);
  const left = Math.floor(Math.random() * (difficulty.max - difficulty.min + 1)) + difficulty.min;
  const right = Math.floor(Math.random() * (difficulty.max - difficulty.min + 1)) + difficulty.min;
  currentProblem = {
    left,
    right,
    answer: left + right,
  };

  if (state.phase === "condition1") {
    questionElement.textContent = `${left} + ${right} = ?`;
  } else if (state.phase === "condition2") {
    questionTwoElement.textContent = `${left} + ${right} = ?`;
  }
}

function resetGameContext() {
  clearInterval(timerId);
  score = 0;
  timeLeft = GAME_DURATION;
  currentProblem = null;
  gameActive = false;
  roundState = { streak: 0, level: 0 };
  updateScore();
  updateTimer();
  setInputEnabled(false);
  if (state.phase === "condition1") {
    startButton.textContent = "Start round";
    continueConditionOneButton.hidden = true;
    setStatus("Press start to begin.");
  } else if (state.phase === "condition2") {
    startTwoButton.textContent = "Start round";
    continueConditionTwoButton.hidden = true;
    setStatus("Press start to begin.");
  }
}

function startGame() {
  clearInterval(timerId);
  score = 0;
  timeLeft = GAME_DURATION;
  currentProblem = null;
  roundState = { streak: 0, level: 0 };
  updateScore();
  updateTimer();
  generateProblem();
  setInputEnabled(true);
  gameActive = true;

  if (state.phase === "condition1") {
    startButton.textContent = "Restart";
    setStatus(currentMode === "motivational" ? "You’ve got this. Keep going!" : "Solve the problem quickly.");
  } else if (state.phase === "condition2") {
    startTwoButton.textContent = "Restart";
    setStatus(currentMode === "motivational" ? "You’ve got this. Keep going!" : "Solve the problem quickly.");
  }

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

  if (state.phase === "condition1") {
    state.scoreOne = score;
    startButton.textContent = "Start again";
    const closingMessage = currentMode === "motivational"
      ? `Time is up. You solved ${score} problem${score === 1 ? "" : "s"}. Great effort!`
      : `Time is up. You solved ${score} problem${score === 1 ? "" : "s"}.`;
    setStatus(closingMessage);
    continueConditionOneButton.hidden = false;
  } else if (state.phase === "condition2") {
    state.scoreTwo = score;
    startTwoButton.textContent = "Start again";
    const closingMessage = currentMode === "motivational"
      ? `Time is up. You solved ${score} problem${score === 1 ? "" : "s"}. Great effort!`
      : `Time is up. You solved ${score} problem${score === 1 ? "" : "s"}.`;
    setStatus(closingMessage);
    continueConditionTwoButton.hidden = false;
  }
}

function handleAnswer(event) {
  event.preventDefault();
  if (!gameActive || !currentProblem) {
    return;
  }

  const answerValue = Number((state.phase === "condition1" ? answerInput.value : answerTwoInput.value));
  const difficulty = getDifficultyConfig(roundState.level);
  if (answerValue === currentProblem.answer) {
    roundState.streak += 1;
    let earnedPoints = difficulty.scoreValue;
    let message = currentMode === "motivational"
      ? `${motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)]}`
      : "Correct.";

    if (roundState.streak === 3 && roundState.level < 2) {
      roundState.level += 1;
      roundState.streak = 0;
      const nextDifficulty = getDifficultyConfig(roundState.level);
      earnedPoints = nextDifficulty.scoreValue;
      if (currentMode === "motivational") {
        message = `Great job, that was three correct answers in a row. You have unlocked a harder difficulty level.`;
      } else {
        message = `Three correct answers in a row. Difficulty increased.`;
      }
    }

    score += earnedPoints;
    updateScore();
    setStatus(message);
  } else {
    roundState.streak = 0;
    if (roundState.level > 0) {
      roundState.level -= 1;
      setStatus(`Incorrect. The answer was ${currentProblem.answer}. Difficulty dropped.`);
    } else {
      setStatus(`Incorrect. The answer was ${currentProblem.answer}.`);
    }
  }

  if (state.phase === "condition1") {
    answerInput.value = "";
  } else if (state.phase === "condition2") {
    answerTwoInput.value = "";
  }
  generateProblem();
}

function updateProgress() {
  if (state.phase === "landing") {
    progressSection.hidden = true;
    return;
  }

  progressSection.hidden = false;
  const progressSteps = {
    condition1: 25,
    survey1: 50,
    condition2: 75,
    survey2: 100,
    complete: 100,
  };

  progressFill.style.width = `${progressSteps[state.phase]}%`;
  if (state.phase === "condition1") {
    progressLabel.textContent = "Step 1 of 4";
  } else if (state.phase === "survey1") {
    progressLabel.textContent = "Step 2 of 4";
  } else if (state.phase === "condition2") {
    progressLabel.textContent = "Step 3 of 4";
  } else if (state.phase === "survey2") {
    progressLabel.textContent = "Step 4 of 4";
  } else if (state.phase === "complete") {
    progressLabel.textContent = "Complete";
  }
}

function showSection(section) {
  const sections = [landingSection, conditionOneSection, surveyOneSection, conditionTwoSection, surveyTwoSection, completeSection];
  sections.forEach((item) => {
    item.hidden = true;
  });
  section.hidden = false;
  if (state.phase !== "landing") {
    progressSection.hidden = false;
  }
}

function updateView() {
  updateProgress();

  if (state.phase === "landing") {
    showSection(landingSection);
    return;
  }

  if (state.phase === "condition1") {
    showSection(conditionOneSection);
    conditionOneTitle.textContent = "Round 1";
    assignmentLabel.textContent = "You are now beginning the first round.";
    currentMode = state.firstCondition;
    resetGameContext();
    return;
  }

  if (state.phase === "survey1") {
    showSection(surveyOneSection);
    return;
  }

  if (state.phase === "condition2") {
    showSection(conditionTwoSection);
    conditionTwoTitle.textContent = "Round 2";
    assignmentLabel.textContent = "You are now beginning the second round.";
    currentMode = state.secondCondition;
    resetGameContext();
    return;
  }

  if (state.phase === "survey2") {
    showSection(surveyTwoSection);
    return;
  }

  if (state.phase === "complete") {
    showSection(completeSection);
  }
}

function startStudy() {
  state.firstCondition = Math.random() < 0.5 ? "basic" : "motivational";
  state.secondCondition = state.firstCondition === "basic" ? "motivational" : "basic";
  state.phase = "condition1";
  state.scoreOne = 0;
  state.scoreTwo = 0;
  state.surveyOne = {};
  state.surveyTwo = {};
  state.sessionId = generateSessionId();
  state.startedAt = new Date().toISOString();
  setCompletionStatus("Your results will be submitted when the study is complete.");
  updateView();
}

function goToConditionTwo() {
  state.phase = "condition2";
  updateView();
}

function buildResultsPayload() {
  return {
    sessionId: state.sessionId,
    startedAt: state.startedAt,
    completedAt: new Date().toISOString(),
    firstCondition: state.firstCondition,
    secondCondition: state.secondCondition,
    scoreOne: state.scoreOne,
    scoreTwo: state.scoreTwo,
    surveyOne: state.surveyOne,
    surveyTwo: state.surveyTwo,
    roundDurationSeconds: GAME_DURATION,
  };
}

async function submitResults() {
  if (!RESULTS_ENDPOINT) {
    setCompletionStatus("Results will be sent once a submission endpoint is configured.");
    return;
  }

  setCompletionStatus("Submitting your results...");

  try {
    await fetch(RESULTS_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildResultsPayload()),
    });

    setCompletionStatus("Your results were submitted successfully.");
  } catch (error) {
    console.error("Failed to submit study results.", error);
    setCompletionStatus("The study finished, but the results could not be sent automatically.");
  }
}

function submitSurveyOne(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  state.surveyOne = {
    enjoyment: form.get("enjoyment"),
    motivation: form.get("motivation"),
    retry: form.get("retry"),
    satisfaction: form.get("satisfaction"),
    clarity: form.get("clarity"),
    effort: form.get("effort"),
  };
  state.phase = "condition2";
  updateView();
}

async function submitSurveyTwo(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  state.surveyTwo = {
    enjoyment: form.get("enjoyment"),
    motivation: form.get("motivation"),
    retry: form.get("retry"),
    satisfaction: form.get("satisfaction"),
    clarity: form.get("clarity"),
    effort: form.get("effort"),
  };
  state.phase = "complete";
  updateView();
  await submitResults();
}

document.getElementById("start-study-btn").addEventListener("click", startStudy);
startButton.addEventListener("click", startGame);
startTwoButton.addEventListener("click", startGame);
answerForm.addEventListener("submit", handleAnswer);
answerTwoForm.addEventListener("submit", handleAnswer);
continueConditionOneButton.addEventListener("click", () => {
  state.phase = "survey1";
  updateView();
});
continueConditionTwoButton.addEventListener("click", () => {
  state.phase = "survey2";
  updateView();
});
document.getElementById("survey-one-form").addEventListener("submit", submitSurveyOne);
document.getElementById("survey-two-form").addEventListener("submit", submitSurveyTwo);

updateView();
