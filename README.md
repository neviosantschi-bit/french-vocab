# Französisch Vokabeln

Vokabeltrainer für Objectif 1–3. Kein Backend, kein Konto — Einstellungen liegen
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

- `index.html` — Markup aller drei Bildschirme, plus der Direction-Contract.
- `src/style.css` — das gesamte visuelle System (Prüfungsblatt).
- `public/words.js` — die 103 Vokabeln. Nur Daten.
- `public/app.js` — die gesamte Logik: Auswahl, Bewertung, Wiedervorlage,
  Auswertung. Wird bewusst als klassisches Skript geladen und nicht gebündelt.

Neue Wörter kommen in `public/words.js`; Design und Logik bleiben unberührt.
# french-vocab
