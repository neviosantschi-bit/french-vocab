# Design

Jedes Fach ist ein farbiger Ordner, wie im Schulzimmer.

## Idee

- **Startseite:** Die Fächer sind Farbbänder, die zusammen den ganzen Bildschirm
  füllen. Mit der Maus über ein Band fahren: Es wird grösser und die Schrift
  zieht sich in die Breite. Antippen: Das Band wächst über den ganzen
  Bildschirm und wird zur Seite des Fachs.
- **Im Fach:** Units, Einstellungen, Quiz und Auswertung liegen ganz in der
  Farbe des Fachs. Die Auflösung im Quiz schiebt sich als Blatt Papier von
  unten ins Bild.
- **Mutig ist nur die Schrift.** Anybody ist eine Variable Font mit Breitenachse;
  Titel und Knöpfe ziehen sich bei Hover in die Breite. Alles andere bleibt
  ruhig: Pillen, Linien, keine Schatten ausser beim Antwortblatt.

## Farben

| Fach | Ordner `--c` | Schrift `--on` |
| --- | --- | --- |
| Französisch | `#dd8a4a` | `#191c3d` |
| Englisch | `#b8493c` | `#ffffff` |
| Deutsch | `#ecc654` | `#191c3d` |
| Mathematik | `#3d56b0` | `#ffffff` |
| Natur und Technik | `#2d7656` | `#ffffff` |
| RZG | `#4f9a72` | `#191c3d` |

Jedes Fach hat sein eigenes dünnes Linienmuster (SVG in `public/patterns/`, als Maske in der
Schriftfarbe): Französisch Wellenringe, Englisch Wellen, Deutsch Schuppen, Mathe Ellipsen,
NT Höhenlinien, RZG Spirale. Nur auf den Fachseiten, nicht auf der Startseite.

Papier `#f4f5fa`, Tinte `#191c3d` (im Dunkelmodus vertauscht).
Neues Fach: Farbe in `src/style.css` unter `[data-subject="…"]` eintragen.

## Schrift

- **Anybody** (variabel, Breite 50–150 %): Fachnamen, Titel, Quizfrage, Knöpfe.
- **Atkinson Hyperlegible**: Fliesstext, Antworten, Einstellungen. Gut lesbar,
  auch für Leseschwache.

Beide werden über Fontsource mitgebündelt, keine Anfragen an Google.

## Regeln

- Keine Grossbuchstaben-Etiketten, keine Monospace-Schrift.
- Beschriftungen als Fragen in normaler Schreibweise ("Was willst du üben?").
- Bewegung nur als Antwort auf eine Aktion; `prefers-reduced-motion` schaltet
  sie ab.

## Konto und Profil

- Startseite: Pille oben rechts ("Anmelden" oder der Benutzername). Angemeldet zeigen Bänder und
  Unit-Zeilen einen Balken, wie gut die Wörter sitzen, plus "x% gelernt".
- Jedes Wort hat einen Zustand aus seinen letzten Antworten (`public/progress.js`):
  neu (leer), falsch (rot), wackelig (gelb), richtig (blau), sitzt (dunkelgrün).
  "% gelernt" = Mittel der Wörter (neu 0, falsch 0, wackelig 0,35, richtig 0,7, sitzt 1).
- Profil = Zeugnis: pro Fach ein Blatt in der Fachfarbe mit grosser Prozentzahl, Balken, Legende mit
  Anzahl pro Zustand, Balken pro Objectif, fertige Runden, "Das fällt dir schwer" und "Schwache Wörter üben".
  Darüber 14 Punkte für die letzten Tage. Gewählt wird die Unit; sie folgt der Unit, die man zuletzt übt.
- Eine Runde zählt nur, wenn sie zu Ende gespielt wurde (keine Abbrüche, keine Wiederholungs- oder
  Schwache-Wörter-Runden).
- Anmelden: eine Karte auf Papier, zwei Felder, kleiner Umschalter zu "Konto erstellen". Wer ohne Konto
  eine Runde startet, wird einmal pro Sitzung gefragt, ob er sich anmelden will.
