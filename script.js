const app = document.getElementById('app');
app.hidden = false;

const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    panels.forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

const tutorialSteps = [
  'Étape 1/3 — Prends connaissance de la consigne et personnalise ton environnement.',
  'Étape 2/3 — Teste l’éditeur: écris, sauvegarde, et exécute un exemple.',
  'Étape 3/3 — Lance le test quand tu te sens prêt(e).',
];
let tutorialIndex = 0;
const tutorialText = document.getElementById('tutorialText');
const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progressBar');

function renderTutorial() {
  tutorialText.textContent = tutorialSteps[tutorialIndex];
  progressText.textContent = `${tutorialIndex + 1} / ${tutorialSteps.length} étapes`;
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
  'index.js': `function sumPositive(numbers) {\n  return numbers.filter((n) => n > 0).reduce((a, b) => a + b, 0);\n}\n\nmodule.exports = { sumPositive };\n`,
  'README.md': `# Challenge\n\nCréez la fonction sumPositive(numbers).\n`,
  'test.js': `const { sumPositive } = require('./index');\nconsole.log('Résultat attendu 6 =>', sumPositive([-2, 1, 2, 3]));\n`,
};

let currentFile = 'index.js';
let saved = true;
const fileList = document.getElementById('fileList');
const editor = document.getElementById('editor');
const currentFileLabel = document.getElementById('currentFile');
const savedState = document.getElementById('savedState');
const output = document.getElementById('output');

function renderFileList() {
  fileList.innerHTML = '';
  Object.keys(files).forEach((fileName) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `file-btn ${fileName === currentFile ? 'active' : ''}`;
    btn.textContent = fileName;
    btn.addEventListener('click', () => {
      files[currentFile] = editor.value;
      currentFile = fileName;
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
  savedState.textContent = saved ? 'Sauvegardé' : 'Non sauvegardé';
}

editor.addEventListener('input', () => {
  saved = false;
  renderSaveState();
});

document.getElementById('saveBtn').addEventListener('click', () => {
  files[currentFile] = editor.value;
  saved = true;
  renderSaveState();
});

document.getElementById('runBtn').addEventListener('click', () => {
  files[currentFile] = editor.value;
  const hasFunction = files['index.js'].includes('sumPositive');
  output.textContent = hasFunction
    ? '✅ Exécution simulée OK\nRésultat exemple: 6'
    : '❌ Fonction sumPositive introuvable';
});

const integrityLog = document.getElementById('integrityLog');

function logIntegrity(message) {
  const li = document.createElement('li');
  li.textContent = `${new Date().toLocaleTimeString()} — ${message}`;
  integrityLog.prepend(li);
}

editor.addEventListener('paste', () => {
  logIntegrity('Collage détecté dans l’éditeur');
});

window.addEventListener('blur', () => {
  logIntegrity('Sortie de la fenêtre détectée');
});

let remainingSeconds = 12 * 60;
const timer = document.getElementById('timer');
setInterval(() => {
  remainingSeconds = Math.max(0, remainingSeconds - 1);
  const m = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const s = String(remainingSeconds % 60).padStart(2, '0');
  timer.textContent = `Temps: ${m}:${s}`;
}, 1000);

document.getElementById('finishBtn').addEventListener('click', () => {
  alert('Test soumis (simulation).');
});

editor.value = files[currentFile];
currentFileLabel.textContent = currentFile;
renderFileList();
renderSaveState();
renderTutorial();
logIntegrity('Session démarrée');
