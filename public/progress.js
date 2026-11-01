"use strict";

// Lernstand pro Benutzer, nur auf diesem Geraet (localStorage).
// Ohne Anmeldung wird nichts gespeichert, alle Funktionen sind dann leer.
//
// words:  "<unitId>|<Schluessel>" -> { right, wrong, streak, last }
// rounds: abgeschlossene Runden, neueste zuletzt
// days:   Tage (YYYY-MM-DD), an denen geuebt wurde

const Progress = (() => {
  const MASTERED_AT = 2; // so viele richtige Antworten in Folge = sitzt
  const MAX_ROUNDS = 200;

  const storeKey = () => {
    const u = Auth.current();
    return u ? "lb-progress:" + u.key : null;
  };

  function load() {
    const k = storeKey();
    if (!k) return null;
    try {
      const data = JSON.parse(localStorage.getItem(k));
      if (data && data.words && data.rounds && data.days) return data;
    } catch (e) {
      /* faellt auf leer zurueck */
    }
    return { words: {}, rounds: [], days: [] };
  }

  function save(data) {
    try {
      localStorage.setItem(storeKey(), JSON.stringify(data));
    } catch (e) {
      /* Privatmodus o.ae. - egal */
    }
  }

  const today = () => {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  };

  // Das erste Feld der Seite 1 des Faches ist der stabile Schluessel (z. B. fr).
  const wordKey = (unit, subject, entry) => unit.id + "|" + entry[subject.sides[1].key];

  function recordAnswer(unit, subject, entry, ok) {
    const data = load();
    if (!data) return;
    const k = wordKey(unit, subject, entry);
    const w = data.words[k] || { right: 0, wrong: 0, streak: 0, last: 0 };
    if (ok) {
      w.right++;
      w.streak++;
    } else {
      w.wrong++;
      w.streak = 0;
    }
    w.last = Date.now();
    data.words[k] = w;
    const t = today();
    if (!data.days.includes(t)) data.days.push(t);
    save(data);
  }

  function recordRound(round) {
    const data = load();
    if (!data) return;
    data.rounds.push(Object.assign({ ts: Date.now() }, round));
    if (data.rounds.length > MAX_ROUNDS) data.rounds = data.rounds.slice(-MAX_ROUNDS);
    save(data);
  }

  // { total, mastered } fuer eine Unit mit Karten.
  function unitStats(unit, subject) {
    const data = load();
    const entries = unit.entries || [];
    let mastered = 0;
    if (data) {
      entries.forEach((e) => {
        const w = data.words[wordKey(unit, subject, e)];
        if (w && w.streak >= MASTERED_AT) mastered++;
      });
    }
    return { total: entries.length, mastered: mastered, active: !!data };
  }

  // Woerter, die du am haeufigsten falsch hattest: [{ unit, entry, wrong, right }]
  function weakWords(subject, limit) {
    const data = load();
    if (!data) return [];
    const out = [];
    subject.units.forEach((unit) => {
      (unit.entries || []).forEach((entry) => {
        const w = data.words[wordKey(unit, subject, entry)];
        if (w && w.wrong > 0 && w.streak < MASTERED_AT) out.push({ unit, entry, wrong: w.wrong, right: w.right, last: w.last });
      });
    });
    out.sort((a, b) => b.wrong - a.wrong || a.right - b.right || b.last - a.last);
    return limit ? out.slice(0, limit) : out;
  }

  // Wie oft ein Wort schon falsch war (fuer die Gewichtung beim Mischen).
  function missesOf(unit, subject, entry) {
    const data = load();
    const w = data && data.words[wordKey(unit, subject, entry)];
    return w ? w.wrong : 0;
  }

  function rounds(subjectId) {
    const data = load();
    if (!data) return [];
    return data.rounds.filter((r) => !subjectId || r.subjectId === subjectId);
  }

  function accuracy(subject) {
    const data = load();
    if (!data) return null;
    let right = 0;
    let wrong = 0;
    subject.units.forEach((unit) => {
      (unit.entries || []).forEach((e) => {
        const w = data.words[wordKey(unit, subject, e)];
        if (w) {
          right += w.right;
          wrong += w.wrong;
        }
      });
    });
    return right + wrong ? Math.round((right / (right + wrong)) * 100) : null;
  }

  // Letzte n Tage, aelteste zuerst: [{ day, practiced }]
  function lastDays(n) {
    const data = load();
    const set = new Set(data ? data.days : []);
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const day = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      out.push({ day: day, practiced: set.has(day) });
    }
    return out;
  }

  // Tage in Folge, heute nicht mitgezaehlt, falls noch nicht geuebt.
  function streakDays() {
    const days = lastDays(365).reverse();
    let n = 0;
    for (let i = 0; i < days.length; i++) {
      if (days[i].practiced) n++;
      else if (i === 0) continue;
      else break;
    }
    return n;
  }

  return { recordAnswer, recordRound, unitStats, weakWords, missesOf, rounds, accuracy, lastDays, streakDays };
})();
