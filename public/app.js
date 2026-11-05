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
  if (lang === "fr") out.slice().forEach((s) => {
    add(expandQc(s));
    add(shrinkQc(s));
  });
  // Synonymlisten wie "leicht, einfach": jedes einzelne Wort gilt auch.
  // Ganze Saetze (enden auf . ! ? ...) werden nicht zerlegt.
  out.slice().forEach((s) => {
    if (s.includes(", ") && !/[.!?…]$/.test(s.trim())) {
      s.split(", ").forEach((part) => add(part.trim()));
    }
  });
  return out;
}

// qc / qn: Schalter im Setup, ob "qc" und "qn" abgekürzt oder ausgeschrieben angezeigt werden.
// Als Antwort gelten immer beide Schreibweisen. Die Abkürzungs-Einträge selbst bleiben unverändert.
const QC_KEY = "lb-qcform";
const qcFull = () => {
  try {
    return localStorage.getItem(QC_KEY) === "full";
  } catch (e) {
    return false;
  }
};
const expandQc = (s) => (/\((qc|qn)\)/.test(s) ? s : s.replace(/\bqc\b/g, "quelque chose").replace(/\bqn\b/g, "quelqu'un"));
const shrinkQc = (s) => s.replace(/quelque chose/g, "qc").replace(/quelqu'un/g, "qn");
// Text eines Eintrags für die Anzeige
const shown = (entry, key) => (key === "fr" && qcFull() ? expandQc(entry[key]) : entry[key]);

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

const STATE_NAMES = { sitzt: "sitzt", richtig: "richtig", wackelig: "wackelig", falsch: "falsch", neu: "neu" };
const SEG_ORDER = ["sitzt", "richtig", "wackelig", "falsch", "neu"];

// Balken mit einem Stueck pro Zustand der Woerter (siehe progress.js).
function segBar(sum) {
  const bar = document.createElement("span");
  bar.className = "seg";
  bar.setAttribute("role", "img");
  bar.setAttribute("aria-label", SEG_ORDER.map((k) => sum.counts[k] + " " + STATE_NAMES[k]).join(", "));
  SEG_ORDER.forEach((k) => {
    if (!sum.counts[k]) return;
    const i = document.createElement("i");
    i.dataset.s = k;
    i.style.flexGrow = sum.counts[k];
    bar.appendChild(i);
  });
  return bar;
}

const percent = (sum) => Math.round(sum.score * 100) + "% gelernt";

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
  if (typeof refreshTestHints === "function") refreshTestHints();
}

// Kleine Anzeige im Band: wie gut die Karten des Fachs sitzen (nur angemeldet).
function bandMeter(subject) {
  const total = { total: 0, score: 0, active: false, counts: { neu: 0, falsch: 0, wackelig: 0, richtig: 0, sitzt: 0 } };
  let points = 0;
  subject.units.forEach((unit) => {
    if (!(unit.entries || []).length) return;
    const sum = Progress.unitSummary(unit, subject);
    total.total += sum.total;
    total.active = sum.active;
    points += sum.score * sum.total;
    SEG_ORDER.forEach((k) => (total.counts[k] += sum.counts[k]));
  });
  if (!total.active || !total.total) return null;
  total.score = points / total.total;
  const el = document.createElement("span");
  el.className = "band-meter";
  el.appendChild(segBar(total));
  const text = document.createElement("span");
  text.textContent = percent(total);
  el.appendChild(text);
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
    const sum = (unit.entries || []).length ? Progress.unitSummary(unit, subject) : null;
    if (sum && sum.active) {
      b.querySelector(".row-count").textContent = percent(sum);
      b.appendChild(segBar(sum));
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
  if (typeof refreshTestHints === "function") refreshTestHints();
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
    // Zuerst ansehen (öffnet das PDF in einem neuen Tab), daneben herunterladen.
    const row = document.createElement("div");
    row.className = "row file-row";
    row.innerHTML =
      '<span class="row-name"></span><span class="row-count"></span>' +
      '<span class="file-actions"><a class="pill" target="_blank" rel="noopener">Ansehen</a><a class="pill" download>Herunterladen</a></span>';
    row.querySelector(".row-name").textContent = f.name;
    row.querySelector(".row-count").textContent = f.note || "";
    row.querySelectorAll("a").forEach((a) => (a.href = f.href));
    box.appendChild(row);
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
  $("qc-group").classList.toggle("hidden", subject.id !== "franzoesisch");
  document.querySelectorAll('input[name="qcform"]').forEach((i) => {
    i.checked = i.value === (qcFull() ? "full" : "short");
    i.onchange = () => {
      try {
        localStorage.setItem(QC_KEY, i.value);
      } catch (e) {
        /* egal */
      }
    };
  });
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

// Bei "Gemischt": wie viel Prozent der Fragen in der ersten Richtung kommen (Rest umgekehrt).
let mixPct = 50;

function openMix() {
  const [a, b] = current.subject.sides;
  const slider = $("mix-slider");
  const paint = () => {
    mixPct = +slider.value;
    $("mix-a").textContent = a.name + " → " + b.name;
    $("mix-b").textContent = b.name + " → " + a.name;
    $("mix-a-pct").textContent = mixPct + " %";
    $("mix-b-pct").textContent = 100 - mixPct + " %";
    slider.style.setProperty("--p", mixPct + "%");
    const lab = document.querySelector('input[name="direction"][value="mixed"] + span');
    if (lab) lab.textContent = "Gemischt (" + mixPct + " / " + (100 - mixPct) + ")";
  };
  slider.value = String(mixPct);
  slider.oninput = paint;
  $("mix-done").onclick = () => $("mix-dialog").close();
  paint();
  if (typeof $("mix-dialog").showModal === "function" && !$("mix-dialog").open) $("mix-dialog").showModal();
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
    const c = chip("radio", "direction", value, text);
    // Gemischt (neu gewählt oder nochmal angetippt): Regler zum Einstellen öffnen
    if (value === "mixed") c.querySelector("input").addEventListener("click", openMix);
    box.appendChild(c);
  });
}

/* ---------------- Einstellungen ---------------- */

// Pro Unit gespeichert, damit jede Unit ihre eigene Auswahl behaelt.
const storeKey = () => "lb-settings:" + current.unit.id;

function loadSettings() {
  mixPct = 50;
  const fallback = { sets: current.sets.filter((n) => n !== ADJ_SET), direction: "forward", mode: "write" };
  try {
    const saved = JSON.parse(localStorage.getItem(storeKey()));
    if (!saved) return fallback;
    let sets = (saved.sets || []).filter((s) => current.sets.includes(s));
    if (sets.length > 1 && sets.includes(ADJ_SET)) sets = sets.filter((s) => s !== ADJ_SET);
    return {
      sets: sets.length ? sets : fallback.sets,
      direction: ["forward", "back", "mixed"].includes(saved.direction)
        ? saved.direction
        : fallback.direction,
      mode: saved.mode || fallback.mode,
      mix: typeof saved.mix === "number" ? saved.mix : 50,
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

const ADJ_SET = "Adjektiv";

function buildSetList(settings) {
  const box = $("set-list");
  box.innerHTML = "";
  current.sets.forEach((name) => {
    const count = current.unit.entries.filter((w) => setOf(w) === name).length;
    const label = chip("checkbox", "set", name, name, String(count));
    const input = label.querySelector("input");
    input.checked = settings.sets.includes(name);
    // "Adjektiv" und die Objectifs schliessen sich aus: das eine wählen, das andere geht weg.
    input.addEventListener("change", () => {
      if (!input.checked) return;
      box.querySelectorAll("input").forEach((o) => {
        if (o !== input && (name === ADJ_SET || o.value === ADJ_SET)) o.checked = false;
      });
    });
    box.appendChild(label);
  });
}

function readSettings() {
  return {
    sets: Array.from($("set-list").querySelectorAll("input:checked")).map((i) => i.value),
    direction: document.querySelector('input[name="direction"]:checked').value,
    mode: document.querySelector('input[name="mode"]:checked').value,
    mix: mixPct,
  };
}

function applySettings(s) {
  mixPct = typeof s.mix === "number" ? s.mix : 50;
  const lab = document.querySelector('input[name="direction"][value="mixed"] + span');
  if (lab) lab.textContent = mixPct === 50 ? "Gemischt" : "Gemischt (" + mixPct + " / " + (100 - mixPct) + ")";
  document.querySelectorAll('input[name="direction"]').forEach((i) => {
    i.checked = i.value === s.direction;
  });
  document.querySelectorAll('input[name="mode"]').forEach((i) => {
    i.checked = i.value === s.mode;
  });
}

/* ---------------- Sitzung ---------------- */

let session = null;

const SCREENS = ["home", "unit", "files", "start", "quiz", "end", "auth", "profile", "tests"];

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
  if (place && place.screen === "tests" && typeof showTests === "function") return showTests();
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

// Eingeloggt: unsichere Woerter (falsch, wackelig) und neue kommen eher frueh dran.
function smartOrder(pool, unitOf) {
  if (!Auth.current()) return shuffle(pool);
  return pool
    .map((e) => ({ e: e, k: Math.random() - Progress.weight(unitOf(e), current.subject, e) * 0.2 }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.e);
}

// unitOf: Eintrag -> Unit (bei der Schwache-Woerter-Runde kommen sie aus mehreren Units).
// kind: "round" (normale Runde), "retry" (Schwierige nochmal), "weak" (Schwache Woerter).
function startSession(pool, settings, unitOf, kind) {
  const unitFor = unitOf || (() => current.unit);
  // Das Profil zeigt danach die Unit, die du gerade uebst.
  if (current.unit) {
    try {
      localStorage.setItem(profileUnitKey(current.subject), current.unit.id);
    } catch (e) {
      /* egal */
    }
  }
  session = {
    pool: pool,
    settings: settings,
    sides: current.subject.sides,
    unitFor: unitFor,
    kind: kind || "round",
    complete: false,
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
  if (!session.queue.length) {
    session.complete = true;
    return endSession();
  }

  const entry = currentEntry();
  const dir = session.settings.direction;
  const forward = entry.fixed ? entry.fixed === "forward" : dir === "forward" || (dir === "mixed" && Math.random() < (typeof session.settings.mix === "number" ? session.settings.mix : 50) / 100);
  const [ask, answer] = forward ? session.sides : session.sides.slice().reverse();
  session.lang = answer.key;
  session.promptLang = ask.key;
  session.answered = false;

  // Nur Darstellung: die naechste Karte wird aufgelegt (Animation in style.css).
  const card = document.querySelector(".ask");
  card.classList.remove("deal");
  void card.offsetWidth;
  card.classList.add("deal");

  $("prompt-lang").textContent = entry.label || ask.name;
  $("prompt").textContent = shown(entry, ask.key);
  $("prompt").classList.toggle("gap", !!entry.fixed);

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
  const correct = shown(entry, lang);
  // Lückenaufgaben haben eigene falsche Antworten (z. B. "moins grand" statt "moins grande").
  const others = (entry.wrong ? shuffle(entry.wrong) : shuffle(session.pool.filter((w) => w !== entry && w[lang] !== entry[lang])).map((w) => shown(w, lang)))
    .slice(0, 3);
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
  const solution = shown(entry, session.lang);
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
  const before = Progress.rounds()
    .filter((r) => r.kind === "round" && r.complete && r.unitId === unitId)
    .slice(-1)[0];
  if (!s.recorded && s.attempts) {
    s.recorded = true;
    Progress.recordRound({
      subjectId: current.subject.id,
      unitId: unitId,
      kind: s.kind,
      complete: s.complete,
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
  if (before && s.kind === "round" && s.complete && s.done.size) {
    const prev = before.done - before.retried;
    $("summary").innerHTML += " Letztes Mal sassen " + n(prev) + " auf Anhieb.";
  }
  const btn = $("btn-again-hard");
  btn.classList.toggle("hidden", hard.length === 0);
  btn.onclick = () => startSession(hard, s.settings, s.unitFor, "retry");
}

/* ---------------- Konto ---------------- */

// Wo das Konto liegt, ehrlich gesagt.
function accountNote() {
  return Auth.cloudOn()
    ? "Dein Konto und dein Lernstand liegen in der Datenbank. Du kannst dich mit Benutzername und Passwort auf jedem Gerät anmelden."
    : "Dein Konto und dein Lernstand liegen nur in diesem Browser. Löschst du die Browserdaten, ist das Konto weg.";
}

let authMode = "login";
let authReturn = false; // true: nach dem Anmelden zurueck, wo man war (z. B. zum Einrichten einer Runde)

function showAuth(mode, returnBack) {
  authMode = mode || "login";
  authReturn = !!returnBack;
  const signup = authMode === "signup";
  $("auth-title").textContent = signup ? "Konto erstellen" : "Anmelden";
  $("auth-submit").textContent = signup ? "Konto erstellen" : "Anmelden";
  $("auth-switch-text").textContent = signup ? "Schon ein Konto?" : "Neu hier?";
  $("auth-switch").textContent = signup ? "Anmelden" : "Konto erstellen";
  $("auth-pass").autocomplete = signup ? "new-password" : "current-password";
  $("auth-error").textContent = "";
  document.querySelectorAll(".auth-card .auth-note, .profile-foot .auth-note").forEach((el) => (el.textContent = accountNote()));
  paint(null);
  showScreen("auth");
  $("auth-name").focus();
}

$("auth-switch").addEventListener("click", () => showAuth(authMode === "signup" ? "login" : "signup"));
$("auth-back").addEventListener("click", () => (authReturn ? restorePlace() : showHome()));
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
  if (authReturn) {
    authReturn = false;
    restorePlace();
  } else {
    showProfile();
  }
});

/* ---------------- Profil ---------------- */

const pct = (n) => (n === null ? "–" : n + "%");

function showProfile() {
  const user = Auth.current();
  if (!user) return showAuth("login");
  current = { subject: null, unit: null, sets: [] };
  paint(null);
  askReset(false);
  document.querySelectorAll(".profile-foot .auth-note").forEach((el) => (el.textContent = accountNote()));
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
  const sum = Progress.unitSummary(unit, subject);
  const rounds = Progress.unitRounds(unit);
  const weak = Progress.weakWords(subject, 0, unit);

  card.innerHTML =
    '<h2 class="report-name"></h2>' +
    '<div class="unit-pick" role="radiogroup"></div>' +
    '<div class="score"><span class="score-num"></span><span class="score-label">gelernt</span></div>' +
    '<div class="score-bar"></div>' +
    '<ul class="legend"></ul>' +
    '<div class="report-units"></div>' +
    '<p class="report-rounds"></p>' +
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

  card.querySelector(".score-num").textContent = Math.round(sum.score * 100) + "%";
  card.querySelector(".score-bar").appendChild(segBar(sum));
  const legend = card.querySelector(".legend");
  SEG_ORDER.forEach((k) => {
    const li = document.createElement("li");
    li.dataset.s = k;
    li.innerHTML = "<i></i><b></b><span></span>";
    li.querySelector("b").textContent = sum.counts[k];
    li.querySelector("span").textContent = STATE_NAMES[k];
    legend.appendChild(li);
  });

  // Die Teile (Objectifs) dieser Unit.
  const ul = card.querySelector(".report-units");
  Progress.setSummary(unit, subject).forEach((set) => {
    const row = document.createElement("div");
    row.className = "report-unit";
    row.innerHTML = '<span class="ru-name"></span><span class="ru-count"></span>';
    row.querySelector(".ru-name").textContent = set.name;
    row.querySelector(".ru-count").textContent = percent(set);
    row.appendChild(segBar(set));
    ul.appendChild(row);
  });

  card.querySelector(".report-rounds").textContent =
    rounds.length === 0
      ? "Noch keine Runde zu Ende gebracht."
      : rounds.length + (rounds.length === 1 ? " Runde" : " Runden") + " zu Ende gebracht.";

  const wk = card.querySelector(".report-weak");
  if (!weak.length) {
    wk.innerHTML = '<p class="weak-none"></p>';
    wk.firstChild.textContent = sum.counts.neu === sum.total
      ? "Mach eine Runde, dann zeigt dir das Profil hier deine schwersten Wörter."
      : "Nichts, was dir gerade schwerfällt. Weiter so.";
  } else {
    const h = document.createElement("h3");
    h.textContent = "Das fällt dir schwer";
    const list = document.createElement("ol");
    weak.slice(0, 6).forEach((w) => {
      const li = document.createElement("li");
      li.dataset.s = w.state;
      li.innerHTML = '<i></i><span class="w-word"></span><span class="w-de"></span>';
      li.querySelector(".w-word").textContent = shown(w.entry, subject.sides[1].key);
      li.querySelector(".w-de").textContent = w.entry[subject.sides[0].key];
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
    (e) => unitOf.get(e),
    "weak"
  );
}

// Zuruecksetzen mit Rueckfrage, damit man es nicht aus Versehen tut.
function askReset(asking) {
  $("btn-reset").classList.toggle("hidden", asking);
  $("btn-logout").classList.toggle("hidden", asking);
  $("reset-confirm").classList.toggle("hidden", !asking);
  if (asking) $("btn-reset-no").focus();
}

$("btn-reset").addEventListener("click", () => askReset(true));
$("btn-reset-no").addEventListener("click", () => askReset(false));
$("btn-reset-yes").addEventListener("click", () => {
  Progress.reset();
  askReset(false);
  showProfile();
});

$("btn-logout").addEventListener("click", () => {
  Auth.logOut();
  showHome();
});

/* ---------------- Verdrahtung ---------------- */

// Die Datenbank meldet sich nach dem Start, oder ein Stand wurde abgeglichen: Bildschirm neu zeichnen,
// aber nie mitten in einer Runde oder beim Anmelden.
function refreshScreen() {
  const busy = ["quiz", "end", "auth"].some((n) => !$("screen-" + n).classList.contains("hidden"));
  if (!busy) restorePlace();
}
window.addEventListener("cloud:ready", refreshScreen);
window.addEventListener("lb:progress", refreshScreen);

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
  const pool = current.unit.entries.filter((w) => s.sets.includes(setOf(w)));
  withLoginNudge(() => startSession(pool, s));
});

// Ohne Konto wird nichts gespeichert: einmal pro Sitzung nachfragen, ob man sich anmelden will.
const SKIP_KEY = "lb-skip-login";

function withLoginNudge(start) {
  let skipped = false;
  try {
    skipped = sessionStorage.getItem(SKIP_KEY) === "1";
  } catch (e) {
    /* egal */
  }
  if (Auth.current() || skipped || typeof $("login-nudge").showModal !== "function") return start();
  const dialog = $("login-nudge");
  dialog.addEventListener(
    "close",
    () => {
      const v = dialog.returnValue;
      if (v === "login" || v === "signup") return showAuth(v, true);
      try {
        sessionStorage.setItem(SKIP_KEY, "1");
      } catch (e) {
        /* egal */
      }
      if (v === "skip") start();
    },
    { once: true }
  );
  dialog.returnValue = "";
  dialog.showModal();
}

$("write-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (session.answered) return;
  const typed = $("answer").value;
  if (!typed.trim()) return;
  resolve(grade(typed, currentEntry(), session.lang));
});

$("btn-reveal").addEventListener("click", () => {
  // Gross steht nur die Loesung, die Frage rutscht klein nach oben.
  $("prompt-lang").textContent = currentEntry().label || current.subject.sides.find((x) => x.key === session.promptLang).name;
  $("prompt").textContent = shown(currentEntry(), session.lang);
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
