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

// Eine Unit zaehlt erst, wenn Karten oder Dateien drin sind.
const hasContent = (unit) => (unit.entries || []).length > 0 || (unit.files || []).length > 0;

function countLabel(n) {
  return n + (n === 1 ? " Eintrag" : " Einträge");
}

function unitsLabel(subject) {
  const n = subject.units.filter(hasContent).length;
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
    b.className = "band" + (subject.units.some(hasContent) ? "" : " is-empty");
    b.dataset.subject = subject.id;
    b.innerHTML =
      '<span class="band-name"></span>' +
      '<span class="band-meta"><span class="band-count"></span><span class="band-full"></span></span>';
    b.querySelector(".band-name").textContent = subject.short || subject.name;
    b.querySelector(".band-count").textContent = unitsLabel(subject);
    if (subject.short) b.querySelector(".band-full").textContent = subject.name;
    const meter = bandMeter(subject);
    if (meter) b.querySelector(".band-meta").appendChild(meter);
    b.setAttribute("aria-label", subject.name + ", " + unitsLabel(subject));
    b.addEventListener("click", () => openSubject(b, subject));
    box.appendChild(b);
  });
  paint(null);
  renderAccountButton();
  showScreen("home");
}

// Kleine Anzeige im Band: wie viel von den Karten schon sitzt (nur angemeldet).
function bandMeter(subject) {
  let total = 0;
  let mastered = 0;
  let active = false;
  subject.units.forEach((unit) => {
    if (!(unit.entries || []).length) return;
    const st = Progress.unitStats(unit, subject);
    total += st.total;
    mastered += st.mastered;
    active = st.active;
  });
  if (!active || !total) return null;
  const el = document.createElement("span");
  el.className = "band-meter";
  el.innerHTML = '<span class="rail"><i></i></span><span class="band-meter-text"></span>';
  el.querySelector("i").style.setProperty("--p", mastered / total);
  el.querySelector(".band-meter-text").textContent = mastered + " von " + total + " sitzen";
  return el;
}

function renderAccountButton() {
  const user = Auth.current();
  $("btn-account").textContent = user ? user.name : "Anmelden";
  $("btn-account").setAttribute("aria-label", user ? "Profil von " + user.name : "Anmelden oder Konto erstellen");
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

function unitCount(unit) {
  if (unit.entries && unit.entries.length) return countLabel(unit.entries.length);
  const n = (unit.files || []).length;
  return n ? n + (n === 1 ? " Datei" : " Dateien") : "Noch leer";
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
    b.querySelector(".row-count").textContent = unitCount(unit);
    const st = (unit.entries || []).length ? Progress.unitStats(unit, subject) : null;
    if (st && st.active) {
      b.querySelector(".row-count").textContent = st.mastered + " von " + st.total + " sitzen";
      const rail = document.createElement("span");
      rail.className = "rail";
      rail.innerHTML = "<i></i>";
      rail.querySelector("i").style.setProperty("--p", st.mastered / st.total);
      b.appendChild(rail);
    }
    b.addEventListener("click", () => (unit.entries && unit.entries.length ? showSetup(unit) : showFiles(unit)));
    box.appendChild(b);
  });
  box.classList.toggle("hidden", !subject.units.length);
  $("unit-empty").textContent =
    "Für " + subject.name + " ist noch nichts drin. Sobald der Stoff für den nächsten Test da ist, findest du ihn hier.";
  $("unit-empty").classList.toggle("hidden", subject.units.length > 0);
  paint(subject);
  showScreen("unit");
}

// Unit ohne Karten: Liste zum Herunterladen, oder "Noch leer".
function showFiles(unit) {
  const subject = current.subject;
  current = { subject: subject, unit: unit, sets: [] };
  $("files-back").textContent = subject.name;
  $("files-title").textContent = unit.name;
  const box = $("files-list");
  box.innerHTML = "";
  (unit.files || []).forEach((f) => {
    const a = document.createElement("a");
    a.className = "row";
    a.href = f.href;
    a.download = "";
    a.innerHTML = '<span class="row-name"></span><span class="row-count row-get"></span>';
    a.querySelector(".row-name").textContent = f.name;
    a.querySelector(".row-count").textContent = (f.note ? f.note + " · " : "") + "Herunterladen";
    box.appendChild(a);
  });
  const empty = !(unit.files || []).length;
  box.classList.toggle("hidden", empty);
  $("files-empty").classList.toggle("hidden", !empty);
  paint(subject);
  showScreen("files");
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

const SCREENS = ["home", "unit", "files", "start", "quiz", "end", "auth", "profile"];

function showScreen(name) {
  SCREENS.forEach((n) => {
    $("screen-" + n).classList.toggle("hidden", n !== name);
  });
  window.scrollTo(0, 0);
  savePlace(name);
}

/* ---------------- Wo war ich? ---------------- */

// Nach einem Neuladen geht es auf dem gleichen Bildschirm weiter.
// Eine laufende Runde wird nicht fortgesetzt: dann landet man wieder beim Einrichten.
const PLACE_KEY = "lb-place";

function savePlace(name) {
  if (name === "auth") return;
  let screen = name;
  if (name === "quiz" || name === "end") screen = current.unit ? "start" : current.subject ? "profile" : "home";
  try {
    localStorage.setItem(
      PLACE_KEY,
      JSON.stringify({
        screen: screen,
        subjectId: current.subject ? current.subject.id : null,
        unitId: current.unit ? current.unit.id : null,
      })
    );
  } catch (e) {
    /* Privatmodus o.ae. - egal */
  }
}

function restorePlace() {
  let place = null;
  try {
    place = JSON.parse(localStorage.getItem(PLACE_KEY));
  } catch (e) {
    /* kein Ort gespeichert */
  }
  const subject = place && SUBJECTS.find((x) => x.id === place.subjectId);
  const unit = subject && subject.units.find((x) => x.id === place.unitId);
  if (place && place.screen === "profile" && Auth.current()) return showProfile();
  if (subject && place.screen === "unit") return showUnits(subject);
  if (subject && unit && place.screen === "files") {
    showUnits(subject);
    return showFiles(unit);
  }
  if (subject && unit && place.screen === "start" && unit.entries && unit.entries.length) {
    showUnits(subject);
    return showSetup(unit);
  }
  showHome();
}

// Eingeloggt: Woerter, die du schon falsch hattest, kommen eher frueh dran.
function smartOrder(pool, unitOf) {
  if (!Auth.current()) return shuffle(pool);
  return pool
    .map((e) => ({ e: e, k: Math.random() - Math.min(Progress.missesOf(unitOf(e), current.subject, e), 4) * 0.2 }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.e);
}

// unitOf: Eintrag -> Unit (bei der Schwache-Woerter-Runde kommen sie aus mehreren Units).
function startSession(pool, settings, unitOf) {
  const unitFor = unitOf || (() => current.unit);
  session = {
    pool: pool,
    settings: settings,
    sides: current.subject.sides,
    unitFor: unitFor,
    attempts: 0,
    rights: 0,
    recorded: false,
    queue: smartOrder(pool, unitFor),
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
  session.attempts++;
  if (result !== "bad") session.rights++;
  Progress.recordAnswer(session.unitFor(entry), current.subject, entry, result !== "bad");

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

  // Aufdecken: Du hast dich selbst bewertet, also gleich zur naechsten Karte.
  if (session.settings.mode === "reveal") return nextQuestion();

  fb.classList.remove("hidden", "is-good", "is-near", "is-bad");
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
  const unitId = current.unit ? current.unit.id : "weak";
  const before = Progress.rounds(current.subject.id).filter((r) => r.unitId === unitId).slice(-1)[0];
  if (!s.recorded && s.attempts) {
    s.recorded = true;
    Progress.recordRound({
      subjectId: current.subject.id,
      unitId: unitId,
      total: s.pool.length,
      done: s.done.size,
      retried: hard.length,
      attempts: s.attempts,
      rights: s.rights,
      dir: s.settings.direction,
      mode: s.settings.mode,
      weakOf: s.settings.weakOf || null,
    });
  }
  showScreen("end");
  const firstTry = Array.from(s.done).filter((e) => !s.tries.has(e)).length;
  const n = (x) => "<b>" + x + "</b>";
  $("summary").innerHTML = s.done.size
    ? "Du hast " + n(s.done.size) + " von " + n(s.pool.length) + " geschafft. " +
      n(firstTry) + (firstTry === 1 ? " sass" : " sassen") + " auf Anhieb, " + n(hard.length) + " musstest du wiederholen. " +
      "Längste Serie: " + n(s.bestStreak) + " richtig in Folge."
    : "Diesmal hat noch nichts gesessen. Starte die Runde gleich nochmal, beim zweiten Mal geht es leichter.";
  if (before && s.done.size) {
    const prev = before.done - before.retried;
    $("summary").innerHTML += " Letztes Mal sassen " + n(prev) + " auf Anhieb.";
  }
  const btn = $("btn-again-hard");
  btn.classList.toggle("hidden", hard.length === 0);
  btn.onclick = () => startSession(hard, s.settings, s.unitFor);
}

/* ---------------- Konto ---------------- */

let authMode = "login";

function showAuth(mode) {
  authMode = mode || "login";
  const signup = authMode === "signup";
  $("auth-title").textContent = signup ? "Konto erstellen" : "Anmelden";
  $("auth-submit").textContent = signup ? "Konto erstellen" : "Anmelden";
  $("auth-switch-text").textContent = signup ? "Schon ein Konto?" : "Neu hier?";
  $("auth-switch").textContent = signup ? "Anmelden" : "Konto erstellen";
  $("auth-pass").autocomplete = signup ? "new-password" : "current-password";
  $("auth-error").textContent = "";
  paint(null);
  showScreen("auth");
  $("auth-name").focus();
}

$("auth-switch").addEventListener("click", () => showAuth(authMode === "signup" ? "login" : "signup"));
$("auth-back").addEventListener("click", showHome);
$("btn-account").addEventListener("click", () => (Auth.current() ? showProfile() : showAuth("login")));

$("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("auth-name").value;
  const pass = $("auth-pass").value;
  $("auth-submit").disabled = true;
  const res = authMode === "signup" ? await Auth.signUp(name, pass) : await Auth.logIn(name, pass);
  $("auth-submit").disabled = false;
  if (!res.ok) {
    $("auth-error").textContent = res.error;
    return;
  }
  $("auth-form").reset();
  showProfile();
});

/* ---------------- Profil ---------------- */

const pct = (n) => (n === null ? "–" : n + "%");

function showProfile() {
  const user = Auth.current();
  if (!user) return showAuth("login");
  current = { subject: null, unit: null, sets: [] };
  paint(null);
  $("profile-title").textContent = user.name;

  const streak = Progress.streakDays();
  $("profile-lede").textContent = streak
    ? streak + (streak === 1 ? " Tag" : " Tage") + " in Folge geübt."
    : "Übe heute, dann startet deine Serie.";

  const strip = $("profile-days");
  strip.innerHTML = "";
  Progress.lastDays(14).forEach((d) => {
    const dot = document.createElement("i");
    if (d.practiced) dot.className = "on";
    dot.title = d.day;
    strip.appendChild(dot);
  });

  const box = $("profile-subjects");
  box.innerHTML = "";
  SUBJECTS.filter((x) => x.units.some((u) => (u.entries || []).length)).forEach((subject) => {
    box.appendChild(subjectCard(subject));
  });
  showScreen("profile");
}

// Welche Unit im Profil gewaehlt ist, pro Fach gemerkt.
const profileUnitKey = (subject) => "lb-profile-unit:" + subject.id;

function chosenUnit(subject, units) {
  let id = null;
  try {
    id = localStorage.getItem(profileUnitKey(subject));
  } catch (e) {
    /* egal */
  }
  return units.find((u) => u.id === id) || units[0];
}

function subjectCard(subject) {
  const card = document.createElement("section");
  card.className = "report";
  card.dataset.subject = subject.id;
  const units = subject.units.filter((u) => (u.entries || []).length);
  const unit = chosenUnit(subject, units);
  const rounds = Progress.unitRounds(unit);
  const st = Progress.unitStats(unit, subject);
  const weak = Progress.weakWords(subject, 0, unit);

  card.innerHTML =
    '<h2 class="report-name"></h2>' +
    '<div class="unit-pick" role="radiogroup"></div>' +
    '<dl class="figures">' +
    '<div><dd class="fig-acc"></dd><dt>richtig</dt></div>' +
    '<div><dd class="fig-rounds"></dd><dt></dt></div>' +
    '<div><dd class="fig-seat"></dd><dt>sitzen</dt></div>' +
    "</dl>" +
    '<div class="report-units"></div>' +
    '<div class="report-weak"></div>';
  card.querySelector(".report-name").textContent = subject.name;

  const pick = card.querySelector(".unit-pick");
  units.forEach((u) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "unit-chip";
    b.textContent = u.name;
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(u === unit));
    b.addEventListener("click", () => {
      try {
        localStorage.setItem(profileUnitKey(subject), u.id);
      } catch (e) {
        /* egal */
      }
      card.replaceWith(subjectCard(subject));
    });
    pick.appendChild(b);
  });

  card.querySelector(".fig-acc").textContent = pct(Progress.accuracy(subject, unit));
  card.querySelector(".fig-rounds").textContent = rounds.length;
  card.querySelector(".fig-rounds").nextElementSibling.textContent = rounds.length === 1 ? "Runde" : "Runden";
  card.querySelector(".fig-seat").textContent = st.mastered + "/" + st.total;

  // Die Teile (Objectifs) dieser Unit.
  const ul = card.querySelector(".report-units");
  Progress.setStats(unit, subject).forEach((set) => {
    const row = document.createElement("div");
    row.className = "report-unit";
    row.innerHTML = '<span class="ru-name"></span><span class="ru-count"></span><span class="rail"><i></i></span>';
    row.querySelector(".ru-name").textContent = set.name;
    row.querySelector(".ru-count").textContent = set.mastered + " von " + set.total;
    row.querySelector("i").style.setProperty("--p", set.mastered / set.total);
    ul.appendChild(row);
  });

  const wk = card.querySelector(".report-weak");
  if (!weak.length) {
    wk.innerHTML = '<p class="weak-none"></p>';
    wk.firstChild.textContent = rounds.length
      ? "Nichts, was du oft falsch hast. Weiter so."
      : "Mach eine Runde, dann zeigt dir das Profil hier deine schwersten Wörter.";
  } else {
    const h = document.createElement("h3");
    h.textContent = "Das fällt dir schwer";
    const list = document.createElement("ol");
    weak.slice(0, 6).forEach((w) => {
      const li = document.createElement("li");
      li.innerHTML = '<span class="w-word"></span><span class="w-de"></span><span class="w-n"></span>';
      li.querySelector(".w-word").textContent = w.entry[subject.sides[1].key];
      li.querySelector(".w-de").textContent = w.entry[subject.sides[0].key];
      li.querySelector(".w-n").textContent = w.wrong + "× falsch";
      list.appendChild(li);
    });
    const go = document.createElement("button");
    go.className = "go";
    go.textContent = "Schwache Wörter üben (" + Math.min(weak.length, WEAK_ROUND) + ")";
    go.addEventListener("click", () => startWeakSession(subject, unit));
    wk.append(h, list, go);
  }
  return card;
}

const WEAK_ROUND = 15;

// Eine Runde nur mit den Woertern, die du am haeufigsten falsch hattest (aus allen Units).
function startWeakSession(subject, unit) {
  const weak = Progress.weakWords(subject, WEAK_ROUND, unit);
  if (!weak.length) return;
  const unitOf = new Map(weak.map((w) => [w.entry, w.unit]));
  current = { subject: subject, unit: null, sets: [] };
  startSession(
    weak.map((w) => w.entry),
    { sets: [], direction: "mixed", mode: "write", weakOf: unit.id },
    (e) => unitOf.get(e)
  );
}

$("btn-logout").addEventListener("click", () => {
  Auth.logOut();
  showHome();
});

/* ---------------- Verdrahtung ---------------- */

restorePlace();

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
  // Gross steht nur die Loesung, die Frage rutscht klein nach oben.
  $("prompt-lang").textContent = currentEntry()[session.promptLang];
  $("prompt").textContent = currentEntry()[session.lang];
  $("btn-reveal").classList.add("hidden");
  $("reveal-knew").classList.remove("hidden");
});

$("btn-knew").addEventListener("click", () => resolve("good"));
$("btn-unknown").addEventListener("click", () => resolve("bad"));

$("btn-next").addEventListener("click", nextQuestion);

$("btn-quit").addEventListener("click", endSession);
$("btn-home").addEventListener("click", () => (current.unit ? showScreen("start") : showProfile()));

// Enter fuehrt ueberall weiter.
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  if ($("screen-quiz").classList.contains("hidden")) return;
  if (session && session.answered) {
    e.preventDefault();
    nextQuestion();
  }
});
