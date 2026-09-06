# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

The current implementation is plain HTML/CSS/JS with no build step. The user has lifted the
single-folder constraint and asked for `npm run dev` on localhost plus possible Vercel deploy.
Framework choice was delegated.

Chosen: **Vite (vanilla template)**. Rationale: it gives `npm run dev` and a Vercel-ready static
build with zero config, while leaving the existing vanilla `app.js` quiz logic running unchanged —
which matters because this round is a visual replacement only. A component framework would force a
rewrite of working logic for no product gain.

## Users

- **Primary:** the author, a Swiss secondary-school student, studying on a laptop.
- **Secondary:** classmates from the same French class, who would mostly use it on phones.

Job to be done: drill the class's Objectif 1–3 French vocabulary until it sticks, in short sessions
before a test. No accounts, no teacher, no sharing of results.

## Product Purpose

Practice recall of French↔German vocabulary from this specific class word list, repeating the words
that are not yet known. A round succeeds when every word in the selected sets has been answered
correctly at least once; words answered wrong come back later in the same round.

## Positioning

The content is the class's own photographed vocabulary sheet, transcribed with its exact accepted
spellings and its original example sentences. A general-purpose vocabulary app cannot have this
list, and a generic French course does not match what the test asks for.

## Operating Context

Short, self-directed study sessions. Laptop at a desk for the author (keyboard-driven, Enter to
advance); phones for classmates, likely in transit or between lessons. No login, no sync, no
network dependency during a round. Settings persist locally between sessions.

## Capabilities and Constraints

Confirmed functionality that must survive this redesign unchanged:

- **Content:** 103 entries across three sets — Objectif 1 (28), Objectif 2 (37), Objectif 3 (38).
  43 entries carry an example sentence; 32 carry alternative accepted spellings.
- **Direction:** de→fr, fr→de, or mixed (random per question).
- **Modes:** Schreiben (type the answer), Auswählen (four choices), Aufdecken (self-assess).
- **Grading:** whitespace, apostrophes and trailing punctuation are normalised; accents and case are
  significant. Result is `good` (exact), `near` (case differs only), or `bad`. Parenthesised
  variants and comma-separated synonym lists each count as acceptable answers.
- **Repetition:** a wrong answer requeues the word 3–10 positions later, never immediately.
- **Session state:** progress count, current streak, best streak, per-word retry tally.
- **End of round:** four-stat summary plus an optional "retry only the hard ones" round.
- **Persistence:** chosen sets, direction and mode in `localStorage`; failures ignored silently.
- **Language:** the interface is German, in Swiss orthography (`ss`, never `ß`).
- No backend, no accounts, no analytics. Vocabulary is fixed data, not user-editable.

## Brand Commitments

None. There is no existing name, logo, palette, typeface, or reference the user made binding; asked
directly, they left the visual direction open. The German interface copy is existing product truth
and is preserved unless a change is proposed explicitly.

## Evidence on Hand

- `words.js` — the 103 real vocabulary entries with real example sentences, transcribed from photos
  of the class list. This is the only content asset.
- There are no users beyond the author and their classmates, no usage numbers, no testimonials, no
  screenshots, no logo, and no launch. Future work must not invent any of these.

## Product Principles

1. **The word is the interface.** Whatever surrounds it, the prompt and the answer are what the
   student is actually looking at; nothing may compete with them for attention.
2. **A round is short and finishable.** The design serves a ten-minute session that ends in a clear
   result, not open-ended study.
3. **Being wrong is routine, not a penalty.** Missing a word is the normal path to learning it;
   feedback states the correct answer and moves on without drama.
4. **Two hands or one thumb.** The author drives it entirely from the keyboard; classmates drive it
   with one thumb on a phone. Both are first-class, neither is an adaptation of the other.
5. **Nothing to set up.** No account, no sync, no network. It opens and it works.

## Accessibility & Inclusion

No formal standard was specified. Product-specific needs that follow from the above: full keyboard
operation including Enter-to-advance, touch targets usable one-handed on a phone, and text contrast
that survives a laptop screen at a bad angle in a classroom.
