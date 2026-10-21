"use strict";

/* ---------------- Hilfsfunktionen ---------------- */

const $ = (id) => document.getElementById(id);

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Vereinheitlicht Leerzeichen, Apostrophe und Satzzeichen am Ende.
// Akzente und Gross-/Kleinschreibung bleiben absichtlich erhalten.
function normalize(s) {
  return s
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?…]+$/, "")
    .trim();
}

function stripParens(s) {
  return s.replace(/\s*\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
}

// Alle Schreibweisen, die fuer diesen Eintrag als Antwort gelten.
function acceptedAnswers(entry, lang) {
  const out = [];
  const add = (s) => {
    if (s && !out.includes(s)) out.push(s);
  };
  add(entry[lang]);
  if (entry.accept && entry.accept[lang]) entry.accept[lang].forEach(add);
  out.slice().forEach((s) => add(stripParens(s)));
  // Synonymlisten wie "leicht, einfach": jedes einzelne Wort gilt auch.
  // Ganze Saetze (enden auf . ! ? ...) werden nicht zerlegt.
  out.slice().forEach((s) => {
    if (s.includes(", ") && !/[.!?…]$/.test(s.trim())) {
      s.split(", ").forEach((part) => add(part.trim()));
    }
  });
  return out;
}

// "good" = exakt, "near" = nur Gross-/Kleinschreibung anders, "bad" = falsch.
function grade(input, entry, lang) {
  const given = normalize(input);
  if (!given) return "bad";
  const variants = acceptedAnswers(entry, lang).map(normalize);
  if (variants.includes(given)) return "good";
  const lower = given.toLowerCase();
  if (variants.some((v) => v.toLowerCase() === lower)) return "near";
  return "bad";
}

/* ---------------- Fach und Unit ---------------- */

// Was gerade gewaehlt ist: { subject, unit, sets }.
let current = { subject: null, unit: null, sets: [] };

const setOf = (entry) => entry.set || "Alle";

function unitSets(unit) {
  const out = [];
  unit.entries.forEach((e) => {
    if (!out.includes(setOf(e))) out.push(setOf(e));
  });
  return out;
}

function countLabel(n) {
  return n + (n === 1 ? " Eintrag" : " Einträge");
}

function setHeader(subject, unit) {
  $("doc-subject").textContent = subject
    ? subject.name + (unit ? " · " + unit.name : "")
    : "Alle Fächer";
  $("doc-no").textContent = subject
    ? subject.code + (unit ? "-" + (subject.units.indexOf(unit) + 1) : "")
    : "KL";
  if (unit) {
    $("foot-no").textContent =
      countLabel(unit.entries.length) + " · " + unitSets(unit).length + " Teile";
  } else if (subject) {
    $("foot-no").textContent =
      subject.units.length + (subject.units.length === 1 ? " Unit" : " Units");
  } else {
    $("foot-no").textContent = SUBJECTS.length + " Fächer";
  }
}

function pickButton(code, name, note, empty, onClick) {
  const b = document.createElement("button");
  b.className = "pick" + (empty ? " is-empty" : "");
  b.innerHTML =
    '<span class="pick-code"></span><span class="pick-name"></span><span class="pick-note"></span>';
  b.querySelector(".pick-code").textContent = code;
  b.querySelector(".pick-name").textContent = name;
  b.querySelector(".pick-note").textContent = note;
  b.addEventListener("click", onClick);
  return b;
}

function showHome() {
  current = { subject: null, unit: null, sets: [] };
  const box = $("subject-list");
  box.innerHTML = "";
  SUBJECTS.forEach((subject) => {
    const n = subject.units.length;
    box.appendChild(
      pickButton(
        subject.code,
        subject.name,
        n ? n + (n === 1 ? " Unit" : " Units") : "Noch leer",
        !n,
        () => showUnits(subject)
      )
    );
  });
  setHeader(null, null);
  showScreen("home");
}

function showUnits(subject) {
  current = { subject: subject, unit: null, sets: [] };
  $("unit-title").textContent = subject.name;
  const box = $("unit-list");
  box.innerHTML = "";
  subject.units.forEach((unit, i) => {
    box.appendChild(
      pickButton(String(i + 1), unit.name, countLabel(unit.entries.length),
        !unit.entries.length, () => showSetup(unit))
    );
  });
  box.classList.toggle("hidden", !subject.units.length);
  $("unit-empty").classList.toggle("hidden", subject.units.length > 0);
  setHeader(subject, null);
  showScreen("unit");
}

function showSetup(unit) {
  const subject = current.subject;
  current = { subject: subject, unit: unit, sets: unitSets(unit) };
  $("start-crumb").textContent = subject.name;
  $("start-title").textContent = subject.name + " — " + unit.name;
  $("start-hint").textContent = "";
  buildDirections(subject);
  const settings = loadSettings();
  buildSetList(settings);
  applySettings(settings);
  setHeader(subject, unit);
  showScreen("start");
}

function buildDirections(subject) {
  const [a, b] = subject.sides;
  const box = $("direction-options");
  box.innerHTML = "";
  [
    ["forward", a.name + " → " + b.name],
    ["back", b.name + " → " + a.name],
    ["mixed", "Gemischt"],
  ].forEach(([value, text]) => {
    const label = document.createElement("label");
    label.className = "opt";
    label.innerHTML = '<input type="radio" name="direction" value="' + value + '"><span></span>';
    label.querySelector("span").textContent = text;
    box.appendChild(label);
  });
}

/* ---------------- Einstellungen ---------------- */

// Pro Unit gespeichert, damit jede Unit ihre eigene Auswahl behaelt.
const storeKey = () => "lb-settings:" + current.unit.id;

function loadSettings() {
  const fallback = { sets: current.sets.slice(), direction: "forward", mode: "write" };
  try {
    const saved = JSON.parse(localStorage.getItem(storeKey()));
    if (!saved) return fallback;
    const sets = (saved.sets || []).filter((s) => current.sets.includes(s));
    return {
      sets: sets.length ? sets : fallback.sets,
      direction: ["forward", "back", "mixed"].includes(saved.direction)
        ? saved.direction
        : fallback.direction,
      mode: saved.mode || fallback.mode,
    };
  } catch (e) {
    return fallback;
  }
}

function saveSettings(s) {
  try {
    localStorage.setItem(storeKey(), JSON.stringify(s));
  } catch (e) {
    /* Privatmodus o.ae. - egal */
  }
}

function buildSetList(settings) {
  const box = $("set-list");
  box.innerHTML = "";
  current.sets.forEach((name) => {
    const count = current.unit.entries.filter((w) => setOf(w) === name).length;
    const label = document.createElement("label");
    label.className = "opt";
    label.innerHTML = '<input type="checkbox"><span> <small></small></span>';
    label.querySelector("input").value = name;
    label.querySelector("span").prepend(name);
    label.querySelector("small").textContent = "(" + count + ")";
    label.querySelector("input").checked = settings.sets.includes(name);
    box.appendChild(label);
  });
}

function readSettings() {
  return {
    sets: Array.from($("set-list").querySelectorAll("input:checked")).map((i) => i.value),
    direction: document.querySelector('input[name="direction"]:checked').value,
    mode: document.querySelector('input[name="mode"]:checked').value,
  };
}

function applySettings(s) {
  document.querySelectorAll('input[name="direction"]').forEach((i) => {
    i.checked = i.value === s.direction;
  });
  document.querySelectorAll('input[name="mode"]').forEach((i) => {
    i.checked = i.value === s.mode;
  });
}

/* ---------------- Sitzung ---------------- */

let session = null;

function showScreen(name) {
  ["home", "unit", "start", "quiz", "end"].forEach((n) => {
    $("screen-" + n).classList.toggle("hidden", n !== name);
  });
}

function startSession(pool, settings) {
  session = {
    pool: pool,
    settings: settings,
    sides: current.subject.sides,
    queue: shuffle(pool),
    done: new Set(),
    tries: new Map(), // Eintrag -> Anzahl Fehlversuche
    streak: 0,
    bestStreak: 0,
    answered: false,
    lang: null, // Feld der gesuchten Antwort
    promptLang: null, // Feld, das gezeigt wird
  };
  showScreen("quiz");
  nextQuestion();
}

function currentEntry() {
  return session.queue[0];
}

function updateProgress() {
  const total = session.pool.length;
  const done = session.done.size;
  $("progress-text").textContent = done + " / " + total;
  $("progress-fill").style.width = (total ? (done / total) * 100 : 0) + "%";
  $("streak").textContent = session.streak >= 2 ? "Serie " + session.streak : "";
}

function nextQuestion() {
  if (!session.queue.length) return endSession();

  const entry = currentEntry();
  const dir = session.settings.direction;
  const forward = dir === "forward" || (dir === "mixed" && Math.random() < 0.5);
  const [ask, answer] = forward ? session.sides : session.sides.slice().reverse();
  session.lang = answer.key;
  session.promptLang = ask.key;
  session.answered = false;

  $("prompt-lang").textContent = ask.name;
  $("prompt").textContent = entry[ask.key];

  $("feedback").classList.add("hidden");
  updateProgress();

  const mode = session.settings.mode;
  $("write-form").classList.toggle("hidden", mode !== "write");
  $("choice-box").classList.toggle("hidden", mode !== "choice");
  $("reveal-box").classList.toggle("hidden", mode !== "reveal");

  if (mode === "write") {
    $("answer").value = "";
    $("answer").disabled = false;
    $("write-form").querySelector("button").disabled = false;
    $("answer").focus();
  } else if (mode === "choice") {
    buildChoices(entry);
  } else {
    $("btn-reveal").classList.remove("hidden");
    $("reveal-knew").classList.add("hidden");
  }
}

function buildChoices(entry) {
  const lang = session.lang;
  const correct = entry[lang];
  const others = shuffle(session.pool.filter((w) => w !== entry && w[lang] !== correct))
    .slice(0, 3)
    .map((w) => w[lang]);
  const box = $("choice-box");
  box.innerHTML = "";
  shuffle([correct].concat(others)).forEach((text) => {
    const b = document.createElement("button");
    b.className = "choice";
    b.textContent = text;
    b.addEventListener("click", () => {
      box.querySelectorAll("button").forEach((x) => {
        x.disabled = true;
        if (x.textContent === correct) x.classList.add("pick-good");
      });
      if (text !== correct) b.classList.add("pick-bad");
      resolve(text === correct ? "good" : "bad");
    });
    box.appendChild(b);
  });
}

// result: "good" | "near" | "bad"
function resolve(result) {
  if (session.answered) return;
  session.answered = true;

  const entry = currentEntry();
  const solution = entry[session.lang];
  const fb = $("feedback");
  fb.classList.remove("hidden", "is-good", "is-near", "is-bad");

  if (result === "good" || result === "near") {
    session.done.add(entry);
    session.queue.shift();
    session.streak++;
    session.bestStreak = Math.max(session.bestStreak, session.streak);
  } else {
    session.tries.set(entry, (session.tries.get(entry) || 0) + 1);
    session.queue.shift();
    // Kommt spaeter zufaellig nochmal dran, nicht sofort.
    const pos = Math.min(
      session.queue.length,
      3 + Math.floor(Math.random() * 8)
    );
    session.queue.splice(pos, 0, entry);
    session.streak = 0;
  }

  if (result === "good") {
    fb.classList.add("is-good");
    $("feedback-title").textContent = "Richtig";
  } else if (result === "near") {
    fb.classList.add("is-near");
    $("feedback-title").textContent = "Richtig, achte auf die Gross-/Kleinschreibung";
  } else {
    fb.classList.add("is-bad");
    $("feedback-title").textContent = "Falsch, kommt später nochmal";
  }

  $("feedback-solution").textContent = solution;
  $("feedback-example").textContent = entry.example || "";

  if (session.settings.mode === "write") {
    $("answer").disabled = true;
    $("write-form").querySelector("button").disabled = true;
  }
  $("btn-next").focus();
  updateProgress();
}

function endSession() {
  const s = session;
  const hard = Array.from(s.tries.keys());
  showScreen("end");
  $("summary").innerHTML =
    "<li><span>Gelernt</span><span>" + s.done.size + "</span></li>" +
    "<li><span>Beim ersten Mal richtig</span><span>" + (s.done.size - hard.length) + "</span></li>" +
    "<li><span>Mussten wiederholt werden</span><span>" + hard.length + "</span></li>" +
    "<li><span>Längste Serie</span><span>" + s.bestStreak + "</span></li>";
  const btn = $("btn-again-hard");
  btn.classList.toggle("hidden", hard.length === 0);
  btn.onclick = () => startSession(hard, s.settings);
}

/* ---------------- Verdrahtung ---------------- */

showHome();

document.querySelectorAll("[data-back]").forEach((b) => {
  b.addEventListener("click", () => {
    if (b.dataset.back === "home") showHome();
    else showUnits(current.subject);
  });
});

$("btn-start").addEventListener("click", () => {
  const s = readSettings();
  if (!s.sets.length) {
    $("start-hint").textContent = "Wähle mindestens einen Teil aus.";
    return;
  }
  $("start-hint").textContent = "";
  saveSettings(s);
  startSession(current.unit.entries.filter((w) => s.sets.includes(setOf(w))), s);
});

$("write-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (session.answered) return;
  const typed = $("answer").value;
  if (!typed.trim()) return;
  resolve(grade(typed, currentEntry(), session.lang));
});

$("btn-reveal").addEventListener("click", () => {
  $("prompt").textContent =
    currentEntry()[session.promptLang] +
    "  →  " +
    currentEntry()[session.lang];
  $("btn-reveal").classList.add("hidden");
  $("reveal-knew").classList.remove("hidden");
});

$("btn-knew").addEventListener("click", () => resolve("good"));
$("btn-unknown").addEventListener("click", () => resolve("bad"));

$("btn-next").addEventListener("click", nextQuestion);

$("btn-quit").addEventListener("click", endSession);
$("btn-home").addEventListener("click", () => showScreen("start"));

// Enter fuehrt ueberall weiter.
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  if ($("screen-quiz").classList.contains("hidden")) return;
  if (session && session.answered) {
    e.preventDefault();
    nextQuestion();
  }
});
