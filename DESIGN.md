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
| Französisch | `#2b4fe0` | `#ffffff` |
| Mathematik | `#c93424` | `#ffffff` |
| Deutsch | `#f4c431` | `#191c3d` |
| Englisch | `#7445d9` | `#ffffff` |
| Natur und Technik | `#127a48` | `#ffffff` |
| RZG | `#f08a3c` | `#191c3d` |

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
