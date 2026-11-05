// Alle Fächer der Klasse. Nur Daten.
//
// short = kurzer Name für das Farbband auf der Startseite (optional)
// Die Farbe jedes Fachs steht in src/style.css unter [data-subject="…"].
// sides = die zwei Spalten einer Karteikarte: key ist das Feld im Eintrag,
//         name die Beschriftung. Abgefragt wird immer eine Seite gegen die andere.
// units = Units (Prüfungsstoff) des Fachs. Jede Unit hat eine Liste von
//         Einträgen; das Feld "set" teilt eine Unit in Teile (z. B. Objectif 1).
//
// files = Unit ohne Karten, nur Downloads: [{ name, note, href }] (PDFs in public/downloads).
//         Eine Unit ohne Karten und ohne Dateien zeigt "Noch leer" und zählt nicht.
//
// Neue Unit: eigene Datei in public/ anlegen, in index.html vor subjects.js
// laden und hier unter "units" eintragen.

// Abkürzungen, die in jeder französischen Unit vorkommen (qc, qn). Sie hängen automatisch
// als letzter Teil an jede Unit: neue Französisch-Units mit frUnit(...) anlegen.
const FR_ABKUERZUNGEN = [
  { set: "Abkürzungen", fr: "quelque chose (qc)", de: "etwas (etw.)", example: "J'achète qc. = Ich kaufe etwas.",
    accept: { fr: ["quelque chose", "qc"], de: ["etwas", "etw."] } },
  { set: "Abkürzungen", fr: "quelqu'un (qn)", de: "jemand (jmd.)", example: "J'aide qn. = Ich helfe jemandem.",
    accept: { fr: ["quelqu'un", "qn"], de: ["jemand", "jmd.", "jmdn.", "jmdm."] } },
];
// Steigerung: "Marie est ___ que Paul." mit − (moins), + (plus), = (aussi) und einem Adjektiv.
// In der Klammer steht das Zeichen und das Adjektiv (männlich); gesucht ist z. B. "moins grande".
// Gefragt wird die Lücke (z. B. "moins grande"); weiblich, wenn die erste Person weiblich ist.
// fixed = Richtung ist immer Aufgabe → Lösung, label = Titel der Karte, wrong = falsche Auswahl bei "Auswählen".
const STEIGERUNG = (() => {
  const SYM = { "−": "moins", "+": "plus", "=": "aussi" };
  // [Symbol, Person 1, weiblich?, Adjektiv (m), Adjektiv (w), Person 2]
  const items = [
    ["−", "Marie", 1, "grand", "grande", "Paul"],
    ["+", "Paul", 0, "sportif", "sportive", "Marie"],
    ["=", "Julie", 1, "intelligent", "intelligente", "Léa"],
    ["−", "Marc", 0, "petit", "petite", "Luc"],
    ["+", "Sophie", 1, "fort", "forte", "Thomas"],
    ["=", "Luc", 0, "gentil", "gentille", "Paul"],
    ["−", "Emma", 1, "rapide", "rapide", "Marie"],
    ["+", "Thomas", 0, "drôle", "drôle", "Julie"],
    ["=", "Ma sœur", 1, "content", "contente", "mon frère"],
    ["−", "Mon frère", 0, "patient", "patiente", "ma sœur"],
    ["+", "Léa", 1, "heureux", "heureuse", "Sophie"],
    ["=", "Paul", 0, "timide", "timide", "Marc"],
    ["+", "La prof", 1, "sympa", "sympa", "le prof"],
    ["−", "Marie", 1, "lent", "lente", "Julie"],
    ["+", "Luc", 0, "jeune", "jeune", "Emma"],
    ["=", "Sophie", 1, "beau", "belle", "Léa"],
  ];
  return items.map(([sym, a, f, m, w, b]) => {
    const adj = f ? w : m;
    const answer = SYM[sym] + " " + adj;
    const wrong = [];
    Object.keys(SYM).forEach((k) => k !== sym && wrong.push(SYM[k] + " " + adj));
    if (m !== w) wrong.push(SYM[sym] + " " + (f ? m : w));
    return {
      set: "Steigerung",
      fr: answer,
      de: a + " est ___ que " + b + ".   ( " + sym + "  |  " + m + " )",
      example: a + " est " + answer + " que " + b + ".",
      fixed: "forward",
      label: "Setze ein",
      wrong: wrong,
    };
  });
})();

const frUnit = (id, name, entries) => ({ id, name, entries: entries.concat(STEIGERUNG, FR_ABKUERZUNGEN) });

const SUBJECTS = [
  {
    id: "franzoesisch",
    name: "Französisch",
    sides: [{ key: "de", name: "Deutsch" }, { key: "fr", name: "Französisch" }],
    units: [
      frUnit("fr-1", "Unit 1", FRANZOESISCH_UNIT_1),
      frUnit("fr-2", "Unit 2", FRANZOESISCH_UNIT_2),
    ],
  },
  {
    id: "englisch",
    name: "Englisch",
    sides: [{ key: "de", name: "Deutsch" }, { key: "en", name: "Englisch" }],
    // Stufen: noch ohne Inhalt, zählen deshalb nicht als Unit (Fach zeigt "Noch leer").
    units: [
      { id: "en-a2", name: "A2", entries: [] },
      { id: "en-b1", name: "B1", entries: [] },
      { id: "en-b1plus", name: "B1+", entries: [] },
    ],
  },
  {
    id: "deutsch",
    name: "Deutsch",
    sides: [{ key: "q", name: "Frage" }, { key: "a", name: "Antwort" }],
    units: [
      {
        id: "de-satzglieder",
        name: "Satzglieder",
        files: [
          { name: "Übung", note: "4 Seiten", href: "/downloads/Satzglieder_Uebung.pdf" },
          { name: "Lösung", note: "4 Seiten", href: "/downloads/Satzglieder_Loesung.pdf" },
          { name: "Satzglieder erweitern", note: "2 Seiten", href: "/downloads/Satzglieder_erweitern.pdf" },
        ],
      },
    ],
  },
  {
    id: "mathematik",
    name: "Mathematik",
    sides: [{ key: "q", name: "Frage" }, { key: "a", name: "Antwort" }],
    units: [
      {
        id: "ma-gleichungen-terme",
        name: "Gleichungen und Terme",
        files: [
          { name: "Aufgaben", note: "4 Seiten", href: "/downloads/Gleichungen_und_Terme_Aufgaben.pdf" },
          { name: "Lösungen", note: "5 Seiten", href: "/downloads/Gleichungen_und_Terme_Loesungen.pdf" },
        ],
      },
    ],
  },
  {
    id: "nt",
    name: "Natur und Technik",
    sides: [{ key: "q", name: "Frage" }, { key: "a", name: "Antwort" }],
    units: [
      {
        id: "nt-kraefte",
        name: "Kräfte",
        files: [{ name: "Lernziele und Übungen mit Lösungen", note: "12 Seiten", href: "/downloads/Kraefte_Lernziele_Uebungen.pdf" }],
      },
    ],
  },
  {
    id: "rzg",
    name: "Räume, Zeiten, Gesellschaften",
    short: "RZG",
    sides: [{ key: "q", name: "Frage" }, { key: "a", name: "Antwort" }],
    units: [],
  },
];
