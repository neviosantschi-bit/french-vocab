// Alle Fächer der Klasse. Nur Daten.
//
// short = kurzer Name für das Farbband auf der Startseite (optional)
// Die Farbe jedes Fachs steht in src/style.css unter [data-subject="…"].
// sides = die zwei Spalten einer Karteikarte: key ist das Feld im Eintrag,
//         name die Beschriftung. Abgefragt wird immer eine Seite gegen die andere.
// units = Units (Prüfungsstoff) des Fachs. Jede Unit hat eine Liste von
//         Einträgen; das Feld "set" teilt eine Unit in Teile (z. B. Objectif 1).
//
// game  = Unit, die ein Lernspiel öffnet (z. B. "kraefte" = public/kraefte/).
// files = Unit ohne Karten, nur Downloads: [{ name, note, href }] (PDFs in public/downloads).
//         Eine Unit ohne Karten und ohne Dateien zeigt "Noch leer" und zählt nicht.
//
// Neue Unit: eigene Datei in public/ anlegen, in index.html vor subjects.js
// laden und hier unter "units" eintragen.

const SUBJECTS = [
  {
    id: "franzoesisch",
    name: "Französisch",
    sides: [{ key: "de", name: "Deutsch" }, { key: "fr", name: "Französisch" }],
    units: [
      { id: "fr-1", name: "Unit 1", entries: FRANZOESISCH_UNIT_1 },
      { id: "fr-2", name: "Unit 2", entries: FRANZOESISCH_UNIT_2 },
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
      // game = Lernspiel: öffnet das Spiel in public/kraefte/ statt Karten oder Dateien.
      { id: "nt-kraefte", name: "Kräfte", game: "kraefte" },
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
