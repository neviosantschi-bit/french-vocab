# Lernblatt

Lerntrainer für die ganze Klasse: Fach wählen, Unit wählen, üben, dazu ein gemeinsamer Testkalender.
Ohne Datenbank (`src/config.js` leer) liegen Konto, Lernstand und Einstellungen nur im `localStorage` des Geräts.
Mit Datenbank (Supabase) gibt es gemeinsame Konten, synchronen Lernstand und die Tests.

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
- `public/franzoesisch-unit-1.js` — die 103 Französisch-Vokabeln (Unit 1).
- `public/franzoesisch-unit-2.js` — die Französisch-Vokabeln von Unit 2.
- `public/auth.js` — Konto nur auf diesem Gerät (Anmelden, Registrieren, Hash mit Salz).
- `public/progress.js` — Lernstand pro Benutzer: Zustand jedes Wortes (neu, falsch, wackelig, richtig, sitzt), fertige Runden, Tage in Folge, schwache Wörter.
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

## Units mit Downloads statt Karten

In `public/subjects.js` kann eine Unit statt `entries` eine Liste `files` haben
(`{ name, note, href }`, PDFs liegen in `public/downloads/`). Eine Unit ganz ohne
Inhalt (z. B. die Englisch-Stufen A2, B1, B1+) zeigt "Noch leer" und zählt nicht
als Unit.

## Datenbank einrichten (Supabase, einmalig)

Die Seite braucht dafür ein **eigenes, neues** Supabase-Projekt (nicht ein bestehendes verwenden).

1. Im Supabase-Dashboard ein neues Projekt anlegen (z. B. "lernblatt").
2. Authentication, Providers, Email: **Confirm email ausschalten** (Konten sind nur Benutzername und Passwort).
3. SQL Editor: den Inhalt von `supabase/schema.sql` einfügen und ausführen. Das Skript legt nur Tabellen,
   Zugriffsregeln und einen Trigger an (kein DROP, kein DELETE).
4. Project Settings, API: **Project URL** und den **anon/publishable Key** in `src/config.js` eintragen.
   Diese beiden Werte sind öffentlich gedacht. Das Datenbank-Passwort und den `service_role` Key nie ins Repo.

Danach: `npm run build` und deployen. Ohne diese Werte läuft die Seite wie vorher, der Tests-Ordner zeigt "Bald".

- `src/cloud.js` — Verbindung (Anmelden, Tests, Lernstand), Benutzername wird in eine erfundene Adresse verpackt.
- `public/tests-data.js` / `public/tests-ui.js` — Tests: Daten und Kalender, Eintragen, Details, "Nächster Test".
- `public/boot.js` — zeigt beim Start den zuletzt besuchten Bildschirm.
