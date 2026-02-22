const app = document.getElementById('app');
app.hidden = false;

const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

function activateTab(tabId) {
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === tabId));
  panels.forEach((panel) => panel.classList.toggle('active', panel.id === tabId));
}

tabs.forEach((tab) => tab.addEventListener('click', () => activateTab(tab.dataset.tab)));

const tutorialSteps = [
  'Step 1/3 — Read instructions and understand the interface.',
  'Step 2/3 — Answer QCM questions by selecting one option.',
  'Step 3/3 — Submit before the timer ends.',
];
let tutorialIndex = 0;

const tutorialText = document.getElementById('tutorialText');
const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progressBar');

function renderTutorial() {
  tutorialText.textContent = tutorialSteps[tutorialIndex];
  progressText.textContent = `${tutorialIndex + 1} / ${tutorialSteps.length} steps`;
  progressBar.style.width = `${((tutorialIndex + 1) / tutorialSteps.length) * 100}%`;
}

document.getElementById('prevStep').addEventListener('click', () => {
  tutorialIndex = Math.max(0, tutorialIndex - 1);
  renderTutorial();
});

document.getElementById('nextStep').addEventListener('click', () => {
  tutorialIndex = Math.min(tutorialSteps.length - 1, tutorialIndex + 1);
  renderTutorial();
});

let questions = [];
let activeQuestion = null;
let latestScore = 0;
let scoreHistory = [];
let isFinished = false;

const finishBtn = document.getElementById('finishBtn');
const sessionStatus = document.getElementById('sessionStatus');
const completionCard = document.getElementById('completionCard');
const completionSummary = document.getElementById('completionSummary');
const promptText = document.getElementById('promptText');
const scorePill = document.getElementById('scorePill');
const integrityLog = document.getElementById('integrityLog');
const questionSelect = document.getElementById('questionSelect');
const attemptCount = document.getElementById('attemptCount');
const averageScore = document.getElementById('averageScore');
const questionLevel = document.getElementById('questionLevel');
const qcmForm = document.getElementById('qcmForm');
const submitAnswerBtn = document.getElementById('submitAnswerBtn');
const output = document.getElementById('output');

function updateScore(score) {
  latestScore = score;
  scorePill.textContent = `Score: ${score}/10`;
}

function updateSessionAnalytics() {
  const attempts = scoreHistory.length;
  const average =
    attempts === 0
      ? 0
      : Math.round((scoreHistory.reduce((total, item) => total + item.score, 0) / attempts) * 10) / 10;

  attemptCount.textContent = `Attempts: ${attempts}`;
  averageScore.textContent = `Average score: ${average}/10`;
}

function logIntegrity(message) {
  const li = document.createElement('li');
  li.textContent = `${new Date().toLocaleTimeString()} — ${message}`;
  integrityLog.prepend(li);
}

function renderQuestionSelector() {
  questionSelect.innerHTML = '';
  questions.forEach((question, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `${index + 1}. [${question.level}] ${question.title}`;
    questionSelect.appendChild(option);
  });
}

function renderQcmOptions(question) {
  qcmForm.innerHTML = '';
  question.options.forEach((choice, index) => {
    const label = document.createElement('label');
    label.className = 'qcm-option';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'qcmChoice';
    radio.value = String(index);
    radio.disabled = isFinished;

    const text = document.createElement('span');
    text.textContent = choice;

    label.appendChild(radio);
    label.appendChild(text);
    qcmForm.appendChild(label);
  });
}

function loadQuestion(question) {
  activeQuestion = question;
  promptText.textContent = question.prompt;
  questionLevel.textContent = `${question.level} · ~${question.estimatedMinutes} min`;
  renderQcmOptions(question);
  output.textContent = 'Choose one answer, then submit.';
  updateScore(0);
  logIntegrity(`Loaded QCM question: ${question.id}`);
}

function evaluateCurrentAnswer() {
  if (!activeQuestion) {
    throw new Error('No active QCM question loaded');
  }

  const selection = qcmForm.querySelector('input[name="qcmChoice"]:checked');
  if (!selection) {
    throw new Error('Please select an answer before submitting.');
  }

  const selectedIndex = Number(selection.value);
  const isCorrect = selectedIndex === activeQuestion.correctOptionIndex;
  const score = isCorrect ? 10 : 0;

  return {
    isCorrect,
    score,
    selectedIndex,
    correctIndex: activeQuestion.correctOptionIndex,
  };
}

async function initializeQuestionBank() {
  try {
    const response = await fetch('questions.json');
    if (!response.ok) {
      throw new Error(`Unable to load questions.json (${response.status})`);
    }

    const bank = await response.json();
    const qcmOnly = Array.isArray(bank)
      ? bank.filter((item) => item.type === 'qcm' && Array.isArray(item.options) && item.options.length >= 2)
      : [];

    if (qcmOnly.length === 0) {
      throw new Error('No QCM questions found in the question bank');
    }

    questions = qcmOnly;
    renderQuestionSelector();
    questionSelect.value = '0';
    loadQuestion(questions[0]);
  } catch (error) {
    output.textContent = `❌ Setup error\n${error.message}`;
    submitAnswerBtn.disabled = true;
    logIntegrity(`Question bank load failed: ${error.message}`);
  }
}

questionSelect.addEventListener('change', () => {
  if (isFinished) return;
  const selectedIndex = Number(questionSelect.value);
  const question = questions[selectedIndex];
  if (!question) return;
  loadQuestion(question);
});

submitAnswerBtn.addEventListener('click', () => {
  if (isFinished) return;

  try {
    const result = evaluateCurrentAnswer();
    updateScore(result.score);
    scoreHistory.push({ questionId: activeQuestion.id, score: result.score });
    updateSessionAnalytics();

    if (result.isCorrect) {
      output.textContent = '✅ Correct answer. +10 points';
    } else {
      output.textContent = `❌ Incorrect answer. Correct option: ${activeQuestion.options[result.correctIndex]}`;
    }

    logIntegrity(
      `Submitted QCM answer (${result.isCorrect ? 'correct' : 'incorrect'}) for question ${activeQuestion.id}`,
    );
  } catch (error) {
    output.textContent = `⚠️ ${error.message}`;
  }
});

window.addEventListener('blur', () => {
  logIntegrity('Browser window blur detected');
});

let remainingSeconds = 90 * 60;
const initialSeconds = remainingSeconds;
const timer = document.getElementById('timer');

function formatDuration(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function finishAssessment(reason) {
  if (isFinished) return;

  isFinished = true;
  submitAnswerBtn.disabled = true;
  questionSelect.disabled = true;
  finishBtn.disabled = true;

  qcmForm.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.disabled = true;
  });

  sessionStatus.textContent = 'Submitted';
  sessionStatus.classList.add('done');

  const spentSeconds = initialSeconds - remainingSeconds;
  const logCount = integrityLog.querySelectorAll('li').length;
  completionSummary.textContent =
    `Reason: ${reason}. Time used: ${formatDuration(spentSeconds)}. Score: ${latestScore}/10. Integrity events: ${logCount}.`;
  completionCard.hidden = false;

  output.textContent = `${output.textContent}\n\n✅ Assessment locked and submitted.`;
  activateTab('integrity');
  logIntegrity(`Assessment submitted (${reason})`);
}

const countdown = setInterval(() => {
  if (isFinished) {
    clearInterval(countdown);
    return;
  }

  remainingSeconds = Math.max(0, remainingSeconds - 1);
  timer.textContent = `Time: ${formatDuration(remainingSeconds)}`;

  if (remainingSeconds === 0) {
    finishAssessment('time elapsed');
  }
}, 1000);

finishBtn.addEventListener('click', () => finishAssessment('manual submit'));

renderTutorial();
updateScore(0);
updateSessionAnalytics();
logIntegrity('Session started (QCM-only mode)');
initializeQuestionBank();
