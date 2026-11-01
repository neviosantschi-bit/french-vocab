# Design

Karteikarte: Jedes Fach ist ein farbiger Ordner, darin liegt Papier.

## Idee

- **Startseite:** Die Fächer stecken wie Ordner in einer Schublade. Jeder hat einen
  Reiter an einer anderen Stelle, im Reiter steht der Zähler ("2 Units", "Noch leer").
  Mit der Maus über einen Ordner fahren: Er hebt sich, wird grösser und die Schrift
  zieht sich in die Breite. Antippen: Der Ordner wächst über den ganzen Bildschirm.
- **Im Fach:** Der Hintergrund ist die Fachfarbe mit dem Linienmuster des Fachs.
  Units, Einstellungen und das Ergebnis liegen als helles Blatt darauf, liniert
  und mit rotem Rand wie Schulpapier. Auswahl-Knöpfe nehmen die Fachfarbe.
- **Quiz:** Die Frage steht auf einer Karteikarte (Lineatur, roter Rand) mit zwei
  Karten dahinter. Die nächste Karte wird aufgelegt. Die Auflösung schiebt sich als
  Blatt von unten ins Bild, mit einem Streifen in Grün, Gelb oder Rot.
- **Profil:** Jedes Fach ist ein Ordner mit Reiter. Darin liegt ein Blatt mit den
  Objectifs und den schwierigen Wörtern.
- **Mutig ist nur die Schrift und die Karte.** Anybody ist eine Variable Font mit
  Breitenachse; Titel und Knöpfe ziehen sich bei Hover in die Breite. Alles andere
  bleibt ruhig: Pillen, weiche Schatten, keine Verläufe.
- Das Papier bleibt in Hell und Dunkel hell, es ist ein Gegenstand auf dem Tisch.
  Nur der Tisch (Startseite, Profil, Anmelden) wechselt.

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

Tisch `#f4f5fa`, Tinte `#191c3d` (im Dunkelmodus vertauscht). Blatt `#fcfcfe`, Linien `#d6ddee`, roter Rand `#ef9f97`.
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

## Bewegung

- Alles Sanfte ist CSS: Bildschirme gleiten herein, Titel schieben sich von unten ins Bild,
  Zeilen und Karten kommen gestaffelt, die Ordner schieben sich in die Schublade, die Zahlen im
  Ergebnis poppen auf. Knöpfe federn beim Hover (`--spring`) und drücken sich knackig ein.
- `public/fx.js` macht den Rest und ist nur Darstellung:
  Knöpfe rücken höchstens 7 px zum Zeiger, die Buchstaben von "Lernblatt" heben sich wie eine
  Welle unter dem Zeiger, eine kleine Karte folgt dem Zeiger über Ordnern (Name, Zähler, % gelernt)
  und Unit-Zeilen (ein zufälliges Wort als Vorschau), und die Quizkarte neigt sich bis 4° zum Zeiger.
- Eine einzige Animationsschleife, die schläft, wenn nichts mehr in Bewegung ist.
  Aus bei "weniger Bewegung" und auf Touchgeräten.
- Tab-Symbol: eine weisse Karteikarte auf Marineblau, nur zwei flache Farben.
