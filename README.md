# Lernblatt

Lerntrainer für die ganze Klasse: Fach wählen, Unit wählen, üben. Kein Backend, kein Konto — Einstellungen liegen
im `localStorage` des Geräts.

## Lokal starten

```
npm install
npm run dev      # http://localhost:5173
```

## Bauen

```
npm run build    # statische Ausgabe in dist/
npm run preview  # den Build lokal prüfen
```

## Deployen (Vercel)

Vercel erkennt Vite automatisch: Framework `Vite`, Build `npm run build`,
Output `dist`. Es ist keine weitere Konfiguration nötig.

## Aufbau

- `index.html` — Markup aller Bildschirme (Fach, Unit, Runde, Quiz, Ende),
  plus der Direction-Contract.
- `src/style.css` — das gesamte visuelle System (Farbordner, siehe `DESIGN.md`).
- `public/subjects.js` — alle Fächer und ihre Units. Nur Daten.
- `public/franzoesisch-unit-1.js` — die 103 Französisch-Vokabeln (Unit …).
- `public/app.js` — die gesamte Logik: Auswahl, Bewertung, Wiedervorlage,
  Auswertung. Wird bewusst als klassisches Skript geladen und nicht gebündelt.

## Neue Unit hinzufügen

1. Neue Datei anlegen, z. B. `public/franzoesisch-unit-2.js`, mit
   `const FRANZOESISCH_UNIT_2 = [ { set: "...", fr: "...", de: "..." }, ... ];`
2. In `index.html` vor `subjects.js` laden.
3. In `public/subjects.js` beim Fach unter `units` eintragen:
   `{ id: "fr-2", name: "Unit 2", entries: FRANZOESISCH_UNIT_2 }`

Fächer ohne Sprachpaar (Mathe, NT, RZG, Deutsch) nutzen die Felder `q`
(Frage) und `a` (Antwort). Design und Logik bleiben dabei unberührt.
# french-vocab
