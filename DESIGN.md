---
name: Französisch Vokabeln
description: A Swiss official examination form, made into a vocabulary trainer.
colors:
  stock: "#dde3da"
  sheet: "#f5f7f2"
  band: "#e9ede5"
  ink: "#141917"
  ink-2: "#46524c"
  ink-3: "#596862"
  rule: "#b6c0b6"
  correction-red: "#a3251c"
  stamp-green: "#14563d"
  stock-dark: "#10130f"
  sheet-dark: "#1b201c"
  band-dark: "#232a24"
  ink-dark: "#e8ede4"
  ink-2-dark: "#a3b0a6"
  ink-3-dark: "#8b9a8f"
  rule-dark: "#3b453d"
  correction-red-dark: "#f08272"
  stamp-green-dark: "#6fce9f"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 10vw, 4.4rem)"
    fontWeight: 600
    lineHeight: 0.94
    letterSpacing: "-0.035em"
  prompt:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2rem, 7.5vw, 3.25rem)"
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  entry:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  lede:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  annotation:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  action:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.16em"
  field-furniture:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.15em"
  apparatus:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "10.5px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.13em"
  tally:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  none: "0"
spacing:
  xs: "4px"
  sm: "10px"
  md: "14px"
  lg: "22px"
  pad: "clamp(20px, 5vw, 46px)"
  section: "clamp(28px, 5vw, 44px)"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    typography: "{typography.field-furniture}"
    rounded: "{rounded.none}"
    padding: "17px 22px"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.stamp-green}"
    textColor: "{colors.sheet}"
  button-primary-disabled:
    backgroundColor: "transparent"
    textColor: "{colors.ink-3}"
  button-ghost-wide:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.field-furniture}"
    rounded: "{rounded.none}"
    padding: "15px 22px"
    width: "100%"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.none}"
    size: "32px"
  form-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "13px 12px 13px 10px"
  form-row-checked:
    backgroundColor: "rgba(20, 86, 61, 0.08)"
    textColor: "{colors.ink}"
  answer-rule:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "9px 2px"
    width: "100%"
  choice-row:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "15px 16px"
  choice-row-correct:
    backgroundColor: "rgba(20, 86, 61, 0.08)"
    textColor: "{colors.ink}"
  choice-row-wrong:
    backgroundColor: "rgba(163, 37, 28, 0.08)"
    textColor: "{colors.ink}"
---

# Design System: Französisch Vokabeln

## Overview

The surface is a Swiss official examination form — a *Prüfungsblatt* — turned
into a vocabulary trainer. A single sheet of cool grey-green form stock sits on a
darker desk, with registration crop marks in the margin and a document number in
the header. Everything on it is either printed apparatus (hairline rules, tracked
uppercase field labels, tabular numerals) or answer content (large, plain,
unadorned). Nothing is a card.

The world exists to make one thing true: being wrong is routine clerical
business, not a penalty. The trainer's own loop already requeues a missed word
three to ten positions later, so the design frames each item as a form field you
fill, correct, and move past. Grading marks are made in exactly two inks — a
correction red and a stamp green — laid over an otherwise black-and-paper page.
The points rail fills in your favour as the deck empties.

The scene is a fifteen-year-old at 22:00 the evening before a French test, on a
laptop at a desk, or a classmate on a phone on the tram. That scene, not the
category, picks the light: the sheet is paper by day and the same sheet under a
low desk lamp at night.

## Colors

The strategy is restrained: a neutral paper-and-ink ground, plus exactly two
functional inks that appear only when the sheet is being corrected.

- **stock** is the desk the sheet lies on. **sheet** is the form itself. **band**
  is the tint that marks a filled-in row.
- **ink**, **ink-2**, and **ink-3** are the printing blacks: content, secondary
  prose, and form furniture. All three are tinted from the stock's green-grey
  hue — never a neutral gray on a tinted surface.
- **correction-red** is the pen. It marks a wrong answer, ticks a checkbox, sets
  the caret, and draws every focus ring. It never becomes a background for a
  large area and never decorates.
- **stamp-green** is the official ink. It fills the points rail, marks a right
  answer, prints the streak, and is the only hover state the primary control has.
- **rule** is the hairline. Structural rules are 1.5px in **ink**; separating
  rules inside a group are 1px in **rule**.

Dark mode is a token swap, not a second design: the same sheet under lamplight.
Every pairing clears WCAG AA in both schemes — form furniture at 10–11px sits at
4.9:1 or better on every surface it lands on, including the hovered band.

## Typography

Two faces, both self-hosted, both variable, subsetted to latin and latin-ext.

- **Archivo** carries everything the reader reads: the display title, the prompt
  word, body prose, and the tracked uppercase field labels. It is a workhorse
  grotesk, which is the authentic voice of the form, not a compromise.
- **JetBrains Mono** carries only the numeric and clerical apparatus: the
  document number, the progress tally, the streak, the option letters A–D, the
  field notes, and the result figures. Monospace here is measurement, not costume.

The ramp has ten steps and nothing sits between them: display
(clamp 2.6–4.4rem), prompt (clamp 2–3.25rem), tally 1.5rem, entry 1.375rem, lede
and option rows 1.0625rem, body 1rem, annotation 0.9375rem, action 12px, field
furniture 11px, apparatus 10.5px. A new size is a new documented role or it is a
mistake.

Everything numeric uses `font-variant-numeric: tabular-nums`, so `9 / 28` and
`19 / 28` occupy identical width. Display tracking floors at -0.035em; the largest
display size is 4.4rem. Prose measure is capped — the lede at 38ch, the example
annotation at 62ch.

## Layout

One column, one sheet, `max-width: 48rem`, centered on the stock ground. All three
screens (start, quiz, result) share the sheet's header rule and footer rule, so
switching screens reads as turning to the next part of the same document.

Rhythm follows form logic: a field head sits on a 1.5px rule with its rows packed
tight beneath it, and `clamp(28px, 5vw, 44px)` separates one field from the next.
Space above a heading always exceeds the space below it.

Below 560px the sheet goes full-bleed (side and top borders drop, crop marks
hide, the document subject is elided from the header) and the quiz screen gets
`min-height: 56dvh` with the item block pushed to the bottom — the answer control
lands under the thumb. `100dvh` is used throughout; `100vh` is never used.

## Elevation & Depth

Depth is nearly absent by intent: this is a sheet of paper on a desk, not a stack
of surfaces. The sheet carries one shadow with a real offset and a soft blur,
tinted to the stock's hue rather than pure black. Nothing else in the system is
elevated. Grouping is done with rules and negative space.

## Shapes

Radius is zero everywhere, without exception — sheet, buttons, checkboxes,
option boxes, input, points rail. A form has no rounded corners. Interactive
squares are 19–22px with a 1.5px border. The only curves on the page are in the
letterforms and in the drawn correction marks.

## Components

- **Form field.** A numbered box, a tracked uppercase heading, and a right-aligned
  mono note ("Mehrfachwahl", "Eine Angabe") sitting on a 1.5px rule, followed by
  hairline-separated rows.
- **Option row.** A 19px square control plus a label. Checkboxes are *ticked* — a
  hand-drawn check in correction red. Radios are *filled* — a solid ink square.
  A chosen row takes the green wash and bolds its label.
- **Points rail.** A bordered 12px track overlaid with an 11px repeating hairline
  tick pattern, filling in stamp green, with the `12 / 28` tally in mono beside it.
- **Answer rule.** The write-mode input is not a box: no border but a 1.5px
  baseline in ink, which thickens to correction red on focus. The caret is red.
- **Choice list.** A bordered block of rows, each prefixed by a CSS-counter box
  reading A–D. On resolution the correct row's box fills green and the wrongly
  picked row's box fills red.
- **Correction block.** A 1.5px rule, then a drawn mark stamped off-register at
  -5°, the verdict line in its ink, the solution large, and the example sentence
  as small-print annotation.
- **Result slip.** A ruled table of label-against-figure rows, figures in mono at
  1.5rem, tabular.

Icons are authored SVG with square caps and miter joins: 2px stroke for interface
chrome, 2.6px for correction marks (they are pen strokes, not UI). No glyph or
emoji ever stands in for an icon.

Browser surfaces are themed, not defaulted: text selection is stamp green on
sheet, the caret is correction red, the scrollbar takes ink-3 on stock, and
`:focus-visible` draws a 2px correction-red ring at 3px offset everywhere.

## Motion

One authored moment, and only one: when an item resolves, the correction mark
lands. It scales down from 1.55, rotates from -11° to its resting -5°, and its
ink sets from a 3px blur to sharp over 460ms on `cubic-bezier(0.16, 1, 0.3, 1)`.
Every other transition is a 140ms state change on background, border, or colour.
The points rail advances over 460ms on the same curve. All motion collapses under
`prefers-reduced-motion: reduce`.

## Do's and Don'ts

- **Do** treat every new control as a piece of printed form apparatus: a rule, a
  square, a tracked label, a tabular figure.
- **Do** keep radius at zero and reach for a rule or negative space when you want
  to group things.
- **Do** tint any new secondary text from the stock hue, and check it at 4.5:1
  against `sheet`, `band`, and the two washes.
- **Do** add new numerals in JetBrains Mono with tabular figures.
- **Don't** introduce a third colour. Red is the pen, green is the stamp; that is
  the whole palette.
- **Don't** add a card, a soft shadow, a gradient, or a pill.
- **Don't** add a second animated moment. The correction stamp is the only one.
- **Don't** use monospace for prose, or Archivo for a tally.
- **Don't** put a kicker or eyebrow above a heading. Field numbers sit *inline*
  with their heading because a form's fill order is real information.
- **Don't** warm the paper toward cream. The stock is deliberately cool.

## Assets

- `public/favicon.svg` — authored by hand on a 64-unit grid in this world's
  palette: a full-bleed `sheet` field, an `ink` form square stroked at 5 units,
  and one `red` correction tick stroked at 9 with square caps. No other artwork
  exists in the project.
- `public/apple-touch-icon.png` — 180×180, 8-bit truecolour, no alpha. It is a
  headless-Chrome render of `public/favicon.svg` at 180×180 and nothing else; it
  carries no marks the SVG does not. It is the only raster in the repository.
  Regenerate it from the SVG rather than editing the PNG.
