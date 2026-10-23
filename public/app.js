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

function unitsLabel(n) {
  return n ? n + (n === 1 ? " Unit" : " Units") : "Noch leer";
}

// Faerbt die ganze Seite in der Farbe des Fachs (siehe style.css).
function paint(subject) {
  if (subject) document.body.dataset.subject = subject.id;
  else delete document.body.dataset.subject;
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function showHome() {
  current = { subject: null, unit: null, sets: [] };
  const box = $("subject-list");
  box.classList.remove("opening");
  box.innerHTML = "";
  SUBJECTS.forEach((subject) => {
    const b = document.createElement("button");
    b.className = "band" + (subject.units.length ? "" : " is-empty");
    b.dataset.subject = subject.id;
    b.innerHTML =
      '<span class="band-name"></span>' +
      '<span class="band-meta"><span class="band-count"></span><span class="band-full"></span></span>';
    b.querySelector(".band-name").textContent = subject.short || subject.name;
    b.querySelector(".band-count").textContent = unitsLabel(subject.units.length);
    if (subject.short) b.querySelector(".band-full").textContent = subject.name;
    b.setAttribute("aria-label", subject.name + ", " + unitsLabel(subject.units.length));
    b.addEventListener("click", () => openSubject(b, subject));
    box.appendChild(b);
  });
  paint(null);
  showScreen("home");
}

// Das angetippte Band waechst ueber den Bildschirm, dann kommt das Fach.
function openSubject(band, subject) {
  const box = $("subject-list");
  if (box.classList.contains("opening")) return;
  if (reducedMotion()) return showUnits(subject);
  band.classList.add("is-open");
  box.classList.add("opening");
  setTimeout(() => showUnits(subject), 480);
}

function showUnits(subject) {
  current = { subject: subject, unit: null, sets: [] };
  $("unit-title").textContent = subject.name;
  const box = $("unit-list");
  box.innerHTML = "";
  subject.units.forEach((unit) => {
    const b = document.createElement("button");
    b.className = "row";
    b.innerHTML = '<span class="row-name"></span><span class="row-count"></span>';
    b.querySelector(".row-name").textContent = unit.name;
    b.querySelector(".row-count").textContent = countLabel(unit.entries.length);
    b.addEventListener("click", () => showSetup(unit));
    box.appendChild(b);
  });
  box.classList.toggle("hidden", !subject.units.length);
  $("unit-empty").textContent =
    "Für " + subject.name + " ist noch nichts drin. Sobald der Stoff für den nächsten Test da ist, findest du ihn hier.";
  $("unit-empty").classList.toggle("hidden", subject.units.length > 0);
  paint(subject);
  showScreen("unit");
}

function showSetup(unit) {
  const subject = current.subject;
  current = { subject: subject, unit: unit, sets: unitSets(unit) };
  $("start-back").textContent = subject.name;
  $("start-title").textContent = unit.name;
  $("start-hint").textContent = "";
  buildDirections(subject);
  const settings = loadSettings();
  buildSetList(settings);
  applySettings(settings);
  paint(subject);
  showScreen("start");
}

function chip(type, name, value, text, note) {
  const label = document.createElement("label");
  label.className = "chip";
  label.innerHTML = '<input type="' + type + '"><span></span>';
  const input = label.querySelector("input");
  input.name = name;
  input.value = value;
  const span = label.querySelector("span");
  span.textContent = text;
  if (note) {
    const small = document.createElement("small");
    small.textContent = note;
    span.appendChild(small);
  }
  return label;
}

function buildDirections(subject) {
  const [a, b] = subject.sides;
  const box = $("direction-options");
  box.innerHTML = "";
  [
    ["forward", a.name + " → " + b.name],
    ["back", b.name + " → " + a.name],
    ["mixed", "Gemischt"],
  ].forEach(([value, text]) => box.appendChild(chip("radio", "direction", value, text)));
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
    const label = chip("checkbox", "set", name, name, String(count));
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
  window.scrollTo(0, 0);
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
  $("progress-text").textContent = done + " von " + total;
  $("progress-fill").style.width = (total ? (done / total) * 100 : 0) + "%";
  $("streak").textContent = session.streak >= 3 ? session.streak + " richtig in Folge" : "";
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
    $("feedback-title").textContent = "Richtig. Achte auf Gross- und Kleinschreibung.";
  } else {
    fb.classList.add("is-bad");
    $("feedback-title").textContent = "Falsch. Kommt später nochmal.";
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
  const firstTry = Array.from(s.done).filter((e) => !s.tries.has(e)).length;
  const n = (x) => "<b>" + x + "</b>";
  $("summary").innerHTML = s.done.size
    ? "Du hast " + n(s.done.size) + " von " + n(s.pool.length) + " geschafft. " +
      n(firstTry) + (firstTry === 1 ? " sass" : " sassen") + " auf Anhieb, " + n(hard.length) + " musstest du wiederholen. " +
      "Längste Serie: " + n(s.bestStreak) + " richtig in Folge."
    : "Diesmal hat noch nichts gesessen. Starte die Runde gleich nochmal, beim zweiten Mal geht es leichter.";
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
