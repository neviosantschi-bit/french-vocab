"use strict";

// Kräfte-Spiel, Level 4 und 5: Kräfte erkennen, Kraftpfeile und Kräfteparallelogramm.

(() => {
  const { h, svgEl, shuffle, fmt, clamp, arrowDefs } = KG.util;

  const COL = { a: "#ffbe55", b: "#4fd8e8", g: "#4fe3a1", r: "#ff6b7a", w: "#e6eefc" };

  /* =====================================================================
     Level 4: Kräfte-Detektiv
     ===================================================================== */

  const NAMEN = ["Gewichtskraft", "Normalkraft", "Zugkraft", "Haftreibungskraft", "Gleitreibungskraft", "Luftwiderstand"];

  const HINWEIS = {
    Gewichtskraft: "Diese Kraft zieht den Körper nach unten, zum Erdmittelpunkt.",
    Normalkraft: "Diese Kraft drückt senkrecht von der Unterlage auf den Körper (Stützkraft).",
    Zugkraft: "Diese Kraft wird durch Ziehen, hier am Seil, ausgeübt.",
    Haftreibungskraft: "Der Körper ruht. Diese Kraft hält ihn fest, sodass er nicht rutscht.",
    Gleitreibungskraft: "Der Körper gleitet. Diese Kraft wirkt gegen seine Bewegung.",
    Luftwiderstand: "Die Luft bremst den Körper. Das ist eine Reibungskraft in der Luft.",
  };
  const FARBE = { Gewichtskraft: "a", Normalkraft: "b", Zugkraft: "g", Haftreibungskraft: "r", Gleitreibungskraft: "r", Luftwiderstand: "r" };

  const T25 = Math.tan((25 * Math.PI) / 180);
  const hang = (() => {
    const a = (25 * Math.PI) / 180;
    const d = [Math.cos(a), -Math.sin(a)]; // den Hang hinauf
    const n = [-Math.sin(a), -Math.cos(a)]; // senkrecht vom Hang weg
    const P = [180, 190 - 160 * T25]; // Berührpunkt
    // Schwerpunkt des Autos: 21 senkrecht über P (im geneigten Bezugssystem)
    const C = [P[0] + 21 * n[0], P[1] + 21 * n[1]];
    const FG = 70;
    return {
      d, n, P, C,
      gk: [0, FG],
      nk: [n[0] * FG * Math.cos(a), n[1] * FG * Math.cos(a)],
      hr: [d[0] * FG * Math.sin(a), d[1] * FG * Math.sin(a)],
      oN: [P[0] + 18 * d[0], P[1] + 18 * d[1]],
      oH: [P[0] - 18 * d[0], P[1] - 18 * d[1]],
    };
  })();

  const SZENEN = [
    {
      title: "Ein Buch liegt auf dem Tisch",
      vb: "40 70 280 150",
      art:
        '<rect class="d-floor" x="50" y="150" width="260" height="14" rx="3"/><rect class="d-floor" x="72" y="164" width="12" height="50"/><rect class="d-floor" x="276" y="164" width="12" height="50"/>' +
        '<rect class="d-obj" x="130" y="124" width="100" height="26" rx="2"/><line class="d-rib" x1="136" y1="141" x2="224" y2="141"/>',
      kraefte: [
        { n: "Gewichtskraft", ox: 165, oy: 137, dx: 0, dy: 56, desc: "ein Buch auf dem Tisch nach unten zieht" },
        { n: "Normalkraft", ox: 195, oy: 150, dx: 0, dy: -56, desc: "der Tisch senkrecht nach oben auf das Buch ausübt" },
      ],
      quiz: {
        t: "mc", q: "Das Buch liegt still auf dem Tisch. Was gilt für die beiden Kräfte?",
        opts: ["Gewichtskraft und Normalkraft sind gleich gross und entgegengesetzt: Sie heben sich auf.", "Die Gewichtskraft ist grösser, sonst würde das Buch nicht liegen.", "Die Normalkraft ist grösser, das Buch drückt gegen den Tisch.", "Es wirkt nur die Gewichtskraft."], a: 0,
        why: "Das Buch bleibt in Ruhe, also ist die resultierende Kraft null: F<sub>G</sub> und F<sub>N</sub> sind gleich gross und zeigen in entgegengesetzte Richtungen.",
      },
    },
    {
      title: "Ein Auto parkt am Hang",
      vb: "20 24 320 176",
      art:
        '<polygon class="d-floor" points="20,190 340,190 340,' + (190 - 320 * T25).toFixed(1) + '"/>' +
        '<g transform="translate(' + hang.P[0] + "," + hang.P[1].toFixed(1) + ') rotate(-25)"><rect class="d-obj" x="-45" y="-34" width="90" height="26" rx="6"/><rect class="d-obj2" x="-22" y="-52" width="44" height="20" rx="5"/><circle class="d-wheel" cx="-28" cy="-8" r="9"/><circle class="d-wheel" cx="28" cy="-8" r="9"/></g>',
      kraefte: [
        { n: "Gewichtskraft", ox: hang.C[0], oy: hang.C[1], dx: hang.gk[0], dy: hang.gk[1], desc: "das parkende Auto senkrecht nach unten zieht" },
        { n: "Normalkraft", ox: hang.oN[0], oy: hang.oN[1], dx: hang.nk[0], dy: hang.nk[1], desc: "der Hang senkrecht zur Fahrbahn auf das Auto ausübt" },
        { n: "Haftreibungskraft", ox: hang.oH[0], oy: hang.oH[1], dx: hang.hr[0], dy: hang.hr[1], desc: "das Auto am Hang festhält, sodass es nicht rutscht" },
      ],
      quiz: {
        t: "mc", q: "Das Auto steht still am Hang. Welche Aussage stimmt?",
        opts: ["Alle drei Kräfte zusammen heben sich auf. Die Haftreibung hält das Auto am Hang.", "Die Gewichtskraft ist grösser als die anderen beiden zusammen.", "Normalkraft und Gewichtskraft heben sich allein auf.", "Die Haftreibungskraft ist so gross wie die Gewichtskraft."], a: 0,
        why: "Das Auto ruht, also ist die Summe aller Kräfte null. Beachte: Die Normalkraft ist am Hang <b>kleiner</b> als die Gewichtskraft, weil die Haftreibung einen Teil der Gewichtskraft ausgleicht.",
      },
    },
    {
      title: "Eine Person zieht einen Schlitten",
      vb: "104 96 256 124",
      art:
        '<rect class="d-floor" x="0" y="168" width="360" height="52"/>' +
        '<rect class="d-obj" x="170" y="142" width="100" height="18" rx="4"/><rect class="d-obj2" x="164" y="161" width="112" height="6" rx="3"/>' +
        '<line class="d-rope" x1="270" y1="150" x2="314" y2="150"/><circle class="d-head" cx="326" cy="112" r="10"/><line class="d-body" x1="326" y1="122" x2="326" y2="158"/><line class="d-body" x1="326" y1="158" x2="316" y2="168"/><line class="d-body" x1="326" y1="158" x2="338" y2="168"/><line class="d-body" x1="326" y1="130" x2="314" y2="150"/>',
      kraefte: [
        { n: "Gewichtskraft", ox: 225, oy: 150, dx: 0, dy: 48, desc: "den Schlitten nach unten zieht" },
        { n: "Normalkraft", ox: 245, oy: 168, dx: 0, dy: -48, desc: "der Boden senkrecht nach oben auf den Schlitten ausübt" },
        { n: "Zugkraft", ox: 272, oy: 150, dx: 44, dy: 0, desc: "die Person über das Seil am Schlitten ausübt" },
        { n: "Gleitreibungskraft", ox: 195, oy: 168, dx: -44, dy: 0, desc: "gegen die Bewegung des gleitenden Schlittens wirkt" },
      ],
      quiz: {
        t: "mc", q: "Der Schlitten bewegt sich mit gleichbleibender Geschwindigkeit. Welche Kräfte gleichen sich aus?",
        opts: ["Gewichtskraft und Normalkraft; Zugkraft und Gleitreibungskraft", "Nur Gewichtskraft und Normalkraft", "Zugkraft und Normalkraft", "Die Zugkraft ist dauernd grösser als die Gleitreibungskraft."], a: 0,
        why: "Gleichbleibende Geschwindigkeit heisst: resultierende Kraft null. Senkrecht gleichen sich F<sub>G</sub> und F<sub>N</sub> aus, waagrecht Zug und Reibung.",
      },
    },
    {
      title: "Ein Fallschirmspringer sinkt gleichmässig",
      vb: "60 4 240 216",
      art:
        '<path class="d-obj2" d="M104 84 Q180 -2 256 84 Q218 70 180 84 Q142 70 104 84 Z"/><line class="d-rope" x1="108" y1="84" x2="180" y2="146"/><line class="d-rope" x1="252" y1="84" x2="180" y2="146"/><line class="d-rope" x1="180" y1="84" x2="180" y2="146"/>' +
        '<circle class="d-head" cx="180" cy="154" r="8"/><line class="d-body" x1="180" y1="162" x2="180" y2="190"/><line class="d-body" x1="180" y1="190" x2="170" y2="208"/><line class="d-body" x1="180" y1="190" x2="190" y2="208"/><line class="d-body" x1="180" y1="168" x2="168" y2="150"/><line class="d-body" x1="180" y1="168" x2="192" y2="150"/>',
      kraefte: [
        { n: "Gewichtskraft", ox: 180, oy: 176, dx: 0, dy: 38, desc: "den Fallschirmspringer nach unten zieht" },
        { n: "Luftwiderstand", ox: 180, oy: 56, dx: 0, dy: -38, desc: "die Luft gegen die Fallrichtung auf den Schirm ausübt" },
      ],
      quiz: {
        t: "mc", q: "Der Springer sinkt mit konstanter Geschwindigkeit. Was gilt?",
        opts: ["Luftwiderstand und Gewichtskraft sind gleich gross.", "Der Luftwiderstand ist grösser als die Gewichtskraft.", "Die Gewichtskraft ist grösser als der Luftwiderstand.", "Es wirkt nur der Luftwiderstand."], a: 0,
        why: "Konstante Geschwindigkeit bedeutet: Die Kräfte sind im Gleichgewicht. Der Luftwiderstand nach oben ist so gross wie die Gewichtskraft nach unten.",
      },
    },
  ];

  async function szene(ctx, S, idx, total) {
    return new Promise((resolve) => {
      const found = new Set();
      let sel = -1;
      const svg = svgEl(
        '<svg viewBox="' + S.vb + '" class="det-svg" role="group" aria-label="' + S.title + '">' + arrowDefs + '<rect x="0" y="0" width="360" height="220" class="d-sky"/>' + S.art + '<g class="arrows"></g><g class="hots"></g></svg>'
      );
      const arrows = svg.querySelector(".arrows");
      const hots = svg.querySelector(".hots");
      const gs = [];
      const status = h("p", { class: "kg-hint", role: "status" });
      const panel = h("div", { class: "kg-chips det-names" });
      const msg = h("div", { class: "kg-fb hidden", role: "status" });
      const host = h("div", { class: "det-quiz" });
      const sub = ctx.sub(host);

      const upd = () => {
        status.textContent = found.size + " von " + S.kraefte.length + " Kräften gefunden. Tippe auf ein ? und benenne die Kraft.";
      };

      S.kraefte.forEach((k, i) => {
        const g = svgEl('<g class="hot" tabindex="0" role="button" aria-label="Kraft ' + (i + 1) + ' benennen"><circle class="hot-ring" cx="' + k.ox + '" cy="' + k.oy + '" r="15"/><circle class="hot-dot" cx="' + k.ox + '" cy="' + k.oy + '" r="11"/><text x="' + k.ox + '" y="' + (k.oy + 5) + '" text-anchor="middle" class="hot-q">?</text></g>');
        const pickIt = () => {
          if (found.has(i)) return;
          sel = i;
          hots.querySelectorAll(".hot").forEach((x) => x.classList.remove("sel"));
          g.classList.add("sel");
          panel.classList.remove("hidden");
          msg.className = "kg-fb hidden";
          msg.replaceChildren();
        };
        g.addEventListener("click", pickIt);
        g.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pickIt();
          }
        });
        hots.append(g);
        gs.push(g);
      });

      NAMEN.forEach((name) => {
        panel.append(
          h("button", { class: "kg-chip", type: "button", text: name, onclick: () => choose(name) })
        );
      });
      panel.classList.add("hidden");

      async function choose(name) {
        if (sel < 0) return;
        const k = S.kraefte[sel];
        const g = gs[sel];
        if (name === k.n) {
          found.add(sel);
          KG.util.addXp(found.size === 1 && !g.dataset.miss ? 6 : 3);
          const col = FARBE[k.n];
          const ex = k.ox + k.dx;
          const ey = k.oy + k.dy;
          // Beschriftung: bei senkrechten Pfeilen rechts neben der Spitze, bei waagrechten über (nach rechts) oder unter (nach links) dem Pfeil
          const vert = Math.abs(k.dy) > Math.abs(k.dx);
          const lx = vert ? ex + 8 : k.ox + k.dx * 0.5;
          const ly = vert ? ey + 4 : k.oy + k.dy * 0.5 + (k.dx > 0 ? -9 : 17);
          arrows.insertAdjacentHTML("beforeend",
            '<g class="f-arrow" style="transform-origin:' + k.ox + "px " + k.oy + 'px"><line x1="' + k.ox + '" y1="' + k.oy + '" x2="' + ex + '" y2="' + ey + '" stroke="' + COL[col] + '" stroke-width="4" marker-end="url(#kg-ah-' + col + ')"/><text x="' + lx + '" y="' + ly + '" class="f-lab" fill="' + COL[col] + '" text-anchor="' + (vert ? "start" : "middle") + '">' + k.n + "</text></g>");
          g.remove();
          sel = -1;
          panel.classList.add("hidden");
          msg.className = "kg-fb ok";
          msg.replaceChildren(h("p", { class: "kg-fb-h", text: k.n }), h("p", { class: "kg-fb-w", text: HINWEIS[k.n] }));
          upd();
          if (found.size === S.kraefte.length) {
            status.textContent = "Alle Kräfte gefunden.";
            await sub.ask(S.quiz, { tag: "Gleichgewicht" });
            sub.show(h("div", { class: "kg-actions" }, h("button", { class: "kg-go", type: "button", text: idx + 1 < total ? "Nächste Szene" : "Fertig", onclick: resolve })));
          }
        } else {
          g.dataset.miss = "1";
          KG.util.addReview({ t: "mc", q: "Wie heisst die Kraft, die " + k.desc + "?", opts: NAMEN, a: NAMEN.indexOf(k.n), why: HINWEIS[k.n] });
          g.classList.add("shake");
          setTimeout(() => g.classList.remove("shake"), 420);
          msg.className = "kg-fb bad";
          msg.replaceChildren(h("p", { class: "kg-fb-h", text: "Das ist keine " + name }), h("p", { class: "kg-fb-w", text: "Schau genau hin: " + HINWEIS[k.n] }));
        }
      }

      upd();
      ctx.show(h("div", { class: "kg-card" },
        h("p", { class: "kg-tag", text: "Szene " + (idx + 1) + " von " + total }),
        h("h2", { class: "kg-h", text: S.title }),
        h("div", { class: "det-wrap" }, svg),
        status, panel, msg, host));
    });
  }

  KG.level({
    n: 4,
    name: "Kräfte-Detektiv",
    topic: "Kräfte erkennen",
    goal: "Ich kann in Alltagssituationen die wirkenden Kräfte erkennen und benennen und sagen, welche Kräfte sich ausgleichen.",
    async run(ctx) {
      await ctx.intro("Kräfte-Detektiv", [
        "In jeder Szene wirken mehrere Kräfte, auch wenn nichts passiert. Du findest sie alle.",
        "Tippe auf ein <b>?</b>, benenne die Kraft und sieh dir den Pfeil an. Danach klärst du, <b>welche Kräfte sich ausgleichen</b>.",
      ]);
      for (let i = 0; i < SZENEN.length; i++) {
        ctx.progress(i / SZENEN.length);
        await szene(ctx, SZENEN[i], i, SZENEN.length);
      }
      await ctx.finish();
    },
  });

  /* =====================================================================
     Level 5: Pfeil-Konstrukteur
     ===================================================================== */

  function featSvg(active) {
    const hl = (k) => (active === k ? " on" : "");
    return svgEl(
      '<svg viewBox="0 0 360 130" class="feat-svg" aria-hidden="true">' + arrowDefs +
      '<line x1="40" y1="70" x2="300" y2="70" class="feat-shaft" stroke="#ffbe55" stroke-width="5" marker-end="url(#kg-ah-a)"/>' +
      '<circle cx="40" cy="70" r="9" class="feat-dot' + hl("A") + '"/><text x="40" y="38" text-anchor="middle" class="feat-l' + hl("A") + '">A</text>' +
      '<path class="feat-head' + hl("B") + '" d="M286 52 L318 70 L286 88" fill="none"/><text x="318" y="38" text-anchor="middle" class="feat-l' + hl("B") + '">B</text>' +
      '<path class="feat-len' + hl("C") + '" d="M40 104 H300 M40 98 V110 M300 98 V110" fill="none"/><text x="170" y="124" text-anchor="middle" class="feat-l' + hl("C") + '">C</text>' +
      "</svg>"
    );
  }

  const C = 40; // Pixel je cm im Gitter
  const COLS = 10;
  const ROWS = 7;

  // Gitter zum Zeichnen von Kraftpfeilen. Koordinaten in cm, y nach oben, 0/0 unten links.
  function gridBoard(O) {
    const px = (x) => x * C;
    const py = (y) => (ROWS - y) * C;
    let lines = "";
    for (let i = 0; i <= COLS; i++) lines += '<line class="g-line" x1="' + px(i) + '" y1="0" x2="' + px(i) + '" y2="' + ROWS * C + '"/>';
    for (let j = 0; j <= ROWS; j++) lines += '<line class="g-line" x1="0" y1="' + py(j) + '" x2="' + COLS * C + '" y2="' + py(j) + '"/>';
    const svg = svgEl(
      '<svg viewBox="0 0 ' + COLS * C + " " + ROWS * C + '" class="grid-svg" role="img" aria-label="Gitter, ein Kästchen ist 1 cm">' + arrowDefs +
      lines + '<g class="gl-given"></g><g class="gl-ghost"></g><g class="gl-draw"></g>' +
      '<rect class="g-body" x="' + (px(O[0]) - 9) + '" y="' + (py(O[1]) - 9) + '" width="18" height="18" rx="4"/><circle class="g-o" cx="' + px(O[0]) + '" cy="' + py(O[1]) + '" r="3.5"/><text class="g-a" x="' + (px(O[0]) - 14) + '" y="' + (py(O[1]) + 22) + '">A</text></svg>'
    );
    const given = svg.querySelector(".gl-given");
    const draw = svg.querySelector(".gl-draw");
    const ghosts = svg.querySelector(".gl-ghost");
    const api = { el: svg, O, vec: null, enabled: false, onDraw: null, note: null };

    const arrowSvg = (x1, y1, x2, y2, col, extra) =>
      '<line x1="' + px(x1) + '" y1="' + py(y1) + '" x2="' + px(x2) + '" y2="' + py(y2) + '" stroke="' + COL[col] + '" stroke-width="4" marker-end="url(#kg-ah-' + col + ')" ' + (extra || "") + "/>";

    api.setGiven = (list) => {
      given.innerHTML = list
        .map((a) => {
          const f = a.from || O;
          const mx = f[0] + a.v[0] / 2;
          const my = f[1] + a.v[1] / 2;
          return arrowSvg(f[0], f[1], f[0] + a.v[0], f[1] + a.v[1], a.c) + '<text class="g-lab" x="' + (px(mx) + (a.v[1] === 0 ? 0 : 10)) + '" y="' + (py(my) + (a.v[1] === 0 ? -9 : 0)) + '" fill="' + COL[a.c] + '" text-anchor="' + (a.v[1] === 0 ? "middle" : "start") + '">' + a.label + "</text>";
        })
        .join("");
    };

    const evt = (e) => {
      const r = svg.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * COLS, y: ROWS - ((e.clientY - r.top) / r.height) * ROWS };
    };
    const snap = (p) => ({ x: clamp(Math.round(p.x), 0, COLS), y: clamp(Math.round(p.y), 0, ROWS) });

    function paintDraw(v, ok) {
      if (!v || (v[0] === 0 && v[1] === 0)) {
        draw.innerHTML = "";
        return;
      }
      draw.innerHTML = arrowSvg(O[0], O[1], O[0] + v[0], O[1] + v[1], ok || "a") + '<circle class="g-end" cx="' + px(O[0] + v[0]) + '" cy="' + py(O[1] + v[1]) + '" r="5"/>';
    }
    api.paint = paintDraw;
    api.clear = () => {
      api.vec = null;
      pending = false;
      paintDraw(null);
      if (api.onDraw) api.onDraw(null);
    };
    api.showAnswer = (v) => {
      draw.insertAdjacentHTML("beforeend", arrowSvg(O[0], O[1], O[0] + v[0], O[1] + v[1], "g", 'stroke-dasharray="7 5"'));
    };

    let dragging = false;
    let pending = false;
    let gDrag = null;

    function setEnd(p) {
      api.vec = [p.x - O[0], p.y - O[1]];
      paintDraw(api.vec);
    }
    svg.style.touchAction = "none";
    svg.addEventListener("pointerdown", (e) => {
      const hit = e.target.closest(".ghost-hit");
      if (hit) {
        const gh = hit.__ghost;
        const p = evt(e);
        gDrag = { gh, off: [p.x - gh.tail[0], p.y - gh.tail[1]] };
        svg.setPointerCapture(e.pointerId);
        return;
      }
      if (!api.enabled) return;
      const p = snap(evt(e));
      if (pending) {
        pending = false;
        setEnd(p);
        if (api.onDraw) api.onDraw(api.vec);
        return;
      }
      if (Math.hypot(p.x - O[0], p.y - O[1]) > 0.9) {
        if (api.note) api.note("Beginne den Pfeil beim Punkt A.");
        return;
      }
      dragging = true;
      svg.setPointerCapture(e.pointerId);
      setEnd(p);
    });
    svg.addEventListener("pointermove", (e) => {
      if (gDrag) {
        const p = evt(e);
        const t = snap({ x: p.x - gDrag.off[0], y: p.y - gDrag.off[1] });
        gDrag.gh.move([t.x, t.y]);
        return;
      }
      if (dragging) setEnd(snap(evt(e)));
    });
    const up = () => {
      if (gDrag) {
        gDrag.gh.drop();
        gDrag = null;
        return;
      }
      if (!dragging) return;
      dragging = false;
      if (!api.vec || (api.vec[0] === 0 && api.vec[1] === 0)) {
        pending = true; // einmal getippt: jetzt den Endpunkt antippen
        if (api.note) api.note("Tippe jetzt den Endpunkt des Pfeils an.");
        return;
      }
      if (api.onDraw) api.onDraw(api.vec);
    };
    svg.addEventListener("pointerup", up);
    svg.addEventListener("pointercancel", up);

    // Ein Pfeil, den man verschieben kann (Kräfteparallelogramm)
    api.addGhost = (v, c, tail, label) => {
      const gh = { v, tail: tail.slice(), c, dropCb: null };
      const g = svgEl('<g class="ghost"><line class="ghost-hit" stroke="transparent" stroke-width="26"/><line class="ghost-ln" stroke-width="4" stroke-dasharray="8 5"/><text class="g-lab"></text></g>');
      const hit = g.querySelector(".ghost-hit");
      hit.__ghost = gh;
      const ln = g.querySelector(".ghost-ln");
      const tx = g.querySelector("text");
      const place = () => {
        const x1 = px(gh.tail[0]);
        const y1 = py(gh.tail[1]);
        const x2 = px(gh.tail[0] + v[0]);
        const y2 = py(gh.tail[1] + v[1]);
        [hit, ln].forEach((l) => {
          l.setAttribute("x1", x1);
          l.setAttribute("y1", y1);
          l.setAttribute("x2", x2);
          l.setAttribute("y2", y2);
        });
        ln.setAttribute("stroke", COL[c]);
        ln.setAttribute("marker-end", "url(#kg-ah-" + c + ")");
        tx.setAttribute("x", (x1 + x2) / 2 + (v[1] === 0 ? 0 : 10));
        tx.setAttribute("y", (y1 + y2) / 2 + (v[1] === 0 ? -9 : 0));
        tx.setAttribute("fill", COL[c]);
        tx.setAttribute("text-anchor", v[1] === 0 ? "middle" : "start");
        tx.textContent = label;
      };
      gh.move = (t) => {
        gh.tail = [clamp(t[0], 0, COLS - Math.max(0, v[0])), clamp(t[1], Math.max(0, -v[1]), ROWS - Math.max(0, v[1]))];
        place();
      };
      gh.drop = () => gh.dropCb && gh.dropCb([gh.tail[0] - O[0], gh.tail[1] - O[1]]);
      gh.lock = () => {
        hit.remove();
        g.classList.add("locked");
      };
      gh.remove = () => g.remove();
      place();
      ghosts.append(g);
      return gh;
    };
    return api;
  }

  // Eine Zeichenaufgabe. Gibt zurück, wenn gelöst (oder nach zwei Fehlversuchen die Lösung gezeigt wurde).
  function zeichnen(ctx, t) {
    return new Promise((resolve) => {
      const O = t.O;
      const board = gridBoard(O);
      board.setGiven(t.given || []);
      board.enabled = true;
      const msg = h("div", { class: "kg-fb hidden", role: "status" });
      const hint = h("p", { class: "kg-hint", role: "status", text: "Ziehe vom Punkt A aus zum Endpunkt (oder tippe Anfang und Ende an)." });
      const read = h("p", { class: "kg-read" });
      const check = h("button", { class: "kg-go", type: "button", text: "Prüfen", disabled: true });
      const clear = h("button", { class: "kg-go ghost", type: "button", text: "Neu zeichnen" });
      const host = h("div", { class: "det-quiz" });
      const sub = ctx.sub(host);
      let tries = 0;

      board.note = (s) => (hint.textContent = s);
      board.onDraw = (v) => {
        check.disabled = !v || (v[0] === 0 && v[1] === 0);
        if (v) read.innerHTML = "Dein Pfeil ist <b>" + fmt(Math.hypot(v[0], v[1]), 1) + " cm</b> lang.";
        else read.textContent = "";
      };
      clear.addEventListener("click", () => {
        board.clear();
        msg.className = "kg-fb hidden";
      });

      let step = 0;
      const steps = t.ghosts || [];
      const gl = [];

      function finishTask(ok) {
        board.enabled = false;
        check.remove();
        clear.remove();
        const go = async () => {
          if (t.ask) await sub.ask(t.ask(board.vec || t.expect), { tag: "Aufgabe" });
          sub.show(h("div", { class: "kg-actions" }, h("button", { class: "kg-go", type: "button", text: "Weiter", onclick: resolve })));
        };
        go();
      }

      check.addEventListener("click", () => {
        const v = board.vec;
        const e = t.expect;
        if (v && v[0] === e[0] && v[1] === e[1]) {
          board.paint(v, "g");
          msg.className = "kg-fb ok";
          msg.replaceChildren(h("p", { class: "kg-fb-h", text: "Richtig" }), h("p", { class: "kg-fb-w", html: t.why }));
          KG.util.addXp(tries ? 3 : 12);
          finishTask(true);
        } else {
          tries += 1;
          const len = v ? Math.hypot(v[0], v[1]) : 0;
          const want = Math.hypot(e[0], e[1]);
          const sameDir = v && v[0] * e[1] === v[1] * e[0] && v[0] * e[0] + v[1] * e[1] > 0;
          let why = "Das stimmt noch nicht.";
          if (sameDir) why = "Die Richtung stimmt, aber die Länge nicht: Der Pfeil muss " + fmt(want, 1) + " cm lang sein (" + fmt(want * 10, 0) + " N : 10 N/cm).";
          else why = "Die Richtung stimmt nicht.";
          if (t.addAdvice) why += " " + t.addAdvice;
          KG.util.addReview({ t: "num", q: t.reviewQ, a: want * 10, tol: 1, unit: "N", why: t.why });
          msg.className = "kg-fb bad";
          msg.replaceChildren(h("p", { class: "kg-fb-h", text: "Nicht ganz" }), h("p", { class: "kg-fb-w", text: why }));
          if (tries >= 2) {
            board.showAnswer(e);
            msg.append(h("p", { class: "kg-fb-w", html: "Gestrichelt siehst du die Lösung. " + t.why }));
            board.enabled = false;
            check.remove();
            clear.remove();
            msg.append(h("button", { class: "kg-go", type: "button", text: "Weiter", onclick: resolve }));
          }
        }
      });

      const card = h("div", { class: "kg-card" },
        h("p", { class: "kg-tag", text: t.tag }),
        h("p", { class: "kg-q", html: t.prompt }),
        h("p", { class: "kg-lead", html: "Massstab: <b>1 cm entspricht 10 N</b>" }),
        h("div", { class: "grid-wrap" }, board.el), read, hint,
        h("div", { class: "kg-actions" }, check, clear), msg, host);

      // Parallelogramm: erst die beiden Pfeile verschieben, dann die Resultierende zeichnen
      if (steps.length) {
        board.enabled = false;
        hint.textContent = "Schritt 1: Verschiebe die gestrichelten Pfeile so, dass sie zum Kräfteparallelogramm werden.";
        steps.forEach((s) => {
          const gh = board.addGhost(s.v, s.c, s.start, s.label);
          gh.dropCb = (rel) => {
            if (rel[0] === s.tail[0] && rel[1] === s.tail[1]) {
              gh.lock();
              KG.util.addXp(5);
              step += 1;
              msg.className = "kg-fb ok";
              msg.replaceChildren(h("p", { class: "kg-fb-h", text: "Passt" }), h("p", { class: "kg-fb-w", text: s.ok }));
              if (step === steps.length) {
                board.enabled = true;
                hint.textContent = "Schritt 2: Zeichne die Resultierende vom Punkt A zur gegenüberliegenden Ecke des Parallelogramms.";
              }
            } else {
              msg.className = "kg-fb bad";
              msg.replaceChildren(h("p", { class: "kg-fb-h", text: "Noch nicht" }), h("p", { class: "kg-fb-w", text: s.no }));
            }
          };
          gl.push(gh);
        });
      }
      ctx.show(card);
    });
  }

  KG.level({
    n: 5,
    name: "Pfeil-Konstrukteur",
    topic: "Kraftpfeile und Kräfteparallelogramm",
    goal: "Ich kann Kraftpfeile zeichnen (Angriffspunkt, Richtung, Betrag) und die resultierende Kraft bestimmen, auch mit dem Kräfteparallelogramm.",
    async run(ctx) {
      await ctx.intro("Pfeil-Konstrukteur", [
        "Kräfte zeichnet man als <b>Pfeile</b>. Ein Kraftpfeil hat drei Merkmale: <b>Angriffspunkt</b>, <b>Richtung</b> und <b>Betrag</b> (die Länge, passend zu einem Massstab).",
        "Mehrere Kräfte ersetzt man durch eine einzige, die <b>resultierende Kraft</b>. Gleiche Richtung: addieren. Entgegengesetzt: subtrahieren. Im Winkel: <b>Kräfteparallelogramm</b>.",
      ]);

      const FEAT = [
        { k: "A", q: "Welches Merkmal des Kraftpfeils zeigt der Punkt <b>A</b> am Anfang?", opts: ["Angriffspunkt", "Richtung", "Betrag", "Masse"], a: 0, why: "Der Anfang des Pfeils zeigt, wo die Kraft am Körper ansetzt: der Angriffspunkt." },
        { k: "B", q: "Welches Merkmal zeigt die Pfeilspitze <b>B</b>?", opts: ["Richtung", "Angriffspunkt", "Betrag", "Einheit"], a: 0, why: "Die Spitze zeigt, in welche Richtung die Kraft wirkt." },
        { k: "C", q: "Was sagt die Länge <b>C</b> des Pfeils aus?", opts: ["Den Betrag (die Grösse) der Kraft", "Den Angriffspunkt", "Die Richtung", "Die Masse des Körpers"], a: 0, why: "Je länger der Pfeil, desto grösser die Kraft. Mit dem Massstab (z. B. 1 cm = 10 N) liest man den Betrag ab." },
      ];
      for (const f of FEAT) {
        await ctx.ask({ t: "mc", q: f.q, opts: f.opts, a: f.a, why: f.why }, { extra: featSvg(f.k), tag: "Merkmale" });
      }
      ctx.progress(0.2);

      const tasks = [
        {
          tag: "Pfeil zeichnen 1 von 2", O: [1, 3], prompt: "Zeichne eine Kraft von <b>30 N</b> nach <b>rechts</b>.", expect: [3, 0],
          why: "30 N : 10 N/cm = 3 cm. Der Pfeil geht 3 Kästchen nach rechts.", reviewQ: "Wie lang (in N) ist ein Kraftpfeil mit 3 cm bei 1 cm = 10 N?",
        },
        {
          tag: "Pfeil zeichnen 2 von 2", O: [3, 1], prompt: "Zeichne eine Kraft von <b>40 N</b> nach <b>oben</b>.", expect: [0, 4],
          why: "40 N : 10 N/cm = 4 cm. Der Pfeil geht 4 Kästchen nach oben.", reviewQ: "Wie lang (in N) ist ein Kraftpfeil mit 4 cm bei 1 cm = 10 N?",
        },
        {
          tag: "Gleiche Richtung", O: [1, 3], prompt: "Zwei Kräfte ziehen in <b>dieselbe Richtung</b>: <b>F₁ = 20 N</b> und <b>F₂ = 30 N</b>. Zeichne die <b>resultierende Kraft</b> vom Punkt A aus.",
          given: [{ v: [2, 0], c: "b", label: "F₁ = 20 N", from: [1, 4] }, { v: [3, 0], c: "g", label: "F₂ = 30 N", from: [1, 2] }], expect: [5, 0],
          why: "Gleiche Richtung: Die Beträge werden addiert. 20 N + 30 N = 50 N, also 5 cm nach rechts.", reviewQ: "Zwei Kräfte (20 N und 30 N) wirken in dieselbe Richtung. Wie gross ist die resultierende Kraft?",
          ask: () => ({ t: "num", q: "Wie gross ist die resultierende Kraft?", a: 50, tol: 1, unit: "N", why: "20 N + 30 N = 50 N." }),
        },
        {
          tag: "Entgegengesetzte Richtung", O: [4, 3], prompt: "<b>F₁ = 40 N</b> zieht nach rechts, <b>F₂ = 20 N</b> nach links. Zeichne die <b>resultierende Kraft</b> vom Punkt A aus.",
          given: [{ v: [4, 0], c: "b", label: "F₁ = 40 N", from: [4, 4] }, { v: [-2, 0], c: "g", label: "F₂ = 20 N", from: [4, 2] }], expect: [2, 0],
          why: "Entgegengesetzte Richtung: Die Beträge werden subtrahiert. 40 N − 20 N = 20 N, in Richtung der grösseren Kraft, also 2 cm nach rechts.", reviewQ: "Zwei Kräfte (40 N nach rechts, 20 N nach links) wirken. Wie gross ist die resultierende Kraft?",
          ask: () => ({ t: "num", q: "In welche Richtung zeigt die resultierende Kraft? Gib ihren Betrag an.", a: 20, tol: 1, unit: "N", why: "40 N − 20 N = 20 N, in Richtung der grösseren Kraft (nach rechts)." }),
        },
      ];
      for (let i = 0; i < tasks.length; i++) {
        await zeichnen(ctx, tasks[i]);
        ctx.progress(0.2 + (0.5 * (i + 1)) / tasks.length);
      }

      const para = [
        {
          tag: "Kräfteparallelogramm 1 von 2", O: [1, 1],
          prompt: "Zwei Kräfte greifen im Punkt A an, im rechten Winkel: <b>F₁ = 40 N</b> nach rechts, <b>F₂ = 30 N</b> nach oben. Konstruiere die <b>resultierende Kraft</b>.",
          given: [{ v: [4, 0], c: "b", label: "F₁ = 40 N" }, { v: [0, 3], c: "g", label: "F₂ = 30 N" }],
          ghosts: [
            { v: [0, 3], c: "g", label: "F₂", start: [7, 2], tail: [4, 0], ok: "F₂ sitzt an der Spitze von F₁.", no: "Schiebe F₂ so, dass sein Anfang an der Spitze von F₁ liegt." },
            { v: [4, 0], c: "b", label: "F₁", start: [5, 5], tail: [0, 3], ok: "F₁ sitzt an der Spitze von F₂. Das Parallelogramm ist komplett.", no: "Schiebe F₁ so, dass sein Anfang an der Spitze von F₂ liegt." },
          ],
          expect: [4, 3],
          why: "Die Resultierende ist die Diagonale des Parallelogramms: von A zur gegenüberliegenden Ecke.",
          reviewQ: "Zwei Kräfte (40 N und 30 N) wirken im rechten Winkel. Wie gross ist die resultierende Kraft?",
          ask: () => ({ t: "num", q: "Dein Pfeil ist <b>5.0 cm</b> lang. Wie gross ist die resultierende Kraft (1 cm = 10 N)?", a: 50, tol: 1, unit: "N", why: "5.0 cm · 10 N/cm = 50 N. Das passt zu 3-4-5: √(30² + 40²) = 50." }),
        },
        {
          tag: "Kräfteparallelogramm 2 von 2", O: [1, 1],
          prompt: "Jetzt im schrägen Winkel: <b>F₁ = 30 N</b> nach rechts, <b>F₂</b> zeigt 2 cm nach rechts und 3 cm nach oben (36 N). Konstruiere die <b>resultierende Kraft</b>.",
          given: [{ v: [3, 0], c: "b", label: "F₁ = 30 N" }, { v: [2, 3], c: "g", label: "F₂ = 36 N" }],
          ghosts: [
            { v: [2, 3], c: "g", label: "F₂", start: [6, 1], tail: [3, 0], ok: "F₂ sitzt an der Spitze von F₁.", no: "Schiebe F₂ so, dass sein Anfang an der Spitze von F₁ liegt." },
            { v: [3, 0], c: "b", label: "F₁", start: [5, 5], tail: [2, 3], ok: "Das Parallelogramm ist komplett.", no: "Schiebe F₁ so, dass sein Anfang an der Spitze von F₂ liegt." },
          ],
          expect: [5, 3],
          why: "Die Diagonale des Parallelogramms geht 5 cm nach rechts und 3 cm nach oben.",
          reviewQ: "Zwei Kräfte (30 N und 36 N) wirken im schrägen Winkel. Wie gross ist die resultierende Kraft?",
          ask: () => ({ t: "num", q: "Dein Pfeil ist etwa <b>5.8 cm</b> lang (√(5² + 3²)). Wie gross ist die resultierende Kraft?", a: Math.hypot(5, 3) * 10, tol: 3, unit: "N", why: "5.83 cm · 10 N/cm ≈ 58 N. Beachte: Das ist weniger als 30 N + 36 N = 66 N, weil die Kräfte nicht in dieselbe Richtung zeigen." }),
        },
      ];
      for (let i = 0; i < para.length; i++) {
        await zeichnen(ctx, para[i]);
        ctx.progress(0.7 + (0.25 * (i + 1)) / para.length);
      }
      await ctx.quiz([
        { t: "mc", q: "Zwei Kräfte mit 50 N und 20 N zeigen in entgegengesetzte Richtungen. Wie gross ist die resultierende Kraft?", opts: ["30 N, in Richtung der grösseren Kraft", "70 N", "30 N, in Richtung der kleineren Kraft", "0 N"], a: 0, why: "Entgegengesetzt: subtrahieren, 50 N − 20 N = 30 N. Die grössere Kraft bestimmt die Richtung." },
        { t: "mc", q: "Wann ist die resultierende Kraft null?", opts: ["Wenn zwei Kräfte gleich gross sind und entgegengesetzt wirken", "Wenn nur eine Kraft wirkt", "Wenn die Kräfte in dieselbe Richtung zeigen", "Nie"], a: 0, why: "Gleich grosse, entgegengesetzte Kräfte heben sich auf: Gleichgewicht." },
      ]);
      await ctx.finish();
    },
  });
})();
