const app = document.getElementById('app');
app.hidden = false;

const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

function activateTab(tabId) {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === tabId;
    tab.classList.toggle('active', isActive);
  });

  panels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === tabId);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => activateTab(tab.dataset.tab));
});

const tutorialSteps = [
  'Step 1/3 — Review the environment and get comfortable with the interface.',
  'Step 2/3 — Try the editor: write code, save it, and run the automatic checks.',
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

let files = {};
let activeQuestion = null;
let latestScore = 0;
let questions = [];
let scoreHistory = [];

let currentFile = 'index.js';
let saved = true;
let isFinished = false;
const fileList = document.getElementById('fileList');
const editor = document.getElementById('editor');
const currentFileLabel = document.getElementById('currentFile');
const savedState = document.getElementById('savedState');
const output = document.getElementById('output');
const finishBtn = document.getElementById('finishBtn');
const runBtn = document.getElementById('runBtn');
const saveBtn = document.getElementById('saveBtn');
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

function createVisibleTestFile(question) {
  const cases = question.tests
    .map(
      (test) =>
        `assertEqual(${question.functionName}(${JSON.stringify(test.input)}), ${test.expected}, '${test.label}');`,
    )
    .join('\n');

  return `const { ${question.functionName} } = require('./index');\n\nfunction assertEqual(actual, expected, label) {\n  if (actual !== expected) {\n    throw new Error(\`${'${label}'}: expected ${'${expected}'}, got ${'${actual}'}\`);\n  }\n}\n\n${cases}\n\nconsole.log('✅ ${question.tests.length}/${question.tests.length} tests passed');\n`;
}

function loadQuestion(question) {
  activeQuestion = question;
  promptText.textContent = question.prompt;
  questionLevel.textContent = `${question.level} · ~${question.estimatedMinutes} min`;
  files = {
    'index.js': question.starterCode,
    'README.md': `# Challenge\n\n${question.prompt}\n`,
    'test.js': createVisibleTestFile(question),
  };

  currentFile = 'index.js';
  editor.value = files[currentFile];
  currentFileLabel.textContent = currentFile;
  saved = true;
  renderSaveState();
  renderFileList();
  output.textContent = 'Console output…';
  updateScore(0);
  logIntegrity(`Loaded question: ${question.id}`);
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

function shuffleQuestions(input) {
  const shuffled = [...input];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const servedQuestionsStorageKey = 'assessment-served-questions';

function getServedQuestionIds() {
  try {
    const raw = localStorage.getItem(servedQuestionsStorageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setServedQuestionIds(ids) {
  localStorage.setItem(servedQuestionsStorageKey, JSON.stringify(ids));
}

function arrangeQuestionOrder(bank) {
  const servedIds = getServedQuestionIds();
  const unseen = bank.filter((question) => !servedIds.includes(question.id));
  const seen = bank.filter((question) => servedIds.includes(question.id));

  if (unseen.length === 0) {
    const reshuffled = shuffleQuestions(bank);
    setServedQuestionIds([reshuffled[0].id]);
    return reshuffled;
  }

  const ordered = [...shuffleQuestions(unseen), ...shuffleQuestions(seen)];
  setServedQuestionIds([...servedIds, ordered[0].id]);
  return ordered;
}

async function initializeQuestionBank() {
  try {
    const response = await fetch('questions.json');
    if (!response.ok) {
      throw new Error(`Unable to load questions.json (${response.status})`);
    }

    const bank = await response.json();
    if (!Array.isArray(bank) || bank.length === 0) {
      throw new Error('Question bank is empty');
    }

    questions = arrangeQuestionOrder(bank);
    renderQuestionSelector();
    questionSelect.value = '0';
    loadQuestion(questions[0]);
  } catch (error) {
    output.textContent = `❌ Setup error\n${error.message}`;
    runBtn.disabled = true;
    saveBtn.disabled = true;
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

function renderFileList() {
  fileList.innerHTML = '';
  Object.keys(files).forEach((fileName) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `file-btn ${fileName === currentFile ? 'active' : ''}`;
    btn.textContent = fileName;
    btn.disabled = isFinished;
    btn.addEventListener('click', () => {
      if (isFinished) return;
      files[currentFile] = editor.value;
      currentFile = fileName;
      logIntegrity(`Switched file to ${fileName}`);
      currentFileLabel.textContent = currentFile;
      editor.value = files[currentFile];
      saved = true;
      renderSaveState();
      renderFileList();
    });
    li.appendChild(btn);
    fileList.appendChild(li);
  });
}

function renderSaveState() {
  savedState.textContent = saved ? 'Saved' : 'Unsaved';
}

function normalizeModuleName(moduleName) {
  if (moduleName === './index') {
    return 'index.js';
  }

  if (moduleName.endsWith('.js')) {
    return moduleName.replace('./', '');
  }

  return `${moduleName.replace('./', '')}.js`;
}

function runModule(fileName, cache, printLine) {
  if (cache[fileName]) {
    return cache[fileName].exports;
  }

  const source = files[fileName];
  if (typeof source !== 'string') {
    throw new Error(`Missing file: ${fileName}`);
  }

  const module = { exports: {} };
  cache[fileName] = module;

  const localRequire = (moduleName) => {
    const normalized = normalizeModuleName(moduleName);
    if (!(normalized in files)) {
      throw new Error(`Cannot find module '${moduleName}'`);
    }
    return runModule(normalized, cache, printLine);
  };

  const localConsole = {
    log: (...args) => printLine(args.map(String).join(' ')),
  };

  const evaluator = new Function('require', 'module', 'exports', 'console', source);
  evaluator(localRequire, module, module.exports, localConsole);
  return module.exports;
}

function deepCloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function evaluateCurrentSolution() {
  const lines = [];
  const printLine = (line) => lines.push(line);
  const exported = runModule('index.js', {}, printLine);

  if (!activeQuestion) {
    throw new Error('No active question loaded');
  }

  const candidateFn = exported[activeQuestion.functionName];
  if (typeof candidateFn !== 'function') {
    throw new Error(`Expected exported function '${activeQuestion.functionName}'`);
  }

  let passed = 0;
  activeQuestion.tests.forEach((test) => {
    const actual = candidateFn(deepCloneValue(test.input));
    if (actual === test.expected) {
      passed += 1;
      lines.push(`✅ ${test.label}`);
      return;
    }
    lines.push(`❌ ${test.label}: expected ${test.expected}, got ${actual}`);
  });

  const score = Math.round((passed / activeQuestion.tests.length) * 10);
  lines.push(`\nResult: ${passed}/${activeQuestion.tests.length} tests passed`);
  lines.push(`Application score: ${score}/10`);

  return { lines, score, passed, total: activeQuestion.tests.length };
}

editor.addEventListener('input', () => {
  if (isFinished) return;
  saved = false;
  renderSaveState();
});

saveBtn.addEventListener('click', () => {
  if (isFinished) return;
  files[currentFile] = editor.value;
  saved = true;
  renderSaveState();
  logIntegrity(`Saved ${currentFile}`);
});

runBtn.addEventListener('click', () => {
  if (isFinished) return;
  files[currentFile] = editor.value;

  try {
    const result = evaluateCurrentSolution();
    output.textContent = result.lines.join('\n');
    updateScore(result.score);
    scoreHistory.push({ questionId: activeQuestion.id, score: result.score });
    updateSessionAnalytics();
    logIntegrity(`Ran automatic checks (${result.passed}/${result.total})`);
  } catch (error) {
    output.textContent = `❌ Runtime error\n${error.message}`;
    updateScore(0);
    logIntegrity(`Test run failed: ${error.message}`);
  }
});

function logIntegrity(message) {
  const li = document.createElement('li');
  li.textContent = `${new Date().toLocaleTimeString()} — ${message}`;
  integrityLog.prepend(li);
}

editor.addEventListener('paste', () => {
  logIntegrity('Paste detected in the editor');
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
  files[currentFile] = editor.value;
  saved = true;
  renderSaveState();

  editor.disabled = true;
  runBtn.disabled = true;
  saveBtn.disabled = true;
  finishBtn.disabled = true;
  renderFileList();

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

currentFileLabel.textContent = currentFile;
renderFileList();
renderSaveState();
renderTutorial();
updateScore(0);
updateSessionAnalytics();
logIntegrity('Session started');
initializeQuestionBank();
