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
  'Step 2/3 — Questions are random with equal rotation for SQL / Java / Angular / TypeScript / Spring Framework.',
  'Step 3/3 — Enable no limit mode for an unlimited session and stop manually to see your score.',
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

const THEMES = ['SQL', 'Java', 'Angular', 'TypeScript', 'Spring Framework'];
let questionsByTheme = new Map();
let isFinished = false;
let activeQuestion = null;
let latestScore = 0;
let scoreHistory = [];
let hasAnsweredCurrentQuestion = false;
let noLimitEnabled = false;
let themePointer = 0;
let themeOrder = [];
let usedQuestionsByTheme = new Map();
let themeDrawCounts = new Map(THEMES.map((theme) => [theme, 0]));
let lastQuestionIdByTheme = new Map();

const finishBtn = document.getElementById('finishBtn');
const sessionStatus = document.getElementById('sessionStatus');
const completionCard = document.getElementById('completionCard');
const completionSummary = document.getElementById('completionSummary');
const promptText = document.getElementById('promptText');
const scorePill = document.getElementById('scorePill');
const integrityLog = document.getElementById('integrityLog');
const attemptCount = document.getElementById('attemptCount');
const averageScore = document.getElementById('averageScore');
const themeDistribution = document.getElementById('themeDistribution');
const scoringMethod = document.getElementById('scoringMethod');
const questionLevel = document.getElementById('questionLevel');
const questionLanguage = document.getElementById('questionLanguage');
const qcmForm = document.getElementById('qcmForm');
const submitAnswerBtn = document.getElementById('submitAnswerBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const output = document.getElementById('output');
const noLimitMode = document.getElementById('noLimitMode');

function shuffle(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getQuestionWeight(question) {
  const levelWeights = {
    Beginner: 0.8,
    Intermediate: 1,
    Advanced: 1.2,
    Expert: 1.4,
  };

  const levelWeight = levelWeights[question.level] || 1;
  const timeWeight = Math.max(1, Number(question.estimatedMinutes) || 1) / 2;

  return levelWeight * timeWeight;
}

function computeAverageScore() {
  if (scoreHistory.length === 0) return 0;

  const weightedPoints = scoreHistory.reduce((acc, attempt) => acc + attempt.score * attempt.weight, 0);
  const totalWeight = scoreHistory.reduce((acc, attempt) => acc + attempt.weight, 0);

  if (totalWeight === 0) return 0;
  return Math.round((weightedPoints / totalWeight) * 10) / 10;
}

function updateScore(score) {
  latestScore = score;
  scorePill.textContent = `Score: ${score}/10`;
}

function updateSessionAnalytics() {
  const attempts = scoreHistory.length;
  const average = computeAverageScore();

  attemptCount.textContent = `Attempts: ${attempts}`;
  averageScore.textContent = `Average score: ${average}/10`;
  scoringMethod.textContent = 'Scoring: weighted average (difficulty + estimated time)';
  themeDistribution.textContent = `Distribution: ${THEMES.map((theme) => `${theme} ${themeDrawCounts.get(theme)}`).join(' · ')}`;
}

function logIntegrity(message) {
  const li = document.createElement('li');
  li.textContent = `${new Date().toLocaleTimeString()} — ${message}`;
  integrityLog.prepend(li);
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

function prepareQuestionForDisplay(question) {
  const indexedOptions = question.options.map((text, index) => ({ text, index }));
  const shuffledOptions = shuffle(indexedOptions);
  const remappedCorrectIndex = shuffledOptions.findIndex(
    (option) => option.index === question.correctOptionIndex,
  );

  return {
    ...question,
    options: shuffledOptions.map((option) => option.text),
    correctOptionIndex: remappedCorrectIndex,
  };
}

function loadQuestion(question) {
  activeQuestion = prepareQuestionForDisplay(question);
  promptText.textContent = question.prompt;
  questionLevel.textContent = `${activeQuestion.level} · ~${activeQuestion.estimatedMinutes} min`;
  questionLanguage.textContent = `Theme: ${activeQuestion.theme}`;
  renderQcmOptions(activeQuestion);
  output.textContent = 'Choose one answer, then submit.';
  hasAnsweredCurrentQuestion = false;
  submitAnswerBtn.disabled = false;
  updateScore(0);
  logIntegrity(`Loaded QCM question: ${activeQuestion.id} (${activeQuestion.theme})`);
}

function nextTheme() {
  if (themeOrder.length === 0 || themePointer >= themeOrder.length) {
    themeOrder = shuffle(THEMES);
    themePointer = 0;
  }

  const theme = themeOrder[themePointer];
  themePointer += 1;
  return theme;
}

function pickQuestionForTheme(theme) {
  const bank = questionsByTheme.get(theme) || [];
  if (bank.length === 0) return null;

  const used = usedQuestionsByTheme.get(theme) || new Set();
  const unused = bank.filter((item) => !used.has(item.id));
  let source = unused.length > 0 ? unused : bank;

  if (unused.length === 0 && source.length > 1) {
    const lastQuestionId = lastQuestionIdByTheme.get(theme);
    const withoutLastQuestion = source.filter((item) => item.id !== lastQuestionId);
    if (withoutLastQuestion.length > 0) {
      source = withoutLastQuestion;
    }
  }

  const selected = source[Math.floor(Math.random() * source.length)];
  if (!unused.length) {
    used.clear();
  }
  used.add(selected.id);
  lastQuestionIdByTheme.set(theme, selected.id);
  usedQuestionsByTheme.set(theme, used);
  themeDrawCounts.set(theme, (themeDrawCounts.get(theme) || 0) + 1);
  return selected;
}

function loadNextRandomQuestion() {
  if (isFinished) return;

  const theme = nextTheme();
  const question = pickQuestionForTheme(theme);

  if (!question) {
    output.textContent = `⚠️ No question found for theme ${theme}`;
    return;
  }

  loadQuestion(question);
  updateSessionAnalytics();
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
    correctIndex: activeQuestion.correctOptionIndex,
    weight: getQuestionWeight(activeQuestion),
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
      ? bank.filter(
          (item) =>
            item.type === 'qcm' &&
            THEMES.includes(item.theme) &&
            Array.isArray(item.options) &&
            item.options.length >= 2,
        )
      : [];

    questionsByTheme = new Map(THEMES.map((theme) => [theme, qcmOnly.filter((item) => item.theme === theme)]));

    const missing = THEMES.filter((theme) => (questionsByTheme.get(theme) || []).length === 0);
    if (missing.length > 0) {
      throw new Error(`Missing themes in question bank: ${missing.join(', ')}`);
    }

    usedQuestionsByTheme = new Map(THEMES.map((theme) => [theme, new Set()]));
    lastQuestionIdByTheme = new Map();
    loadNextRandomQuestion();
  } catch (error) {
    output.textContent = `❌ Setup error\n${error.message}`;
    submitAnswerBtn.disabled = true;
    nextQuestionBtn.disabled = true;
    logIntegrity(`Question bank load failed: ${error.message}`);
  }
}

submitAnswerBtn.addEventListener('click', () => {
  if (isFinished) return;
  if (hasAnsweredCurrentQuestion) {
    output.textContent = '⚠️ This question has already been submitted. Load the next one to continue.';
    return;
  }

  try {
    const result = evaluateCurrentAnswer();
    updateScore(result.score);
    scoreHistory.push({
      questionId: activeQuestion.id,
      score: result.score,
      theme: activeQuestion.theme,
      weight: result.weight,
    });
    hasAnsweredCurrentQuestion = true;
    submitAnswerBtn.disabled = true;
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

nextQuestionBtn.addEventListener('click', loadNextRandomQuestion);

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
  nextQuestionBtn.disabled = true;
  finishBtn.disabled = true;
  noLimitMode.disabled = true;

  qcmForm.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.disabled = true;
  });

  sessionStatus.textContent = 'Submitted';
  sessionStatus.classList.add('done');

  const spentSeconds = noLimitEnabled ? null : initialSeconds - remainingSeconds;
  const logCount = integrityLog.querySelectorAll('li').length;
  const attempts = scoreHistory.length;
  const average = computeAverageScore();

  completionSummary.textContent =
    `Reason: ${reason}. ` +
    `${noLimitEnabled ? 'Time used: unlimited mode.' : `Time used: ${formatDuration(spentSeconds)}.`} ` +
    `Final average score: ${average}/10 over ${attempts} attempts. Integrity events: ${logCount}.`;
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

  if (noLimitEnabled) {
    timer.textContent = 'Time: ∞ (no limit)';
    return;
  }

  remainingSeconds = Math.max(0, remainingSeconds - 1);
  timer.textContent = `Time: ${formatDuration(remainingSeconds)}`;

  if (remainingSeconds === 0) {
    finishAssessment('time elapsed');
  }
}, 1000);

noLimitMode.addEventListener('change', () => {
  if (isFinished) return;
  noLimitEnabled = noLimitMode.checked;
  timer.textContent = noLimitEnabled ? 'Time: ∞ (no limit)' : `Time: ${formatDuration(remainingSeconds)}`;
  logIntegrity(`No limit mode ${noLimitEnabled ? 'enabled' : 'disabled'}`);
});

finishBtn.addEventListener('click', () => finishAssessment('manual stop'));

renderTutorial();
updateScore(0);
updateSessionAnalytics();
logIntegrity('Session started (balanced random QCM mode)');
initializeQuestionBank();
