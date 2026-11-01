"use strict";

// Tests (Pruefungen) aus der gemeinsamen Datenbank. Nur Daten und Datumsrechnung, keine Oberflaeche.
//
// Ein Test: { id, subject_id, title, test_date "YYYY-MM-DD", unit_ids [..], note, author, created_at }
// Ohne Datenbank (src/config.js leer) ist status "off" und die Liste leer.

const Tests = (() => {
  const CACHE = "lb-tests-cache";
  const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

  let list = [];
  let status = "idle"; // idle | loading | ok | error | off

  try {
    const cached = JSON.parse(localStorage.getItem(CACHE));
    if (Array.isArray(cached)) list = cached;
  } catch (e) {
    /* kein Zwischenspeicher */
  }

  /* ---------------- Datum ---------------- */

  const pad = (n) => String(n).padStart(2, "0");
  const dayStr = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const parse = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const today = () => dayStr(new Date());
  const daysUntil = (s) => Math.round((parse(s) - parse(today())) / 86400000);

  // "Fr 14.11."
  const short = (s) => {
    const d = parse(s);
    return WEEKDAYS[d.getDay()] + " " + d.getDate() + "." + (d.getMonth() + 1) + ".";
  };

  function countdown(s) {
    const n = daysUntil(s);
    if (n === 0) return "heute";
    if (n === 1) return "morgen";
    if (n === 2) return "übermorgen";
    if (n > 2) return "in " + n + " Tagen";
    if (n === -1) return "gestern";
    return "vor " + -n + " Tagen";
  }

  // 42 Felder (6 Wochen, Montag zuerst) fuer einen Monat. month0 = 0 bis 11.
  function monthGrid(year, month0) {
    const first = new Date(year, month0, 1);
    const offset = (first.getDay() + 6) % 7;
    const t = today();
    const out = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(year, month0, 1 - offset + i);
      const s = dayStr(d);
      out.push({ date: s, day: d.getDate(), inMonth: d.getMonth() === month0, today: s === t });
    }
    return out;
  }

  /* ---------------- Abfragen ---------------- */

  const byDate = (a, b) => (a.test_date === b.test_date ? String(a.created_at).localeCompare(String(b.created_at)) : a.test_date < b.test_date ? -1 : 1);

  const all = () => list.slice().sort(byDate);
  const get = (id) => list.find((t) => t.id === id) || null;
  const onDay = (date) => all().filter((t) => t.test_date === date);
  const inMonth = (year, month0) => all().filter((t) => t.test_date.startsWith(year + "-" + pad(month0 + 1) + "-"));

  // Anstehende Tests (heute oder spaeter), mit subjectId nur dieses Faches.
  const upcoming = (subjectId) => all().filter((t) => t.test_date >= today() && (!subjectId || t.subject_id === subjectId));
  const next = (subjectId) => upcoming(subjectId)[0] || null;

  const subjectOf = (t) => (typeof SUBJECTS !== "undefined" ? SUBJECTS.find((s) => s.id === t.subject_id) : null);
  const subjectName = (t) => (subjectOf(t) ? subjectOf(t).name : t.subject_id);

  // Namen der angehaengten Units, z. B. ["Unit 2"].
  function unitNames(t) {
    const subject = subjectOf(t);
    if (!subject) return [];
    return (t.unit_ids || []).map((id) => (subject.units.find((u) => u.id === id) || {}).name).filter(Boolean);
  }

  // "Französisch: Wortschatztest, Fr 14.11."
  const label = (t) => subjectName(t) + ": " + t.title + ", " + short(t.test_date);

  function countLabel() {
    if (status === "off") return "Bald";
    const n = upcoming().length;
    return n ? n + " anstehend" : "Keine Tests";
  }

  /* ---------------- Datenbank ---------------- */

  const notify = () => window.dispatchEvent(new Event("lb:tests"));

  async function load() {
    const cloud = await Auth.cloudReady();
    if (!cloud.enabled) {
      status = "off";
      list = [];
      notify();
      return;
    }
    status = "loading";
    try {
      list = await cloud.tests.list();
      status = "ok";
      try {
        localStorage.setItem(CACHE, JSON.stringify(list));
      } catch (e) {
        /* egal */
      }
    } catch (e) {
      status = "error";
    }
    notify();
  }

  const FAIL = "Das hat nicht geklappt. Bist du online und angemeldet?";

  // t: { subject_id, title, test_date, unit_ids, note }. Gibt { ok } oder { ok: false, error } zurueck.
  async function write(fn) {
    try {
      const cloud = await Auth.cloudReady();
      if (!cloud.enabled) return { ok: false, error: "Die Datenbank ist noch nicht eingerichtet." };
      await fn(cloud);
      await load();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: FAIL };
    }
  }

  const add = (t) => write((c) => c.tests.add(t));
  const update = (id, t) => write((c) => c.tests.update(id, t));
  const remove = (id) => write((c) => c.tests.remove(id));

  Auth.cloudReady().then(load);

  return {
    MONTHS, WEEKDAYS,
    get status() { return status; },
    dayStr, parse, today, daysUntil, short, countdown, monthGrid,
    all, get, onDay, inMonth, upcoming, next,
    subjectName, unitNames, label, countLabel,
    load, add, update, remove,
  };
})();
