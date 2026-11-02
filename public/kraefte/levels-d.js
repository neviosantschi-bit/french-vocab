"use strict";

// Kräfte-Spiel, Level 8 bis 10: Experimentierlabor, Begriffs-Terminal, Endboss.

(() => {
  const { h, shuffle, addXp } = KG.util;

  /* =====================================================================
     Level 8: Experimentierlabor
     ===================================================================== */

  const STUFEN = ["Frage", "Vermutung", "Durchführung", "Beobachtung", "Auswertung"];

  // Jedes Experiment: eine Frage, drei Vermutungen (die erste stimmt), Messwerte, Schluss, fairer Test.
  const EXP = [
    {
      id: "feder", name: "Federdehnung", topic: "Kraftwirkung",
      frage: "Wie hängt die Dehnung einer Feder von der Gewichtskraft ab, die an ihr zieht?",
      verm: ["Doppelte Kraft gibt doppelte Dehnung.", "Die Dehnung ist immer gleich gross.", "Mehr Kraft gibt weniger Dehnung."],
      durch: "Ich hänge nacheinander 1, 2 und 3 Massestücke (je 100 g) an die Feder und messe jedes Mal die Dehnung.",
      cols: ["Masse", "Gewichtskraft", "Dehnung"],
      rows: [["100 g", "0.98 N", "2.0 cm"], ["200 g", "1.96 N", "4.0 cm"], ["300 g", "2.94 N", "6.0 cm"]],
      beob: "Die Dehnung wächst gleichmässig: 2.0 cm, 4.0 cm, 6.0 cm.",
      ausw: "Die Dehnung ist proportional zur Gewichtskraft: doppelte Kraft, doppelte Dehnung.",
      schluss: { opts: ["Die Dehnung ist proportional zur Kraft.", "Die Dehnung hängt nicht von der Kraft ab.", "Je grösser die Kraft, desto kleiner die Dehnung."], why: "Die Messwerte 2, 4, 6 cm gehören zu 1, 2, 3 Massestücken. Das ist proportional, solange die Feder elastisch bleibt." },
      fair: { q: "Was muss bei allen Messungen gleich bleiben?", opts: ["Dieselbe Feder", "Die Masse der Gewichte", "Die Dehnung", "Die Gewichtskraft"], why: "Nur die Kraft wird verändert. Alles andere, vor allem die Feder, bleibt gleich. Sonst weiss man nicht, was die Dehnung verursacht." },
    },
    {
      id: "gewicht", name: "Masse und Gewichtskraft", topic: "Gewichtskraft",
      frage: "Ändert sich die Gewichtskraft einer Masse, wenn man sie auf einen anderen Himmelskörper bringt?",
      verm: ["Die Masse bleibt gleich, die Gewichtskraft ändert sich mit dem Ort.", "Der Kraftmesser zeigt überall dasselbe.", "Auf dem Mond zeigt der Kraftmesser mehr als auf der Erde."],
      durch: "Ich hänge eine Masse von 200 g an einen Kraftmesser, auf der Erde, auf dem Mond und auf dem Mars, und lese ihn jedes Mal ab.",
      cols: ["Ort", "Masse", "Kraftmesser"],
      rows: [["Erde (9.81 N/kg)", "0.2 kg", "1.96 N"], ["Mond (1.62 N/kg)", "0.2 kg", "0.32 N"], ["Mars (3.71 N/kg)", "0.2 kg", "0.74 N"]],
      beob: "Die Masse ist immer 0.2 kg. Der Kraftmesser zeigt 1.96 N, 0.32 N und 0.74 N.",
      ausw: "Die Masse bleibt gleich. Die Gewichtskraft hängt vom Ortsfaktor g ab: F = m · g.",
      schluss: { opts: ["Die Masse bleibt gleich, die Gewichtskraft hängt vom Ort ab.", "Die Masse ist auf dem Mond kleiner.", "Die Gewichtskraft ist überall gleich."], why: "0.2 kg · 9.81 N/kg = 1.96 N, aber 0.2 kg · 1.62 N/kg = 0.32 N. Dieselbe Masse, andere Gewichtskraft." },
      fair: { q: "Was bleibt bei diesem Versuch gleich?", opts: ["Die Masse (200 g)", "Der Ort", "Der Ortsfaktor g", "Die Anzeige des Kraftmessers"], why: "Man verändert nur den Ort. Die Masse muss gleich bleiben, sonst wäre der Vergleich nutzlos." },
    },
    {
      id: "reibung", name: "Reibung auf Unterlagen", topic: "Reibung",
      frage: "Hängt die Reibungskraft von der Oberfläche der Unterlage ab?",
      verm: ["Je rauer die Unterlage, desto grösser die Reibungskraft.", "Die Unterlage spielt keine Rolle.", "Je rauer die Unterlage, desto kleiner die Reibungskraft."],
      durch: "Ich ziehe einen Holzklotz (500 g) mit dem Kraftmesser gleichmässig über Glas, Holz und Schmirgelpapier.",
      cols: ["Unterlage", "Zugkraft"],
      rows: [["Glas", "1.0 N"], ["Holz", "2.0 N"], ["Schmirgelpapier", "3.9 N"]],
      beob: "Auf Glas braucht man 1.0 N, auf Holz 2.0 N und auf Schmirgelpapier 3.9 N.",
      ausw: "Je rauer die Unterlage, desto grösser die Gleitreibungskraft.",
      schluss: { opts: ["Je rauer die Unterlage, desto grösser die Reibungskraft.", "Glas hat die grösste Reibung.", "Die Reibung hängt nicht von der Unterlage ab."], why: "Beim gleichmässigen Ziehen ist die Zugkraft so gross wie die Gleitreibungskraft: 1.0 N, 2.0 N, 3.9 N." },
      fair: { q: "Was muss bei allen drei Versuchen gleich bleiben?", opts: ["Derselbe Holzklotz und gleichmässiges Ziehen", "Die Unterlage", "Die Zugkraft", "Die Reibungskraft"], why: "Verändert wird nur die Unterlage. Klotz und Ziehen bleiben gleich, damit der Unterschied wirklich von der Unterlage kommt." },
    },
    {
      id: "parallel", name: "Zwei Kräfte am Ring", topic: "Kräfteparallelogramm",
      frage: "Wie gross ist die resultierende Kraft zweier Kräfte, die im rechten Winkel an einem Ring ziehen?",
      verm: ["Sie ist kleiner als die Summe der Beträge, aber grösser als jede einzelne Kraft.", "Sie ist so gross wie die Summe der beiden Beträge.", "Sie ist so gross wie die grössere der beiden Kräfte."],
      durch: "Zwei Kraftmesser ziehen im rechten Winkel an einem Ring. Ein dritter Kraftmesser hält den Ring in Ruhe. Ich lese ihn ab.",
      cols: ["F₁", "F₂", "Dritter Kraftmesser"],
      rows: [["3 N", "4 N", "5.0 N"], ["6 N", "8 N", "10.0 N"], ["3 N", "3 N", "4.2 N"]],
      beob: "Bei 3 N und 4 N zeigt der dritte Kraftmesser 5.0 N, nicht 7 N.",
      ausw: "Im rechten Winkel ist die Resultierende die Diagonale des Kräfteparallelogramms, √(F₁² + F₂²).",
      schluss: { opts: ["Die Resultierende ist die Diagonale im Kräfteparallelogramm und kleiner als F₁ + F₂.", "Man addiert einfach die Beträge: 3 N + 4 N = 7 N.", "Die Resultierende ist immer 0 N."], why: "3 N und 4 N im rechten Winkel ergeben 5 N: Die Beträge dürfen nur bei gleicher Richtung addiert werden." },
      fair: { q: "Was muss in allen Messungen gleich bleiben?", opts: ["Der Winkel von 90° zwischen den Kräften", "Die Beträge der Kräfte", "Die Anzeige des dritten Kraftmessers", "Die Richtung der Gegenkraft"], why: "Man verändert die Beträge, nicht den Winkel. So sieht man, wie der Betrag der Resultierenden von ihnen abhängt." },
    },
    {
      id: "hebel", name: "Hebel im Gleichgewicht", topic: "Hebelgesetz",
      frage: "Wie hängen Kraft und Abstand zum Drehpunkt am Hebel zusammen?",
      verm: ["Je weiter aussen die Kraft angreift, desto kleiner muss sie sein.", "Der Abstand spielt keine Rolle.", "Je weiter aussen die Kraft angreift, desto grösser muss sie sein."],
      durch: "Links hängen 4 N im Abstand 20 cm. Rechts hänge ich Gewichte in 10, 20 und 40 cm Abstand an, bis der Hebel im Gleichgewicht ist.",
      cols: ["Abstand rechts", "Nötige Kraft", "Kraft · Abstand"],
      rows: [["10 cm", "8 N", "80 N·cm"], ["20 cm", "4 N", "80 N·cm"], ["40 cm", "2 N", "80 N·cm"]],
      beob: "Die nötige Kraft sinkt von 8 N auf 2 N. Kraft mal Abstand ist immer 80 N·cm.",
      ausw: "Es gilt das Hebelgesetz: F₁ · a₁ = F₂ · a₂.",
      schluss: { opts: ["Kraft mal Kraftarm ist auf beiden Seiten gleich: F₁ · a₁ = F₂ · a₂.", "Die Kraft ist unabhängig vom Abstand.", "Kraft geteilt durch Abstand ist konstant."], why: "8 N · 10 cm = 4 N · 20 cm = 2 N · 40 cm = 80 N·cm. Das Produkt bleibt gleich." },
      fair: { q: "Was bleibt bei allen Messungen gleich?", opts: ["Das Gewicht links und sein Abstand (4 N bei 20 cm)", "Der Abstand rechts", "Die Kraft rechts", "Die Neigung des Hebels"], why: "Die linke Seite ist der feste Bezugspunkt. Man verändert nur den Abstand rechts und sucht die passende Kraft." },
    },
    {
      id: "flaschen", name: "Flaschenzug", topic: "Kraft und Weg",
      frage: "Wie verändern tragende Seilstücke die Zugkraft und den Seilweg?",
      verm: ["Mehr tragende Seilstücke: weniger Zugkraft, aber mehr Seil.", "Mehr tragende Seilstücke: mehr Zugkraft.", "Die Zahl der Seilstücke ändert nichts."],
      durch: "Ich hebe eine Last von 120 N um 1 m, mit 1, 2 und 4 tragenden Seilstücken, und messe Zugkraft und gezogenes Seil.",
      cols: ["Seilstücke", "Zugkraft", "Seil gezogen"],
      rows: [["1", "120 N", "1 m"], ["2", "60 N", "2 m"], ["4", "30 N", "4 m"]],
      beob: "Mit 4 Seilstücken genügen 30 N statt 120 N, aber ich ziehe 4 m Seil statt 1 m.",
      ausw: "Zugkraft = Last : Anzahl der Seilstücke. Man spart Kraft und braucht dafür mehr Weg: Goldene Regel der Mechanik.",
      schluss: { opts: ["Weniger Kraft, dafür mehr Seilweg: Kraft mal Weg bleibt gleich.", "Weniger Kraft und weniger Weg.", "Mehr Kraft und mehr Weg."], why: "120 N · 1 m = 60 N · 2 m = 30 N · 4 m = 120 N·m. Das ist die Goldene Regel der Mechanik." },
      fair: { q: "Was bleibt bei allen Messungen gleich?", opts: ["Die Last (120 N) und die Hubhöhe (1 m)", "Die Zugkraft", "Der Seilweg", "Die Zahl der Seilstücke"], why: "Man verändert nur die Zahl der tragenden Seilstücke. Last und Hub bleiben gleich, damit die Ergebnisse vergleichbar sind." },
    },
    {
      id: "ebene", name: "Schiefe Ebene", topic: "Kraft und Weg",
      frage: "Wie verändert die Länge einer Rampe die nötige Kraft?",
      verm: ["Je länger die Rampe (bei gleicher Höhe), desto kleiner die Kraft.", "Je länger die Rampe, desto grösser die Kraft.", "Die Länge der Rampe spielt keine Rolle."],
      durch: "Ich ziehe einen Wagen (10 N) auf 20 cm Höhe, über Rampen von 40, 60 und 80 cm Länge, und messe die Kraft.",
      cols: ["Länge der Rampe", "Kraft"],
      rows: [["40 cm", "5.0 N"], ["60 cm", "3.3 N"], ["80 cm", "2.5 N"]],
      beob: "Je länger die Rampe, desto kleiner die Kraft: 5.0 N, 3.3 N, 2.5 N.",
      ausw: "F = F_G · h : l. Eine längere Rampe braucht weniger Kraft, dafür ist der Weg länger.",
      schluss: { opts: ["Längere Rampe: weniger Kraft, aber längerer Weg.", "Längere Rampe: mehr Kraft.", "Die Rampe verändert die Kraft nicht."], why: "10 N · 20 cm : 40 cm = 5 N, aber 10 N · 20 cm : 80 cm = 2.5 N. Die Höhe bleibt gleich, nur die Länge ändert sich." },
      fair: { q: "Was muss gleich bleiben?", opts: ["Der Wagen und die Höhe von 20 cm", "Die Länge der Rampe", "Die Kraft", "Der Winkel der Rampe"], why: "Nur die Länge der Rampe wird verändert. Wagen und Höhe bleiben gleich." },
    },
  ];

  // Die fünf Schritte tippend in die richtige Reihenfolge bringen.
  function ordnen(ctx, E) {
    return new Promise((resolve) => {
      const texts = {
        Frage: E.frage,
        Vermutung: "Ich vermute: " + E.verm[0],
        Durchführung: E.durch,
        Beobachtung: E.beob,
        Auswertung: E.ausw,
      };
      let pool = shuffle(STUFEN);
      const slots = [null, null, null, null, null];
      let tries = 0;
      const poolBox = h("div", { class: "ord-pool" });
      const slotBox = h("ol", { class: "ord-slots" });
      const msg = h("div", { class: "kg-fb hidden", role: "status" });
      const check = h("button", { class: "kg-go", type: "button", text: "Prüfen", disabled: true });

      function render() {
        poolBox.replaceChildren(
          ...pool.map((k) => {
            const b = h("button", { class: "ord-card", type: "button" }, h("b", { text: k }), h("span", { text: texts[k] }));
            b.addEventListener("click", () => {
              const i = slots.indexOf(null);
              if (i < 0) return;
              slots[i] = k;
              pool = pool.filter((x) => x !== k);
              msg.className = "kg-fb hidden";
              render();
            });
            return b;
          })
        );
        slotBox.replaceChildren(
          ...slots.map((k, i) => {
            const li = h("li", { class: "ord-slot" + (k ? " filled" : "") });
            if (k) {
              const b = h("button", { class: "ord-card placed", type: "button", "aria-label": "Zurücklegen: " + k }, h("b", { text: k }), h("span", { text: texts[k] }));
              b.addEventListener("click", () => {
                slots[i] = null;
                pool.push(k);
                msg.className = "kg-fb hidden";
                render();
              });
              li.append(b);
            } else li.append(h("span", { class: "ord-empty", text: "Schritt " + (i + 1) }));
            return li;
          })
        );
        check.disabled = slots.includes(null);
      }

      check.addEventListener("click", () => {
        tries += 1;
        const wrong = slots.map((k, i) => (k === STUFEN[i] ? -1 : i)).filter((i) => i >= 0);
        if (!wrong.length) {
          addXp(tries === 1 ? 15 : 6);
          check.remove();
          msg.className = "kg-fb ok";
          msg.replaceChildren(h("p", { class: "kg-fb-h", text: "Richtige Reihenfolge" }), h("p", { class: "kg-fb-w", text: "Frage → Vermutung → Durchführung → Beobachtung → Auswertung. Erst fragt man, dann vermutet man, dann probiert man es aus, dann hält man fest, was man sieht, und erst am Schluss zieht man den Schluss." }),
            h("button", { class: "kg-go", type: "button", text: "Weiter zum Versuch", onclick: resolve }));
          slotBox.querySelectorAll(".ord-card").forEach((c) => (c.disabled = true));
          return;
        }
        KG.util.addReview({ t: "mc", q: "Welcher Schritt kommt im Experimentierprozess zuerst: „" + STUFEN[0] + "“ oder „" + STUFEN[4] + "“?", opts: [STUFEN[0], STUFEN[4]], a: 0, why: "Die Reihenfolge ist: " + STUFEN.join(", ") + "." });
        msg.className = "kg-fb bad";
        const first = wrong[0];
        msg.replaceChildren(h("p", { class: "kg-fb-h", text: "Noch nicht ganz" }), h("p", { class: "kg-fb-w", text: "An Platz " + (first + 1) + " gehört ein anderer Schritt. Denk daran: Erst die Frage, dann die Vermutung. Man vermutet, bevor man misst, und wertet erst aus, wenn man etwas beobachtet hat." }));
        slotBox.querySelectorAll(".ord-slot").forEach((li, i) => li.classList.toggle("bad", wrong.includes(i)));
      });
      render();
      ctx.show(h("div", { class: "kg-card" },
        h("p", { class: "kg-tag", text: "Experiment: " + E.name }),
        h("p", { class: "kg-q", text: "Bringe die Schritte in die richtige Reihenfolge." }),
        h("p", { class: "kg-hint", text: "Tippe die Schritte der Reihe nach an. Tippe einen gesetzten Schritt an, um ihn zurückzulegen." }),
        h("div", { class: "ord-grid" }, h("div", {}, h("p", { class: "kg-ctl-l", text: "Meine Reihenfolge" }), slotBox), h("div", {}, h("p", { class: "kg-ctl-l", text: "Schritte" }), poolBox)),
        msg, check));
    });
  }

  // Den Versuch durchführen: Vermutung wählen, messen, vergleichen.
  function durchfuehren(ctx, E) {
    return new Promise((resolve) => {
      const order = shuffle(E.verm.map((_, i) => i));
      let chosen = -1;
      let measured = 0;
      const vbox = h("div", { class: "kg-opts" });
      const table = h("table", { class: "kg-table" }, h("thead", {}, h("tr", {}, E.cols.map((c) => h("th", { text: c })))), h("tbody"));
      const tbody = table.querySelector("tbody");
      const run = h("button", { class: "kg-go", type: "button", text: "Messung 1 durchführen", disabled: true });
      const msg = h("div", { class: "kg-fb hidden", role: "status" });
      const wrap = h("div", { class: "kg-card" },
        h("p", { class: "kg-tag", text: "Experiment: " + E.name }),
        h("p", { class: "kg-q", html: "<b>Frage:</b> " + E.frage }),
        h("p", { class: "kg-lead", text: "Was vermutest du?" }), vbox,
        h("p", { class: "kg-lead", html: "<b>Durchführung:</b> " + E.durch }), table, run, msg);

      order.forEach((i) => {
        const b = h("button", { class: "kg-opt", type: "button", text: E.verm[i] });
        b.addEventListener("click", () => {
          if (measured) return;
          chosen = i;
          vbox.querySelectorAll("button").forEach((x) => x.classList.toggle("picked", x === b));
          run.disabled = false;
        });
        vbox.append(b);
      });
      run.addEventListener("click", () => {
        if (chosen < 0) return;
        vbox.querySelectorAll("button").forEach((x) => (x.disabled = true));
        const r = E.rows[measured];
        const tr = h("tr", { class: "fresh" }, r.map((c) => h("td", { text: c })));
        tbody.append(tr);
        measured += 1;
        if (measured < E.rows.length) run.textContent = "Messung " + (measured + 1) + " durchführen";
        else {
          run.remove();
          const hit = chosen === 0;
          msg.className = "kg-fb " + (hit ? "ok" : "bad");
          msg.replaceChildren(
            h("p", { class: "kg-fb-h", text: hit ? "Deine Vermutung stimmt" : "Deine Vermutung stimmt nicht" }),
            h("p", { class: "kg-fb-w", html: "<b>Beobachtung:</b> " + E.beob }),
            hit ? null : h("p", { class: "kg-fb-w", text: "Das ist nicht schlimm: Auch eine falsche Vermutung bringt weiter. Genau dafür macht man den Versuch." }),
            h("button", { class: "kg-go", type: "button", text: "Auswerten", onclick: resolve })
          );
        }
      });
      ctx.show(wrap);
    });
  }

  async function experiment(ctx, E) {
    await ordnen(ctx, E);
    await durchfuehren(ctx, E);
    const sOpts = E.schluss.opts;
    await ctx.ask({ t: "mc", q: "<b>Auswertung:</b> Welcher Schluss passt zu den Messwerten? (" + E.name + ")", opts: sOpts, a: 0, why: E.schluss.why }, { tag: "Auswertung" });
    await ctx.ask({ t: "mc", q: E.fair.q + " (" + E.name + ")", opts: E.fair.opts, a: 0, why: E.fair.why }, { tag: "Fairer Test" });
  }

  KG.level({
    n: 8,
    name: "Experimentierlabor",
    topic: "Experimentierprozess",
    goal: "Ich kann Experimente nach dem Experimentierprozess planen, durchführen und auswerten: Frage, Vermutung, Durchführung, Beobachtung, Auswertung.",
    async run(ctx) {
      await ctx.intro("Experimentierlabor", [
        "In der Physik gibt man nicht einfach eine Antwort: Man <b>probiert es aus</b>. Dabei folgt man fünf Schritten: <b>Frage, Vermutung, Durchführung, Beobachtung, Auswertung</b>.",
        "Du machst Experimente zu den Themen dieser Station. Schaffe mindestens <b>4 von 7</b>.",
      ]);
      const st = KG.util.state;
      st.misc.l8 = st.misc.l8 || {};
      const NEED = 4;
      for (;;) {
        const done = Object.keys(st.misc.l8).filter((k) => st.misc.l8[k]).length;
        ctx.progress(Math.min(1, done / NEED) * 0.95);
        const tiles = EXP.map((E) => {
          const d = !!st.misc.l8[E.id];
          return h("button", { class: "exp-tile" + (d ? " done" : ""), type: "button", "data-id": E.id }, h("span", { class: "exp-ck", "aria-hidden": "true", html: d ? '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>' : "" }), h("b", { text: E.name }), h("small", { text: E.topic }));
        });
        const menu = h("div", { class: "kg-card" },
          h("h2", { class: "kg-h", text: "Wähle ein Experiment" }),
          h("p", { class: "kg-lead", text: done + " von 7 gemacht. Mindestens " + NEED + " brauchst du für das Modul." }),
          h("div", { class: "exp-grid" }, tiles),
          done >= NEED ? h("button", { class: "kg-go", type: "button", "data-fin": "1", text: "Modul abschliessen" }) : null);
        ctx.show(menu);
        const pickedId = await new Promise((resolve) => {
          menu.querySelectorAll(".exp-tile").forEach((t) => t.addEventListener("click", () => resolve(t.getAttribute("data-id"))));
          const fin = menu.querySelector("[data-fin]");
          if (fin) fin.addEventListener("click", () => resolve("__fin"));
        });
        if (pickedId === "__fin") break;
        await experiment(ctx, EXP.find((E) => E.id === pickedId));
        st.misc.l8[pickedId] = true;
        KG.util.save();
      }
      await ctx.finish();
    },
  });

  /* =====================================================================
     Level 9: Begriffs-Terminal
     ===================================================================== */

  // Erklärungen nennen den Begriff nie selbst, damit man ihn beim Tippen nicht abschreiben kann.
  const TERMS = [
    { t: "Kraft", alts: ["F"], d: "Eine Wirkung, die einen Körper verformen oder seine Bewegung ändern kann: schneller, langsamer oder in eine andere Richtung. Formelzeichen: F." },
    { t: "Newton", alts: ["N"], d: "Die Einheit der Kraft, abgekürzt N. Eine Tafel Schokolade (100 g) wiegt auf der Erde etwa 1 N." },
    { t: "Kraftmesser", d: "Ein Gerät mit einer Feder, an dem man Kräfte in Newton abliest." },
    { t: "Gewichtskraft", alts: ["F_G", "FG", "Gewichtskraft F_G"], d: "Die Kraft, mit der ein Himmelskörper, zum Beispiel die Erde, einen Körper anzieht. Man berechnet sie mit m · g." },
    { t: "Masse", alts: ["m"], d: "Die Menge an Stoff in einem Körper. Einheit: Kilogramm. Sie ist an jedem Ort gleich." },
    { t: "Ortsfaktor", alts: ["g", "Ortsfaktor g"], d: "Gibt an, wie viel Newton Gewichtskraft pro Kilogramm Masse wirken. Auf der Erde 9.81 N/kg, auf dem Mond 1.62 N/kg." },
    { t: "Normalkraft", alts: ["F_N", "FN", "Stützkraft", "Stuetzkraft"], d: "Die Kraft, mit der eine Unterlage senkrecht auf einen Körper drückt. Sie trägt zum Beispiel das Buch auf dem Tisch." },
    { t: "Reibung", alts: ["Reibungskraft"], d: "Eine Kraft, die dort entsteht, wo sich zwei Flächen berühren. Sie wirkt einer Bewegung entgegen." },
    { t: "Haftreibung", alts: ["Haftreibungskraft"], d: "Die Reibung bei einem ruhenden Körper. Sie ist die grösste der drei Arten und hält zum Beispiel ein parkiertes Auto am Hang fest." },
    { t: "Gleitreibung", alts: ["Gleitreibungskraft"], d: "Die Reibung, wenn ein Körper über eine Fläche rutscht. Sie ist kleiner als die grösste Reibung im Ruhezustand." },
    { t: "Rollreibung", alts: ["Rollreibungskraft"], d: "Die Reibung bei einem rollenden Körper. Sie ist die kleinste der drei Arten." },
    { t: "resultierende Kraft", alts: ["Resultierende", "F_res", "Fres"], d: "Die einzelne Kraft, die dieselbe Wirkung hat wie mehrere Kräfte zusammen." },
    { t: "Kräftegleichgewicht", alts: ["Gleichgewicht", "Kraeftegleichgewicht"], d: "Zustand, in dem sich alle Kräfte auf einen Körper aufheben. Er bleibt dann in Ruhe oder bewegt sich gleichmässig geradeaus." },
    { t: "Kraftpfeil", d: "Ein Pfeil, der eine Kraft zeichnet. Er zeigt Angriffspunkt, Richtung und Betrag." },
    { t: "Angriffspunkt", d: "Die Stelle, an der eine Kraft am Körper ansetzt. Dort beginnt der Pfeil." },
    { t: "Betrag", alts: ["Betrag der Kraft"], d: "Die Grösse einer Kraft in Newton. Am Pfeil ist es die Länge, passend zum Massstab." },
    { t: "Kräfteparallelogramm", alts: ["Kraefteparallelogramm", "Parallelogramm"], d: "Zeichnerisches Verfahren für zwei Kräfte im Winkel: Man ergänzt die beiden Pfeile zu einem Viereck mit je zwei parallelen Seiten. Die Diagonale zeigt die resultierende Kraft." },
    { t: "Hebel", d: "Ein starrer Körper, der sich um einen festen Punkt drehen lässt, zum Beispiel eine Wippe." },
    { t: "Drehpunkt", d: "Der Punkt, um den sich ein Hebel dreht." },
    { t: "Kraftarm", d: "Der Abstand zwischen dem Drehpunkt und dem Punkt, an dem die Kraft angreift." },
    { t: "Lastarm", d: "Der Abstand zwischen dem Drehpunkt und dem Punkt, an dem die Last angreift." },
    { t: "Hebelgesetz", d: "Ein Hebel ist im Gleichgewicht, wenn Kraft mal Kraftarm gleich Last mal Lastarm ist: F₁ · a₁ = F₂ · a₂." },
    { t: "Flaschenzug", d: "Eine Kombination aus festen und losen Rollen mit einem Seil. Mit n tragenden Seilstücken braucht man nur den n-ten Teil der Kraft, aber n-mal so viel Seil." },
    { t: "tragende Seilstücke", alts: ["Seilstücke", "tragende Seile"], d: "Die Stücke des Seils, die beim Flaschenzug die Last halten. Ihre Anzahl bestimmt, wie viel Kraft man spart." },
    { t: "schiefe Ebene", alts: ["Rampe"], d: "Eine geneigte Fläche, auf der man eine Last mit weniger Kraft nach oben bringt. Je länger sie bei gleicher Höhe ist, desto kleiner die Kraft." },
    { t: "Goldene Regel der Mechanik", alts: ["Goldene Regel"], d: "Was man an Kraft spart, muss man an Weg zugeben." },
    { t: "elastische Verformung", alts: ["elastisch"], d: "Ein Körper nimmt seine ursprüngliche Form wieder an, sobald die Kraft nicht mehr wirkt, zum Beispiel eine Feder." },
    { t: "plastische Verformung", alts: ["plastisch"], d: "Ein Körper behält die neue Form, auch wenn die Kraft nicht mehr wirkt, zum Beispiel Knete." },
    { t: "beschleunigen", alts: ["Beschleunigung"], d: "Die Kraft zeigt in Bewegungsrichtung: Der Körper wird immer schneller." },
    { t: "bremsen", alts: ["Bremsen"], d: "Die Kraft zeigt gegen die Bewegungsrichtung: Der Körper wird langsamer." },
    { t: "Experimentierprozess", d: "Die Schritte eines Versuchs: Frage, Vermutung, Durchführung, Beobachtung, Auswertung." },
  ];
  KG.terms = TERMS;

  async function flip(ctx) {
    const queue = shuffle(TERMS);
    const total = queue.length;
    let known = 0;
    return new Promise((resolve) => {
      const count = h("p", { class: "kg-count" });
      const host = h("div", { class: "flip-host" });
      const btns = h("div", { class: "kg-actions" });
      const card = h("div", { class: "kg-card" }, h("p", { class: "kg-tag", text: "Karten umdrehen" }), count, host, btns, h("button", { class: "kg-link", type: "button", text: "Zurück zum Terminal", onclick: resolve }));
      function next() {
        host.replaceChildren();
        btns.replaceChildren();
        count.textContent = known + " von " + total + " gewusst";
        if (!queue.length) {
          host.append(h("p", { class: "kg-q", text: "Alle Karten gewusst." }));
          btns.append(h("button", { class: "kg-go", type: "button", text: "Fertig", onclick: resolve }));
          return;
        }
        const t = queue[0];
        const c = h("button", { class: "flip", type: "button", "aria-label": "Karte umdrehen" },
          h("span", { class: "flip-in" }, h("span", { class: "flip-f face" }, h("small", { text: "Begriff" }), h("b", { text: t.t }), h("small", { class: "tap", text: "Tippen zum Umdrehen" })), h("span", { class: "flip-f rear" }, h("small", { text: t.t }), h("span", { text: t.d }))));
        c.addEventListener("click", () => {
          c.classList.toggle("flipped");
          if (c.classList.contains("flipped") && !btns.children.length) {
            btns.append(
              h("button", { class: "kg-go", type: "button", text: "Gewusst", onclick: () => { queue.shift(); known += 1; addXp(2); next(); } }),
              h("button", { class: "kg-go ghost", type: "button", text: "Noch üben", onclick: () => { queue.push(queue.shift()); next(); } })
            );
          }
        });
        host.append(c);
      }
      next();
      ctx.show(card);
    });
  }

  async function tippen(ctx) {
    for (;;) {
      const set = shuffle(TERMS).slice(0, 10);
      let right = 0;
      for (let i = 0; i < set.length; i++) {
        ctx.progress(i / set.length);
        const T = set[i];
        const r = await ctx.ask({ t: "text", q: "Wie heisst der Begriff?<br><span class=\"term-def\">" + T.d + "</span>", a: T.t, alts: T.alts, why: "" }, { tag: "Begriff " + (i + 1) + " von " + set.length });
        if (r.ok) right += 1;
      }
      const pass = right >= 7;
      ctx.show(h("div", { class: "kg-card" }, h("h2", { class: "kg-h", text: right + " von 10 richtig" }),
        h("p", { text: pass ? "Das reicht: Du kennst die Begriffe." : "Für das Modul brauchst du mindestens 7 von 10. Falsche Begriffe kommen später in der Wiederholung wieder." }),
        h("div", { class: "kg-actions" }, h("button", { class: "kg-go", type: "button", "data-r": pass ? "fin" : "again", text: pass ? "Weiter" : "Nochmal versuchen" }), !pass ? h("button", { class: "kg-go ghost", type: "button", "data-r": "flip", text: "Erst Karten lernen" }) : null)));
      const choice = await new Promise((resolve) => ctx.stage.querySelectorAll("[data-r]").forEach((b) => b.addEventListener("click", () => resolve(b.getAttribute("data-r")))));
      if (choice === "fin") return;
      if (choice === "flip") await flip(ctx);
    }
  }

  KG.level({
    n: 9,
    name: "Begriffs-Terminal",
    topic: "Fachbegriffe",
    goal: "Ich kenne die Fachbegriffe zu Kräften (Newton, Gewichtskraft, Reibung, Hebelgesetz, Flaschenzug und mehr) und kann sie erklären.",
    async run(ctx) {
      await ctx.intro("Begriffs-Terminal", [
        "Im Terminal stehen alle Fachbegriffe des Spiels. Du lernst sie auf zwei Arten: <b>Karten umdrehen</b> und <b>Begriffe tippen</b>.",
        "Für das Modul tippst du zehn Begriffe zu ihrer Erklärung. Mindestens sieben müssen stimmen.",
      ]);
      for (;;) {
        const menu = h("div", { class: "kg-card" }, h("h2", { class: "kg-h", text: "Wie willst du üben?" }),
          h("p", { class: "kg-lead", text: TERMS.length + " Begriffe. Mit dem Tippen schliesst du das Modul ab." }),
          h("div", { class: "kg-actions" },
            h("button", { class: "kg-go ghost", type: "button", "data-m": "flip", text: "Karten umdrehen" }),
            h("button", { class: "kg-go", type: "button", "data-m": "type", text: "Begriffe tippen" })));
        ctx.show(menu);
        const m = await new Promise((resolve) => menu.querySelectorAll("[data-m]").forEach((b) => b.addEventListener("click", () => resolve(b.getAttribute("data-m")))));
        if (m === "flip") await flip(ctx);
        else break;
      }
      await tippen(ctx);
      await ctx.finish();
    },
  });

  /* =====================================================================
     Level 10: Endboss, Station-Neustart
     ===================================================================== */

  function bossPool() {
    const mond = Phys.planet("mond").g;
    const mars = Phys.planet("mars").g;
    const num = (q, a, tol, unit, why) => ({ t: "num", q, a, tol, unit, why });
    const mc = (q, opts, why) => ({ t: "mc", q, opts, a: 0, why });
    return [
      mc("Warum ist es leichter, ein Auto auf ebener Strasse zu schieben als einen Hang hinauf? Welche Rolle spielt die Reibung?",
        ["Auf dem Hang muss man zusätzlich einen Teil der Gewichtskraft überwinden. Die Reibung kommt immer dazu.", "Auf dem Hang gibt es keine Reibung.", "Auf der ebenen Strasse ist die Gewichtskraft kleiner.", "Am Hang ist die Reibung kleiner, darum ist es schwerer."],
        "Auf ebener Strasse muss man nur die Reibung überwinden. Am Hang wirkt zusätzlich ein Teil der Gewichtskraft nach unten entlang des Hangs. Die Haftreibung hilft nur, dass das Auto nicht zurückrollt."),
      num("Ein Astronaut hat die Masse <b>80 kg</b>. Wie gross ist seine Gewichtskraft auf dem <b>Mars</b> (g = 3.71 N/kg)?", 80 * mars, 1, "N", "F<sub>G</sub> = m · g = 80 kg · 3.71 N/kg = 296.8 N."),
      num("Eine Schubkarre: Die Last von <b>400 N</b> liegt <b>0.5 m</b> vor dem Rad, die Hände greifen <b>1.5 m</b> hinter dem Rad an. Welche Kraft brauchen die Hände?", Phys.hebelF2(400, 0.5, 1.5), 2, "N", "Kraft · Kraftarm = Last · Lastarm. F = 400 N · 0.5 m : 1.5 m ≈ 133 N."),
      num("Ein Flaschenzug hat <b>4</b> tragende Seilstücke und hebt eine Last von <b>800 N</b>. Wie gross ist die Zugkraft?", Phys.flaschenzugKraft(800, 4), 1, "N", "F = 800 N : 4 = 200 N."),
      num("Zwei Kinder ziehen einen Wagen in <b>entgegengesetzte</b> Richtungen, mit <b>60 N</b> und <b>35 N</b>. Wie gross ist die resultierende Kraft?", 25, 0.5, "N", "Entgegengesetzt: 60 N − 35 N = 25 N, in Richtung des stärkeren Kindes."),
      num("Zwei Kräfte mit <b>30 N</b> und <b>40 N</b> wirken im <b>rechten Winkel</b>. Wie gross ist die resultierende Kraft?", 50, 1, "N", "Diagonale im Kräfteparallelogramm: √(30² + 40²) = 50 N. Nicht 70 N, weil die Richtungen verschieden sind."),
      mc("Eine schwere Kiste lässt sich nur schwer anschieben, rutscht dann aber leichter. Warum?",
        ["Die Gleitreibung ist kleiner als die grösste Haftreibung.", "Die Kiste wird beim Schieben leichter.", "Die Rollreibung ist grösser als die Gleitreibung.", "Beim Anschieben wirkt keine Normalkraft."],
        "Zum Losreissen muss man die grösste Haftreibung überwinden. Sobald die Kiste gleitet, wirkt nur noch die kleinere Gleitreibung."),
      mc("Warum legen Umzugsleute Rollen unter einen schweren Schrank?",
        ["Rollreibung ist viel kleiner als Gleitreibung.", "Rollen machen den Schrank leichter.", "Rollen vergrössern die Haftreibung.", "Dann wirkt keine Gewichtskraft mehr."],
        "Statt Gleitreibung wirkt nur Rollreibung, und die ist die kleinste der drei Reibungsarten. Die Masse des Schranks bleibt gleich."),
      num("Auf dem <b>Mond</b> zeigt ein Kraftmesser <b>16.2 N</b>. Welche Masse hängt daran?", 16.2 / mond, 0.1, "kg", "m = F<sub>G</sub> : g = 16.2 N : 1.62 N/kg = 10 kg."),
      num("Ein Fass mit <b>500 N</b> wird über eine Rampe von <b>3 m</b> Länge auf <b>0.6 m</b> Höhe gebracht (ohne Reibung). Welche Kraft entlang der Rampe ist nötig?", Phys.schiefeEbeneKraft(500, 0.6, 3), 1, "N", "F = F<sub>G</sub> · h : l = 500 N · 0.6 m : 3 m = 100 N."),
      mc("Ein Eishockey-Puck gleitet über das Eis und wird langsamer. Was bremst ihn, und welche Kraftwirkung ist das?",
        ["Die Gleitreibung bremst ihn: Die Kraftwirkung ist Bremsen.", "Die Gewichtskraft beschleunigt ihn.", "Die Normalkraft verformt ihn plastisch.", "Es wirkt keine Kraft, er wird einfach müde."],
        "Die Reibung wirkt gegen die Bewegung. Eine Kraft gegen die Bewegungsrichtung bremst den Körper."),
      mc("Ein Metalllöffel wird mit grosser Kraft verbogen und bleibt krumm. Was stimmt?",
        ["Das ist eine plastische Verformung.", "Das ist eine elastische Verformung.", "Der Löffel wird beschleunigt.", "Die Kraft hat den Löffel gebremst."],
        "Bleibt die Form nach dem Ende der Kraft verändert, ist es eine plastische Verformung."),
      mc("Warum muss der Bizeps viel mehr Kraft aufbringen, als das Gewicht in deiner Hand wiegt?",
        ["Sein Kraftarm ist viel kürzer als der Lastarm.", "Sein Kraftarm ist viel länger als der Lastarm.", "Der Ellbogen ist kein Drehpunkt.", "Muskeln sparen immer Kraft."],
        "Der Muskel greift nahe am Ellbogen an (kurzer Kraftarm), das Gewicht hängt weit weg (langer Lastarm). Nach dem Hebelgesetz braucht man dann die grössere Kraft."),
      num("Eine Kraft von <b>45 N</b> soll mit dem Massstab <b>1 cm = 15 N</b> gezeichnet werden. Wie lang ist der Pfeil?", 3, 0.05, "cm", "45 N : 15 N/cm = 3 cm."),
      mc("Mit einer Rampe brauchst du nur halb so viel Kraft. Was ändert sich noch?",
        ["Der Weg wird doppelt so lang.", "Der Weg wird halb so lang.", "Die Last wird halb so schwer.", "Nichts."],
        "Goldene Regel der Mechanik: Was man an Kraft spart, muss man an Weg zugeben."),
      mc("Ein Astronaut hat auf der Erde die Masse 80 kg. Wie sind seine Masse und seine Gewichtskraft auf dem Mond?",
        ["Masse 80 kg, Gewichtskraft 129.6 N", "Masse 13.2 kg, Gewichtskraft 129.6 N", "Masse 80 kg, Gewichtskraft 784.8 N", "Masse 13.2 kg, Gewichtskraft 784.8 N"],
        "Die Masse ändert sich nicht: 80 kg. Die Gewichtskraft ist F = 80 kg · 1.62 N/kg = 129.6 N (auf der Erde wären es 784.8 N)."),
      mc("Zwei gleich grosse Kräfte wirken in entgegengesetzte Richtungen auf einen ruhenden Wagen. Was passiert?",
        ["Er bleibt in Ruhe, denn die resultierende Kraft ist null.", "Er wird doppelt so schnell.", "Er wird plastisch verformt.", "Er bremst."],
        "Gleich grosse, entgegengesetzte Kräfte heben sich auf: Kräftegleichgewicht."),
    ];
  }

  const CELLS = 3;

  async function boss(ctx) {
    const st = KG.util.state;
    for (;;) {
      let lives = CELLS;
      let score = 0;
      const qs = shuffle(bossPool()).slice(0, 10);
      const hud = h("div", { class: "boss-hud" });
      const host = h("div", { class: "boss-host" });
      ctx.show(h("div", {}, hud, host));
      const sub = ctx.sub(host);
      const paint = (i) => {
        hud.replaceChildren(
          h("div", { class: "boss-cells", role: "img", "aria-label": lives + " von " + CELLS + " Energiezellen" }, Array.from({ length: CELLS }, (_, k) => h("span", { class: "cell" + (k < lives ? " on" : "") }))),
          h("span", { class: "boss-q", text: "Frage " + Math.min(i + 1, qs.length) + " von " + qs.length }),
          h("span", { class: "boss-score", html: "Punkte <b>" + score + "</b>" })
        );
      };
      let i = 0;
      for (; i < qs.length && lives > 0; i++) {
        paint(i);
        ctx.progress(i / qs.length);
        const q = qs[i];
        const limit = q.t === "num" ? 60 : 30;
        const r = await sub.ask(q, { tag: "Endboss", timer: limit });
        if (r.ok) score += 100 + Math.max(0, Math.round(limit - r.ms / 1000));
        else lives -= 1;
      }
      const won = lives > 0;
      const best = st.misc.l10best || 0;
      if (score > best) {
        st.misc.l10best = score;
        KG.util.save();
      }
      if (won) {
        ctx.show(h("div", { class: "kg-card kg-finish" }, h("p", { class: "kg-tag", text: "Station-Neustart" }), h("h2", { class: "kg-h", text: "Boss besiegt" }),
          h("div", { class: "boss-final" }, h("div", {}, h("small", { text: "Punkte" }), h("b", { text: score })), h("div", {}, h("small", { text: "Energiezellen übrig" }), h("b", { text: lives + " von " + CELLS })), h("div", {}, h("small", { text: "Bestes Ergebnis" }), h("b", { text: Math.max(best, score) }))),
          h("p", { text: "Die Station fährt hoch. Alle Module laufen." }),
          h("button", { class: "kg-go", type: "button", "data-r": "ok", text: "Station starten" })));
        await new Promise((resolve) => ctx.stage.querySelector("[data-r]").addEventListener("click", resolve));
        return score;
      }
      ctx.show(h("div", { class: "kg-card" }, h("p", { class: "kg-tag", text: "Notabschaltung" }), h("h2", { class: "kg-h", text: "Alle Energiezellen leer" }),
        h("p", { text: "Du hast " + score + " Punkte gesammelt. Die falschen Fragen stehen jetzt auf deiner Wiederholungsliste. Versuch es nochmal mit neuen Fragen." }),
        h("div", { class: "kg-actions" }, h("button", { class: "kg-go", type: "button", "data-r": "again", text: "Nochmal versuchen" }), h("button", { class: "kg-go ghost", type: "button", "data-r": "back", text: "Zur Station" }))));
      const c = await new Promise((resolve) => ctx.stage.querySelectorAll("[data-r]").forEach((b) => b.addEventListener("click", () => resolve(b.getAttribute("data-r")))));
      if (c === "back") {
        KG.showStation();
        return null;
      }
    }
  }

  KG.level({
    n: 10,
    name: "Endboss",
    topic: "Station-Neustart",
    goal: "Ich kann mein Wissen über Kräfte in neuen Situationen anwenden, auch wenn mehrere Themen zusammenkommen.",
    async run(ctx) {
      await ctx.intro("Endboss: Station-Neustart", [
        "Zehn gemischte Fragen, neue Situationen, wenig Zeit. Du hast <b>drei Energiezellen</b>: Jede falsche oder zu späte Antwort kostet eine.",
        "Schnelle richtige Antworten geben mehr Punkte. Wenn du mit mindestens einer Zelle durchkommst, startet die Station neu.",
      ], "Neustart beginnen");
      const score = await boss(ctx);
      if (score == null) return;
      await ctx.finish("Dein Ergebnis im Endboss: <b>" + score + " Punkte</b>.");
    },
  });
})();
