// Alle Fächer der Klasse. Nur Daten.
//
// short = kurzer Name für das Farbband auf der Startseite (optional)
// Die Farbe jedes Fachs steht in src/style.css unter [data-subject="…"].
// sides = die zwei Spalten einer Karteikarte: key ist das Feld im Eintrag,
//         name die Beschriftung. Abgefragt wird immer eine Seite gegen die andere.
// units = Units (Prüfungsstoff) des Fachs. Jede Unit hat eine Liste von
//         Einträgen; das Feld "set" teilt eine Unit in Teile (z. B. Objectif 1).
//
// Neue Unit: eigene Datei in public/ anlegen, in index.html vor subjects.js
// laden und hier unter "units" eintragen.

const SUBJECTS = [
  {
    id: "franzoesisch",
    name: "Französisch",
    sides: [{ key: "de", name: "Deutsch" }, { key: "fr", name: "Französisch" }],
    units: [
      { id: "fr-1", name: "Unit …", entries: FRANZOESISCH_UNIT_1 },
    ],
  },
  {
    id: "mathematik",
    name: "Mathematik",
    sides: [{ key: "q", name: "Frage" }, { key: "a", name: "Antwort" }],
    units: [],
  },
  {
    id: "deutsch",
    name: "Deutsch",
    sides: [{ key: "q", name: "Frage" }, { key: "a", name: "Antwort" }],
    units: [],
  },
  {
    id: "englisch",
    name: "Englisch",
    sides: [{ key: "de", name: "Deutsch" }, { key: "en", name: "Englisch" }],
    units: [],
  },
  {
    id: "nt",
    name: "Natur und Technik",
    sides: [{ key: "q", name: "Frage" }, { key: "a", name: "Antwort" }],
    units: [],
  },
  {
    id: "rzg",
    name: "Räume, Zeiten, Gesellschaften",
    short: "RZG",
    sides: [{ key: "q", name: "Frage" }, { key: "a", name: "Antwort" }],
    units: [],
  },
];
