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

// Adjektiv (Steigerung): "Marie est ___ que Paul." mit − (moins), + (plus), = (aussi) und einem Adjektiv.
// Gefragt wird die Lücke (z. B. "moins grande"); weiblich, wenn die erste Person weiblich ist.
// fixed = Richtung ist immer Aufgabe → Lösung, label = Titel der Karte, wrong = falsche Auswahl bei "Auswählen".
// Neue Französisch-Units mit frUnit(...) anlegen, dann ist der Teil "Adjektiv" automatisch dabei.
const ADJEKTIV = (() => {
  const SYM = ["−", "+", "="];
  const WORD = { "−": "moins", "+": "plus", "=": "aussi" };
  // [männlich, weiblich, deutsch]
  const ADJ = [
    ["grand", "grande", "gross"],
    ["petit", "petite", "klein"],
    ["intelligent", "intelligente", "intelligent"],
    ["sportif", "sportive", "sportlich"],
    ["gentil", "gentille", "nett"],
    ["fort", "forte", "stark"],
    ["rapide", "rapide", "schnell"],
    ["drôle", "drôle", "lustig"],
    ["content", "contente", "zufrieden"],
    ["patient", "patiente", "geduldig"],
    ["heureux", "heureuse", "glücklich"],
    ["timide", "timide", "schüchtern"],
    ["sympa", "sympa", "sympathisch"],
    ["lent", "lente", "langsam"],
    ["jeune", "jeune", "jung"],
    ["beau", "belle", "schön"],
    ["vieux", "vieille", "alt"],
    ["sérieux", "sérieuse", "ernst"],
    ["courageux", "courageuse", "mutig"],
    ["paresseux", "paresseuse", "faul"],
    ["curieux", "curieuse", "neugierig"],
    ["actif", "active", "aktiv"],
    ["cher", "chère", "teuer"],
    ["nouveau", "nouvelle", "neu"],
    ["mignon", "mignonne", "süss"],
];
  const FEM = ["Marie", "Julie", "Sophie", "Léa", "Emma", "Camille", "Laura", "Anna", "ma sœur", "ma cousine", "la prof", "ma mère"];
  const MAS = ["Paul", "Marc", "Luc", "Thomas", "Hugo", "Nathan", "Louis", "Max", "mon frère", "mon cousin", "le prof", "mon père"];
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const out = [];
  for (let i = 0; i < 50; i++) {
    const [m, w, g] = ADJ[i % ADJ.length];
    const sym = SYM[(i + Math.floor(i / ADJ.length)) % 3];
    const female = i % 2 === 0;
    const a = (female ? FEM : MAS)[(i * 5) % 12];
    const b = (i % 4 < 2 ? MAS : FEM)[(i * 7 + 3) % 12];
    const adj = female ? w : m;
    const answer = WORD[sym] + " " + adj;
    const wrong = SYM.filter((k) => k !== sym).map((k) => WORD[k] + " " + adj);
    if (m !== w) wrong.push(WORD[sym] + " " + (female ? m : w));
    out.push({
      set: "Adjektiv",
      fr: answer,
      de: cap(a) + " est ___ que " + b + ".\n[ " + sym + " ]   " + m,
      base: cap(a) + " est ___ que " + b + ".",
      sym: sym,
      hint: { fr: m, de: g },
      example: cap(a) + " est " + answer + " que " + b + ".",
      fixed: "forward",
      label: "Setze ein",
      wrong: wrong,
    });
  }
  return out;
})();

const frUnit = (id, name, entries) => ({ id, name, entries: entries.concat(ADJEKTIV) });

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
