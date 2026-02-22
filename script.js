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

const files = {
  'index.js': `function sumPositive(numbers) {\n  // TODO: return the sum of positive numbers only.\n  // Example: [-2, 1, 2, 3] -> 6\n  return 0;\n}\n\nmodule.exports = { sumPositive };\n`,
  'README.md': `# Challenge\n\nImplement sumPositive(numbers) so it returns the sum of all positive numbers.\n`,
  'test.js': `const { sumPositive } = require('./index');\n\nfunction assertEqual(actual, expected, label) {\n  if (actual !== expected) {\n    throw new Error(\`\${label}: expected \${expected}, got \${actual}\`);\n  }\n}\n\nassertEqual(sumPositive([-2, 1, 2, 3]), 6, 'mixed values');\nassertEqual(sumPositive([0, -1, -9]), 0, 'no positive numbers');\nassertEqual(sumPositive([10, 20, 30]), 60, 'all positive numbers');\n\nconsole.log('✅ 3/3 tests passed');\n`,
};

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

  const lines = [];
  const printLine = (line) => lines.push(line);

  try {
    runModule('test.js', {}, printLine);
    output.textContent = lines.length > 0 ? lines.join('\n') : 'Execution finished with no output.';
    logIntegrity('Ran automatic checks');
  } catch (error) {
    output.textContent = `❌ Runtime error\n${error.message}`;
    logIntegrity(`Test run failed: ${error.message}`);
  }
});

const integrityLog = document.getElementById('integrityLog');

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

let remainingSeconds = 12 * 60;
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
    `Reason: ${reason}. Time used: ${formatDuration(spentSeconds)}. Integrity events: ${logCount}.`;
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

editor.value = files[currentFile];
currentFileLabel.textContent = currentFile;
renderFileList();
renderSaveState();
renderTutorial();
logIntegrity('Session started');
