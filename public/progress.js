"use strict";

// Lernstand pro Benutzer, nur auf diesem Geraet (localStorage).
// Ohne Anmeldung wird nichts gespeichert, alle Funktionen sind dann leer.
//
// words:  "<unitId>|<Teil>|<Schluessel>" -> { h, last }
//         h = die letzten Antworten, "1" richtig, "0" falsch, neueste zuletzt (z. B. "0101")
// rounds: fertige und abgebrochene Runden, neueste zuletzt
// days:   Tage (YYYY-MM-DD), an denen geuebt wurde

const Progress = (() => {
  const VERSION = 2;
  const KEEP = 8; // so viele Antworten pro Wort merken
  const MAX_ROUNDS = 200;

  // Zustand eines Wortes, aus seinen letzten Antworten:
  //   neu       noch nie gefragt
  //   falsch    zuletzt falsch und noch nie richtig
  //   wackelig  gemischt: zuletzt falsch (aber schon mal richtig) oder richtig mit Fehler in den letzten 3
  //   richtig   richtig, kein Fehler in den letzten 3, aber erst einmal in Folge
  //   sitzt     mindestens zweimal in Folge richtig, kein Fehler in den letzten 3
  const STATES = ["falsch", "wackelig", "richtig", "sitzt", "neu"];
  const SCORE = { neu: 0, falsch: 0, wackelig: 0.35, richtig: 0.7, sitzt: 1 };

  function stateOf(h) {
    if (!h) return "neu";
    if (h[h.length - 1] === "0") return h.includes("1") ? "wackelig" : "falsch";
    if (h.slice(-3).includes("0")) return "wackelig";
    return /11$/.test(h) ? "sitzt" : "richtig";
  }

  const storeKey = () => {
    const u = Auth.current();
    return u ? "lb-progress:" + u.key : null;
  };

  function load() {
    const k = storeKey();
    if (!k) return null;
    let old = null;
    try {
      const data = JSON.parse(localStorage.getItem(k));
      if (data && data.v === VERSION && data.words && data.rounds && data.days) return data;
      old = data;
    } catch (e) {
      /* faellt auf leer zurueck */
    }
    // Aeltere Staende zaehlten anders (und mit doppelten Schluesseln): neu anfangen, Tage behalten.
    return { v: VERSION, words: {}, rounds: [], days: old && Array.isArray(old.days) ? old.days : [] };
  }

  function save(data) {
    try {
      localStorage.setItem(storeKey(), JSON.stringify(data));
    } catch (e) {
      /* Privatmodus o.ae. - egal */
    }
  }

  const dayOf = (d) =>
    d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

  // Eindeutig auch dann, wenn dasselbe Wort in zwei Teilen vorkommt.
  const wordKey = (unit, subject, entry) => unit.id + "|" + (entry.set || "Alle") + "|" + entry[subject.sides[1].key];

  function recordAnswer(unit, subject, entry, ok) {
    const data = load();
    if (!data) return;
    const k = wordKey(unit, subject, entry);
    const w = data.words[k] || { h: "", last: 0 };
    w.h = (w.h + (ok ? "1" : "0")).slice(-KEEP);
    w.last = Date.now();
    data.words[k] = w;
    const t = dayOf(new Date());
    if (!data.days.includes(t)) data.days.push(t);
    save(data);
  }

  // round: { subjectId, unitId, kind: "round" | "retry" | "weak", complete, ... }
  function recordRound(round) {
    const data = load();
    if (!data) return;
    data.rounds.push(Object.assign({ ts: Date.now() }, round));
    if (data.rounds.length > MAX_ROUNDS) data.rounds = data.rounds.slice(-MAX_ROUNDS);
    save(data);
  }

  const stateOfEntry = (data, unit, subject, entry) => {
    const w = data && data.words[wordKey(unit, subject, entry)];
    return stateOf(w ? w.h : "");
  };

  function wordState(unit, subject, entry) {
    return stateOfEntry(load(), unit, subject, entry);
  }

  // { total, counts: { neu, falsch, wackelig, richtig, sitzt }, score (0 bis 1), active }
  function summarize(data, unit, subject, entries) {
    const counts = { neu: 0, falsch: 0, wackelig: 0, richtig: 0, sitzt: 0 };
    let points = 0;
    entries.forEach((e) => {
      const s = stateOfEntry(data, unit, subject, e);
      counts[s]++;
      points += SCORE[s];
    });
    const total = entries.length;
    return { total: total, counts: counts, score: total ? points / total : 0, active: !!data };
  }

  function unitSummary(unit, subject) {
    return summarize(load(), unit, subject, unit.entries || []);
  }

  // Pro Teil (Objectif) einer Unit: [{ name, total, counts, score }]
  function setSummary(unit, subject) {
    const data = load();
    const names = [];
    (unit.entries || []).forEach((e) => {
      const n = e.set || "Alle";
      if (!names.includes(n)) names.push(n);
    });
    return names.map((n) =>
      Object.assign({ name: n }, summarize(data, unit, subject, unit.entries.filter((e) => (e.set || "Alle") === n)))
    );
  }

  // Schwierige Woerter (falsch zuerst, dann wackelig), mit `only` nur aus dieser Unit:
  // [{ unit, entry, state }]
  function weakWords(subject, limit, only) {
    const data = load();
    if (!data) return [];
    const out = [];
    subject.units.filter((u) => !only || u === only).forEach((unit) => {
      (unit.entries || []).forEach((entry) => {
        const w = data.words[wordKey(unit, subject, entry)];
        const state = stateOf(w ? w.h : "");
        if (state === "falsch" || state === "wackelig") out.push({ unit, entry, state, last: w.last, misses: (w.h.match(/0/g) || []).length });
      });
    });
    out.sort((a, b) => (a.state === b.state ? b.misses - a.misses || b.last - a.last : a.state === "falsch" ? -1 : 1));
    return limit ? out.slice(0, limit) : out;
  }

  // Wie unsicher ein Wort ist, 0 bis 3 (fuer die Reihenfolge beim Ueben).
  function weight(unit, subject, entry) {
    const s = stateOfEntry(load(), unit, subject, entry);
    return s === "falsch" ? 3 : s === "wackelig" ? 2 : s === "neu" ? 1 : 0;
  }

  function rounds() {
    const data = load();
    return data ? data.rounds : [];
  }

  // Fertige normale Runden einer Unit (ohne Wiederholungen, Abbrueche und Schwache-Woerter-Runden).
  function unitRounds(unit) {
    return rounds().filter((r) => r.kind === "round" && r.complete && r.unitId === unit.id);
  }

  // Letzte n Tage, aelteste zuerst: [{ day, practiced }]
  function lastDays(n) {
    const data = load();
    const set = new Set(data ? data.days : []);
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      out.push({ day: dayOf(d), practiced: set.has(dayOf(d)) });
    }
    return out;
  }

  // Tage in Folge; heute zaehlt nicht gegen dich, wenn du noch nicht geuebt hast.
  function streakDays() {
    const days = lastDays(365).reverse();
    let n = 0;
    for (let i = 0; i < days.length; i++) {
      if (days[i].practiced) n++;
      else if (i > 0) break;
    }
    return n;
  }

  // Loescht den ganzen Lernstand dieses Benutzers (das Konto bleibt).
  function reset() {
    const k = storeKey();
    if (!k) return;
    try {
      localStorage.removeItem(k);
    } catch (e) {
      /* egal */
    }
  }

  return { reset, STATES, stateOf, recordAnswer, recordRound, wordState, unitSummary, setSummary, weakWords, weight, rounds, unitRounds, lastDays, streakDays };
})();
