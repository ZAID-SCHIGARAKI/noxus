export type StudioTheme = "system" | "light" | "dark";

export type MiniAppCode = {
  html: string;
  css: string;
  javascript: string;
};

export type MiniApp = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  accent: string;
  favorite: boolean;
  trusted: boolean;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number | null;
  code: MiniAppCode;
};

export type AppDataRecord = {
  appId: string;
  values: Record<string, unknown>;
  updatedAt: number;
};

export type StudioSettings = {
  theme: StudioTheme;
  compactCards: boolean;
  showTips: boolean;
};

export type StudioBackup = {
  format: "zaid-mini-studio";
  schemaVersion: 1;
  exportedAt: string;
  apps: MiniApp[];
  appData: AppDataRecord[];
  settings: StudioSettings;
};

export type MiniAppTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  accent: string;
  code: MiniAppCode;
};

export const DEFAULT_SETTINGS: StudioSettings = {
  theme: "system",
  compactCards: false,
  showTips: true,
};

const blankCode: MiniAppCode = {
  html: String.raw`<main class="app">
  <span class="eyebrow">MEINE MINI-APP</span>
  <h1>Hallo, Zaid.</h1>
  <p>Baue hier dein eigenes Werkzeug.</p>
  <button id="counterButton" type="button">Klicks: <strong id="count">0</strong></button>
</main>`,
  css: String.raw`* { box-sizing: border-box; }
:root { color-scheme: light dark; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; color: #172033; background: linear-gradient(145deg, #eef4ff, #f8f7ff); }
.app { width: min(92vw, 520px); padding: 34px; border: 1px solid rgba(255,255,255,.78); border-radius: 28px; background: rgba(255,255,255,.78); box-shadow: 0 24px 60px rgba(45,71,124,.16); backdrop-filter: blur(24px); }
.eyebrow { color: #5967d8; font-size: 12px; font-weight: 800; letter-spacing: .14em; }
h1 { margin: 10px 0 6px; font-size: clamp(34px, 8vw, 54px); letter-spacing: -.05em; }
p { margin: 0 0 28px; color: #687086; font-size: 17px; }
button { border: 0; border-radius: 16px; padding: 14px 18px; color: white; background: #5368e8; font: inherit; font-weight: 700; box-shadow: 0 10px 22px rgba(83,104,232,.3); cursor: pointer; }
button:active { transform: scale(.97); }
@media (prefers-color-scheme: dark) { body { color: #f7f8ff; background: #090b12; } .app { border-color: rgba(255,255,255,.08); background: rgba(23,26,39,.88); } p { color: #a7adc1; } }`,
  javascript: String.raw`let count = 0;
const output = document.querySelector("#count");
const button = document.querySelector("#counterButton");

async function start() {
  count = await MiniOS.storage.get("count", 0);
  output.textContent = String(count);
}

button.addEventListener("click", async () => {
  count += 1;
  output.textContent = String(count);
  await MiniOS.storage.set("count", count);
});

start();`,
};

const flashcardCode: MiniAppCode = {
  html: String.raw`<main class="shell">
  <header>
    <div>
      <span class="eyebrow">ACTIVE RECALL</span>
      <h1>English Sprint</h1>
    </div>
    <button class="icon-button" id="shuffle" aria-label="Karten mischen">↻</button>
  </header>

  <section class="progress-row" aria-label="Fortschritt">
    <div class="progress"><span id="progressFill"></span></div>
    <strong id="progressText">1 / 8</strong>
  </section>

  <button class="card" id="card" type="button" aria-live="polite">
    <span class="card-label" id="cardLabel">DEUTSCH</span>
    <strong id="cardText">zuverlässig</strong>
    <small>Tippen zum Umdrehen</small>
  </button>

  <div class="actions">
    <button class="again" id="again" type="button">Nochmal</button>
    <button class="know" id="know" type="button">Gewusst</button>
  </div>

  <footer>
    <span><b id="knownCount">0</b> gewusst</span>
    <span><b id="streakCount">0</b> Serie</span>
  </footer>
</main>`,
  css: String.raw`* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
:root { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif; color: #172037; background: #eef3fb; }
body { margin: 0; min-height: 100vh; background: radial-gradient(circle at 100% 0%, #dfe5ff 0, transparent 42%), linear-gradient(160deg, #f9fbff, #eaf0f9); }
button { font: inherit; }
.shell { width: min(100%, 620px); min-height: 100vh; margin: auto; padding: max(28px, env(safe-area-inset-top)) 22px max(24px, env(safe-area-inset-bottom)); display: flex; flex-direction: column; }
header { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.eyebrow { color: #6373d9; font-size: 11px; font-weight: 850; letter-spacing: .16em; }
h1 { margin: 5px 0 0; font-size: clamp(30px, 8vw, 44px); letter-spacing: -.045em; }
.icon-button { width: 46px; height: 46px; border: 1px solid rgba(255,255,255,.8); border-radius: 50%; background: rgba(255,255,255,.72); color: #4c5ac4; font-size: 24px; box-shadow: 0 12px 30px rgba(35,54,99,.12); }
.progress-row { margin: 30px 0 18px; display: flex; align-items: center; gap: 14px; color: #70778b; font-size: 13px; }
.progress { height: 7px; flex: 1; overflow: hidden; border-radius: 99px; background: rgba(99,115,217,.14); }
.progress span { display: block; width: 12.5%; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #5368e8, #8f67e8); transition: width .3s ease; }
.card { position: relative; width: 100%; min-height: 360px; flex: 1; border: 1px solid rgba(255,255,255,.95); border-radius: 34px; padding: 44px 26px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #18203a; background: rgba(255,255,255,.82); box-shadow: 0 30px 70px rgba(40,59,105,.16); backdrop-filter: blur(25px); transition: transform .2s ease; }
.card:active { transform: scale(.985); }
.card-label { position: absolute; top: 26px; color: #79819a; font-size: 11px; font-weight: 800; letter-spacing: .15em; }
.card strong { font-size: clamp(32px, 10vw, 58px); letter-spacing: -.035em; }
.card small { position: absolute; bottom: 26px; color: #9ba1b2; }
.actions { display: grid; grid-template-columns: 1fr 1.3fr; gap: 12px; margin-top: 18px; }
.actions button { border: 0; border-radius: 18px; padding: 17px 14px; font-weight: 800; }
.again { color: #535b70; background: rgba(255,255,255,.78); }
.know { color: white; background: linear-gradient(135deg, #5268e8, #765be5); box-shadow: 0 14px 28px rgba(83,94,222,.28); }
footer { display: flex; justify-content: center; gap: 24px; padding-top: 22px; color: #7e8495; font-size: 13px; }
footer b { color: #4c5673; }
@media (prefers-color-scheme: dark) { :root { color: #f7f8ff; background: #0b0d15; } body { background: radial-gradient(circle at 100% 0%, #1f2551 0, transparent 42%), #0b0d15; } .card, .icon-button, .again { border-color: rgba(255,255,255,.08); background: rgba(27,30,45,.9); color: #f5f6ff; } footer b { color: #e4e7f7; } }`,
  javascript: String.raw`const cards = [
  ["zuverlässig", "reliable"],
  ["eine Entscheidung treffen", "make a decision"],
  ["Herausforderung", "challenge"],
  ["sich verbessern", "improve"],
  ["selbstbewusst", "confident"],
  ["eine Fähigkeit", "a skill"],
  ["Fortschritt", "progress"],
  ["etwas erreichen", "achieve something"]
];

let order = cards.map((_, index) => index);
let position = 0;
let flipped = false;
let known = 0;
let streak = 0;

const card = document.querySelector("#card");
const text = document.querySelector("#cardText");
const label = document.querySelector("#cardLabel");
const progressFill = document.querySelector("#progressFill");
const progressText = document.querySelector("#progressText");
const knownCount = document.querySelector("#knownCount");
const streakCount = document.querySelector("#streakCount");

function render() {
  const current = cards[order[position]];
  text.textContent = flipped ? current[1] : current[0];
  label.textContent = flipped ? "ENGLISCH" : "DEUTSCH";
  progressText.textContent = (position + 1) + " / " + cards.length;
  progressFill.style.width = (((position + 1) / cards.length) * 100) + "%";
  knownCount.textContent = String(known);
  streakCount.textContent = String(streak);
}

async function save() {
  await MiniOS.storage.set("session", { known, streak });
}

function next() {
  position = (position + 1) % cards.length;
  flipped = false;
  render();
}

card.addEventListener("click", () => { flipped = !flipped; render(); });
document.querySelector("#again").addEventListener("click", async () => { streak = 0; next(); await save(); });
document.querySelector("#know").addEventListener("click", async () => { known += 1; streak += 1; next(); await save(); });
document.querySelector("#shuffle").addEventListener("click", () => {
  order.sort(() => Math.random() - 0.5);
  position = 0;
  flipped = false;
  render();
});

async function start() {
  const session = await MiniOS.storage.get("session", { known: 0, streak: 0 });
  known = Number(session.known || 0);
  streak = Number(session.streak || 0);
  render();
}

start();`,
};

const quizCode: MiniAppCode = {
  html: String.raw`<main class="quiz">
  <header>
    <div><span class="eyebrow">QUICK QUIZ</span><h1>15 Fragen</h1></div>
    <div class="score"><span>BESTE</span><strong id="best">0%</strong></div>
  </header>
  <div class="meter"><span id="meter"></span></div>
  <section class="question-card">
    <span class="counter" id="counter">FRAGE 1 VON 5</span>
    <h2 id="question">Wie heißt „Fortschritt“ auf Englisch?</h2>
    <div class="answers" id="answers"></div>
  </section>
  <div class="result" id="result" hidden>
    <span>ERGEBNIS</span>
    <strong id="resultScore">0 / 5</strong>
    <p id="resultText"></p>
    <button id="restart" type="button">Nochmal starten</button>
  </div>
</main>`,
  css: String.raw`* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
:root { font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; color: #17203a; }
body { margin: 0; min-height: 100vh; background: radial-gradient(circle at 0 0, #d7edff, transparent 38%), #f3f6fb; }
button { font: inherit; }
.quiz { width: min(100%, 680px); min-height: 100vh; margin: auto; padding: max(28px, env(safe-area-inset-top)) 22px max(28px, env(safe-area-inset-bottom)); }
header { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.eyebrow, .result > span { color: #1b8ca8; font-size: 11px; font-weight: 850; letter-spacing: .15em; }
h1 { margin: 5px 0 0; font-size: 38px; letter-spacing: -.045em; }
.score { min-width: 70px; border: 1px solid rgba(255,255,255,.85); border-radius: 20px; padding: 10px 14px; display: grid; text-align: center; background: rgba(255,255,255,.7); box-shadow: 0 12px 30px rgba(42,78,96,.1); }
.score span { color: #8b95a7; font-size: 9px; font-weight: 800; letter-spacing: .12em; }
.score strong { margin-top: 2px; color: #197d96; font-size: 18px; }
.meter { height: 7px; margin: 28px 0 18px; overflow: hidden; border-radius: 99px; background: rgba(19,136,165,.13); }
.meter span { display: block; width: 20%; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #1593b1, #49b9ab); transition: width .25s ease; }
.question-card, .result { border: 1px solid rgba(255,255,255,.92); border-radius: 30px; padding: 30px; background: rgba(255,255,255,.82); box-shadow: 0 26px 65px rgba(34,65,86,.13); backdrop-filter: blur(24px); }
.counter { color: #8b95a7; font-size: 11px; font-weight: 800; letter-spacing: .12em; }
h2 { min-height: 84px; margin: 18px 0 28px; font-size: clamp(25px, 7vw, 36px); line-height: 1.15; letter-spacing: -.025em; }
.answers { display: grid; gap: 11px; }
.answer { width: 100%; border: 1px solid #dde5eb; border-radius: 17px; padding: 16px 18px; text-align: left; color: #303a50; background: #f8fafc; font-weight: 700; transition: .18s ease; }
.answer:active { transform: scale(.985); }
.answer.correct { border-color: #76cba9; color: #15714f; background: #e9f8f0; }
.answer.wrong { border-color: #efa3a3; color: #a83e45; background: #fff0f0; }
.result { margin-top: 18px; text-align: center; }
.result strong { display: block; margin: 12px 0 2px; font-size: 50px; }
.result p { color: #758093; }
.result button { border: 0; border-radius: 16px; padding: 14px 19px; color: white; background: #168fa9; font-weight: 800; }
@media (prefers-color-scheme: dark) { :root { color: #f5f8ff; } body { background: radial-gradient(circle at 0 0, #123847, transparent 38%), #0b1016; } .question-card, .result, .score { border-color: rgba(255,255,255,.08); background: rgba(24,31,40,.9); } .answer { border-color: #353e4c; color: #e8edf5; background: #202833; } }`,
  javascript: String.raw`const questions = [
  { q: "Wie heißt „Fortschritt“ auf Englisch?", a: ["progress", "promise", "practice", "project"], c: 0 },
  { q: "Was bedeutet „reliable“?", a: ["ruhig", "zuverlässig", "bereit", "vernünftig"], c: 1 },
  { q: "Wie heißt „eine Entscheidung treffen“?", a: ["take a chance", "make a decision", "do a choice", "set a result"], c: 1 },
  { q: "Was bedeutet „achieve“?", a: ["erreichen", "erklären", "vermeiden", "bewerten"], c: 0 },
  { q: "Wie heißt „Fähigkeit“?", a: ["success", "skill", "strength", "solution"], c: 1 }
];

let index = 0;
let score = 0;
let locked = false;

const question = document.querySelector("#question");
const answers = document.querySelector("#answers");
const counter = document.querySelector("#counter");
const meter = document.querySelector("#meter");
const best = document.querySelector("#best");
const result = document.querySelector("#result");

function render() {
  locked = false;
  const item = questions[index];
  counter.textContent = "FRAGE " + (index + 1) + " VON " + questions.length;
  question.textContent = item.q;
  meter.style.width = (((index + 1) / questions.length) * 100) + "%";
  answers.replaceChildren();
  item.a.forEach((label, answerIndex) => {
    const button = document.createElement("button");
    button.className = "answer";
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => choose(button, answerIndex));
    answers.append(button);
  });
}

function choose(button, answerIndex) {
  if (locked) return;
  locked = true;
  const correct = questions[index].c;
  button.classList.add(answerIndex === correct ? "correct" : "wrong");
  answers.children[correct].classList.add("correct");
  if (answerIndex === correct) score += 1;
  setTimeout(() => {
    index += 1;
    if (index < questions.length) render();
    else finish();
  }, 650);
}

async function finish() {
  document.querySelector(".question-card").hidden = true;
  result.hidden = false;
  document.querySelector("#resultScore").textContent = score + " / " + questions.length;
  document.querySelector("#resultText").textContent = score === questions.length ? "Perfekt – alles richtig." : "Guter Lauf. Wiederholen festigt das Wissen.";
  const percentage = Math.round((score / questions.length) * 100);
  const oldBest = await MiniOS.storage.get("best", 0);
  const newBest = Math.max(oldBest, percentage);
  best.textContent = newBest + "%";
  await MiniOS.storage.set("best", newBest);
}

document.querySelector("#restart").addEventListener("click", () => {
  index = 0; score = 0; result.hidden = true;
  document.querySelector(".question-card").hidden = false;
  render();
});

async function start() {
  best.textContent = (await MiniOS.storage.get("best", 0)) + "%";
  render();
}

start();`,
};

const checklistCode: MiniAppCode = {
  html: String.raw`<main class="planner">
  <header>
    <div><span class="eyebrow">HEUTE</span><h1>Focus List</h1></div>
    <div class="ring"><strong id="percent">0</strong><span>%</span></div>
  </header>
  <form id="taskForm">
    <input id="taskInput" maxlength="80" placeholder="Neue Aufgabe …" autocomplete="off">
    <button type="submit" aria-label="Aufgabe hinzufügen">+</button>
  </form>
  <section id="tasks" aria-live="polite"></section>
  <div class="empty" id="empty"><span>✓</span><strong>Alles erledigt</strong><small>Füge oben eine neue Aufgabe hinzu.</small></div>
  <footer><button id="clear" type="button">Erledigte entfernen</button><span id="remaining">0 offen</span></footer>
</main>`,
  css: String.raw`* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
:root { font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; color: #202033; }
body { margin: 0; min-height: 100vh; background: radial-gradient(circle at 90% 0, #f5dcff, transparent 40%), #f5f3f9; }
button, input { font: inherit; }
.planner { width: min(100%, 650px); min-height: 100vh; margin: auto; padding: max(28px, env(safe-area-inset-top)) 22px max(26px, env(safe-area-inset-bottom)); }
header { display: flex; align-items: center; justify-content: space-between; }
.eyebrow { color: #9a5ab4; font-size: 11px; font-weight: 850; letter-spacing: .16em; }
h1 { margin: 4px 0 0; font-size: 40px; letter-spacing: -.05em; }
.ring { width: 62px; height: 62px; border: 6px solid rgba(159,91,183,.16); border-top-color: #a061b7; border-radius: 50%; display: grid; place-content: center; text-align: center; line-height: .8; background: rgba(255,255,255,.35); }
.ring strong { font-size: 17px; }.ring span { color: #8e8493; font-size: 9px; }
form { margin: 28px 0 18px; display: flex; gap: 10px; }
input { min-width: 0; flex: 1; border: 1px solid rgba(255,255,255,.92); border-radius: 18px; padding: 16px 17px; outline: none; color: inherit; background: rgba(255,255,255,.77); box-shadow: 0 12px 30px rgba(66,46,76,.08); }
form button { width: 54px; border: 0; border-radius: 18px; color: white; background: #9f5bb7; font-size: 28px; box-shadow: 0 12px 26px rgba(159,91,183,.28); }
#tasks { display: grid; gap: 10px; }
.task { border: 1px solid rgba(255,255,255,.94); border-radius: 20px; padding: 15px; display: flex; align-items: center; gap: 13px; background: rgba(255,255,255,.76); box-shadow: 0 10px 28px rgba(66,46,76,.07); }
.task label { min-width: 0; flex: 1; font-weight: 680; }
.task.done label { color: #9a93a0; text-decoration: line-through; }
.check { width: 25px; height: 25px; border: 2px solid #ccb9d2; border-radius: 9px; display: grid; place-content: center; color: white; background: transparent; }
.done .check { border-color: #a061b7; background: #a061b7; }
.delete { border: 0; padding: 5px 7px; color: #aaa1ad; background: transparent; font-size: 18px; }
.empty { padding: 62px 20px; display: grid; justify-items: center; color: #958b9b; text-align: center; }
.empty > span { width: 54px; height: 54px; margin-bottom: 14px; border-radius: 50%; display: grid; place-content: center; color: #9f5bb7; background: rgba(159,91,183,.12); font-size: 24px; }
.empty small { margin-top: 6px; }
footer { margin-top: 22px; display: flex; align-items: center; justify-content: space-between; color: #8b8290; font-size: 13px; }
footer button { border: 0; padding: 0; color: #9a5ab4; background: transparent; font-weight: 700; }
@media (prefers-color-scheme: dark) { :root { color: #f7f3fa; } body { background: radial-gradient(circle at 90% 0, #402047, transparent 40%), #100d13; } input, .task { border-color: rgba(255,255,255,.08); background: rgba(35,29,39,.9); } }`,
  javascript: String.raw`let tasks = [];
const list = document.querySelector("#tasks");
const empty = document.querySelector("#empty");
const input = document.querySelector("#taskInput");

async function persist() {
  await MiniOS.storage.set("tasks", tasks);
}

function render() {
  list.replaceChildren();
  tasks.forEach((task) => {
    const row = document.createElement("article");
    row.className = "task" + (task.done ? " done" : "");
    row.innerHTML = '<button class="check" type="button" aria-label="Status ändern">' + (task.done ? "✓" : "") + '</button><label></label><button class="delete" type="button" aria-label="Löschen">×</button>';
    row.querySelector("label").textContent = task.text;
    row.querySelector(".check").addEventListener("click", async () => { task.done = !task.done; render(); await persist(); });
    row.querySelector(".delete").addEventListener("click", async () => { tasks = tasks.filter((item) => item.id !== task.id); render(); await persist(); });
    list.append(row);
  });
  const done = tasks.filter((task) => task.done).length;
  const percentage = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  document.querySelector("#percent").textContent = String(percentage);
  document.querySelector("#remaining").textContent = (tasks.length - done) + " offen";
  empty.hidden = tasks.length > 0;
}

document.querySelector("#taskForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  tasks.unshift({ id: Date.now().toString(36), text, done: false });
  input.value = "";
  render();
  await persist();
});

document.querySelector("#clear").addEventListener("click", async () => {
  tasks = tasks.filter((task) => !task.done);
  render();
  await persist();
});

async function start() {
  tasks = await MiniOS.storage.get("tasks", [
    { id: "one", text: "Englisch-Vokabeln wiederholen", done: false },
    { id: "two", text: "Mathe-Aufgaben prüfen", done: true },
    { id: "three", text: "Schultasche packen", done: false }
  ]);
  render();
}

start();`,
};

export const APP_TEMPLATES: MiniAppTemplate[] = [
  {
    id: "blank",
    name: "Leere App",
    description: "Ein schneller Startpunkt für deinen eigenen HTML-, CSS- und JavaScript-Code.",
    category: "Eigene App",
    icon: "code",
    accent: "#5368e8",
    code: blankCode,
  },
  {
    id: "flashcards",
    name: "Karteikarten",
    description: "Active Recall mit Umdrehen, Mischen, Serie und gespeichertem Fortschritt.",
    category: "Lernen",
    icon: "cards",
    accent: "#6170dc",
    code: flashcardCode,
  },
  {
    id: "quiz",
    name: "Quiz",
    description: "Multiple Choice mit direktem Feedback und dauerhaftem Bestwert.",
    category: "Lernen",
    icon: "quiz",
    accent: "#178da8",
    code: quizCode,
  },
  {
    id: "checklist",
    name: "Checkliste",
    description: "Aufgaben hinzufügen, abhaken und den Tagesfortschritt sehen.",
    category: "Alltag",
    icon: "check",
    accent: "#9b5ab4",
    code: checklistCode,
  },
];

function copyCode(code: MiniAppCode): MiniAppCode {
  return { html: code.html, css: code.css, javascript: code.javascript };
}

export function createId(prefix = "app"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createAppFromTemplate(templateId: string, name?: string): MiniApp {
  const template = APP_TEMPLATES.find((item) => item.id === templateId) ?? APP_TEMPLATES[0];
  const now = Date.now();
  return {
    id: createId(),
    name: name?.trim() || template.name,
    description: template.description,
    category: template.category,
    icon: template.icon,
    accent: template.accent,
    favorite: false,
    trusted: true,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: null,
    code: copyCode(template.code),
  };
}

export function createStarterApps(): MiniApp[] {
  const now = Date.now();
  return [
    {
      ...createAppFromTemplate("flashcards", "English Sprint"),
      id: "starter-english-sprint",
      description: "Active Recall für deine Englisch-Vokabeln.",
      favorite: true,
      createdAt: now - 3000,
      updatedAt: now - 3000,
    },
    {
      ...createAppFromTemplate("quiz", "Quick Quiz"),
      id: "starter-quick-quiz",
      description: "Kurze Tests mit gespeichertem Bestwert.",
      createdAt: now - 2000,
      updatedAt: now - 2000,
    },
    {
      ...createAppFromTemplate("checklist", "Focus List"),
      id: "starter-focus-list",
      description: "Schule und Alltag auf einen Blick.",
      createdAt: now - 1000,
      updatedAt: now - 1000,
    },
  ];
}

export function cloneMiniApp(app: MiniApp): MiniApp {
  const now = Date.now();
  return {
    ...app,
    id: createId(),
    name: `${app.name} Kopie`,
    favorite: false,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: null,
    code: copyCode(app.code),
  };
}

function escapeClosingTag(value: string, tag: "script" | "style"): string {
  return value.replace(new RegExp(`</${tag}`, "gi"), `<\\/${tag}`);
}

function serializeForScript(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
}

export function buildSandboxDocument(
  app: MiniApp,
  channel: string,
  initialValues: Record<string, unknown> = {},
): string {
  const bridge = String.raw`(() => {
  const CHANNEL = ${serializeForScript(channel)};
  const APP = ${serializeForScript({ id: app.id, name: app.name })};
  const memory = ${serializeForScript(initialValues)};
  const pending = new Map();
  let requestNumber = 0;

  function send(action, payload = {}) {
    const requestId = "request-" + (++requestNumber);
    return new Promise((resolve, reject) => {
      pending.set(requestId, { resolve, reject });
      parent.postMessage({ __miniStudio: true, channel: CHANNEL, requestId, action, ...payload }, "*");
      setTimeout(() => {
        if (!pending.has(requestId)) return;
        pending.delete(requestId);
        reject(new Error("Speicheranfrage hat zu lange gedauert."));
      }, 5000);
    });
  }

  window.addEventListener("message", (event) => {
    const message = event.data;
    if (!message || message.__miniStudio !== true || message.channel !== CHANNEL || message.action !== "response") return;
    const item = pending.get(message.requestId);
    if (!item) return;
    pending.delete(message.requestId);
    if (message.ok) item.resolve(message.value);
    else item.reject(new Error(message.error || "Unbekannter Speicherfehler"));
  });

  window.MiniOS = Object.freeze({
    app: Object.freeze(APP),
    storage: Object.freeze({
      async get(key, fallback = null) {
        return Object.prototype.hasOwnProperty.call(memory, key) ? structuredClone(memory[key]) : fallback;
      },
      async set(key, value) {
        memory[key] = structuredClone(value);
        await send("storage:set", { key, value });
        return value;
      },
      async remove(key) {
        delete memory[key];
        await send("storage:remove", { key });
      },
      async clear() {
        Object.keys(memory).forEach((key) => delete memory[key]);
        await send("storage:clear");
      }
    }),
    notify(message) {
      parent.postMessage({ __miniStudio: true, channel: CHANNEL, action: "notify", message: String(message) }, "*");
    },
    close() {
      parent.postMessage({ __miniStudio: true, channel: CHANNEL, action: "close" }, "*");
    }
  });

  window.addEventListener("error", (event) => {
    parent.postMessage({ __miniStudio: true, channel: CHANNEL, action: "runtime:error", message: event.message || "Unbekannter Laufzeitfehler" }, "*");
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
    parent.postMessage({ __miniStudio: true, channel: CHANNEL, action: "runtime:error", message: reason }, "*");
  });
})();`;

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none';">
  <title>${app.name.replace(/[<>&"]/g, "")}</title>
  <style>${escapeClosingTag(app.code.css, "style")}</style>
  <script>${escapeClosingTag(bridge, "script")}</script>
</head>
<body>
${app.code.html}
<script>${escapeClosingTag(app.code.javascript, "script")}</script>
</body>
</html>`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMiniApp(value: unknown): value is MiniApp {
  if (!isRecord(value) || !isRecord(value.code)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    typeof value.category === "string" &&
    typeof value.icon === "string" &&
    typeof value.accent === "string" &&
    typeof value.code.html === "string" &&
    typeof value.code.css === "string" &&
    typeof value.code.javascript === "string"
  );
}

export function parseStudioBackup(text: string): StudioBackup {
  const parsed: unknown = JSON.parse(text);
  if (!isRecord(parsed) || parsed.format !== "zaid-mini-studio" || parsed.schemaVersion !== 1) {
    throw new Error("Das ist keine gültige Zaid-Mini-Studio-Datei.");
  }
  if (!Array.isArray(parsed.apps) || !parsed.apps.every(isMiniApp)) {
    throw new Error("Die App-Liste in der Sicherung ist beschädigt.");
  }

  const now = Date.now();
  const apps = parsed.apps.map((app) => ({
    ...app,
    favorite: Boolean(app.favorite),
    trusted: false,
    createdAt: Number(app.createdAt) || now,
    updatedAt: Number(app.updatedAt) || now,
    lastOpenedAt: typeof app.lastOpenedAt === "number" ? app.lastOpenedAt : null,
    code: copyCode(app.code),
  }));

  const appData: AppDataRecord[] = Array.isArray(parsed.appData)
    ? parsed.appData
        .filter((item): item is Record<string, unknown> => isRecord(item) && typeof item.appId === "string" && isRecord(item.values))
        .map((item) => ({
          appId: item.appId as string,
          values: item.values as Record<string, unknown>,
          updatedAt: Number(item.updatedAt) || now,
        }))
    : [];

  const rawSettings = isRecord(parsed.settings) ? parsed.settings : {};
  const theme = rawSettings.theme;
  const settings: StudioSettings = {
    theme: theme === "light" || theme === "dark" || theme === "system" ? theme : "system",
    compactCards: Boolean(rawSettings.compactCards),
    showTips: rawSettings.showTips !== false,
  };

  return {
    format: "zaid-mini-studio",
    schemaVersion: 1,
    exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : new Date().toISOString(),
    apps,
    appData,
    settings,
  };
}

