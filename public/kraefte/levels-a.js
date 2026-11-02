"use strict";

// Kräfte-Spiel, Level 1 bis 3: Kraftwirkungen, Gewichtskraft, Reibung.

(() => {
  const { h, svgEl, shuffle, pick, clamp, fmt, springTo, arrowDefs, calm } = KG.util;

  const svg = (cls, vb, inner) => '<svg viewBox="' + vb + '" class="' + cls + '" aria-hidden="true" focusable="false">' + inner + "</svg>";

  // Federlinie von x0 bis x1 auf Höhe y (für Zeichnungen)
  function spring(x0, x1, y, coils, amp) {
    const pts = [[x0, y], [x0 + 8, y]];
    const run = x1 - x0 - 16;
    for (let i = 0; i < coils * 2; i++) pts.push([x0 + 8 + ((i + 0.5) * run) / (coils * 2), y + (i % 2 ? amp : -amp)]);
    pts.push([x1 - 8, y], [x1, y]);
    return pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  }

  /* =====================================================================
     Level 1: Werkstatt, Kraftwirkungen
     ===================================================================== */

  const SZENEN = [
    {
      zone: "elastisch",
      cap: "Eine Feder wird gedehnt und schnellt zurück.",
      why: "Die Feder nimmt ihre alte Form wieder an, sobald die Kraft weg ist. Das ist eine elastische Verformung.",
      svg: svg("sc", "0 0 160 100",
        '<rect class="s-floor" x="6" y="22" width="7" height="56" rx="2"/><g class="a-feder"><polyline class="s-coil" points="' + spring(13, 90, 50, 5, 13) + '"/></g><rect class="s-blk a-feder-blk" x="90" y="38" width="24" height="24" rx="4"/>'),
    },
    {
      zone: "elastisch",
      cap: "Ein Sprungbrett biegt sich durch und federt zurück.",
      why: "Das Brett wird verbogen, kehrt danach aber in seine Form zurück. Elastische Verformung.",
      svg: svg("sc", "0 0 160 100",
        '<rect class="s-blk" x="8" y="58" width="26" height="32" rx="3"/><path class="s-board" fill="none" d="M30 56 Q85 56 142 56"><animate attributeName="d" dur="3.2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.35;0.55;0.7;1" keySplines="0.4 0 0.2 1;0.3 0 0.2 1;0.3 0 0.5 1;0.3 0 0.5 1" values="M30 56 Q85 56 142 56;M30 56 Q88 62 142 84;M30 56 Q85 53 142 48;M30 56 Q85 57 142 60;M30 56 Q85 56 142 56"/></path><circle class="s-ball" r="7" cx="140"><animate attributeName="cy" dur="3.2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.35;0.55;0.7;1" keySplines="0.4 0 0.2 1;0.3 0 0.2 1;0.3 0 0.5 1;0.3 0 0.5 1" values="46;74;38;50;46"/></circle>'),
    },
    {
      zone: "plastisch",
      cap: "Knete wird zusammengedrückt und bleibt platt.",
      why: "Die Knete behält die neue Form, auch wenn die Kraft weg ist. Das ist eine plastische Verformung.",
      svg: svg("sc", "0 0 160 100",
        '<rect class="s-floor" x="10" y="82" width="140" height="6" rx="3"/><g class="a-stamp"><rect class="s-blk" x="52" y="6" width="56" height="12" rx="3"/><rect class="s-blk" x="76" y="-16" width="8" height="24"/></g><ellipse class="s-clay a-clay" cx="80" cy="64" rx="22" ry="18"/>'),
    },
    {
      zone: "plastisch",
      cap: "Eine Blechdose wird zertreten.",
      why: "Die Dose bleibt zerdrückt, die Verformung geht nicht zurück. Plastische Verformung.",
      svg: svg("sc", "0 0 160 100",
        '<rect class="s-floor" x="10" y="82" width="140" height="6" rx="3"/><g class="a-stamp"><rect class="s-blk" x="48" y="6" width="64" height="12" rx="3"/><rect class="s-blk" x="76" y="-16" width="8" height="24"/></g><g class="a-clay a-can"><rect class="s-can" x="64" y="36" width="32" height="46" rx="4"/><line class="s-rib" x1="64" y1="46" x2="96" y2="46"/><line class="s-rib" x1="64" y1="72" x2="96" y2="72"/></g>'),
    },
    {
      zone: "beschleunigen",
      cap: "Ein Wagen wird angeschoben und wird immer schneller.",
      why: "Die Kraft zeigt in Bewegungsrichtung, die Geschwindigkeit wächst: Der Wagen wird beschleunigt.",
      svg: svg("sc", "0 0 160 100",
        arrowDefs + '<rect class="s-floor" x="4" y="84" width="152" height="4" rx="2"/><g class="a-acc"><g class="a-lines"><line class="s-line" x1="-2" y1="62" x2="-30" y2="62"/><line class="s-line" x1="-2" y1="70" x2="-24" y2="70"/></g><rect class="s-blk" x="20" y="52" width="38" height="20" rx="4"/><circle class="s-wheel" cx="29" cy="76" r="6"/><circle class="s-wheel" cx="49" cy="76" r="6"/><line class="s-arrow-g" x1="2" y1="62" x2="18" y2="62" marker-end="url(#kg-ah-g)"/></g>'),
    },
    {
      zone: "bremsen",
      cap: "Ein Wagen wird abgebremst, bis er steht.",
      why: "Die Kraft zeigt gegen die Bewegung, der Wagen wird langsamer: Er wird gebremst.",
      svg: svg("sc", "0 0 160 100",
        arrowDefs + '<rect class="s-floor" x="4" y="84" width="152" height="4" rx="2"/><g class="a-brake"><g class="a-lines2"><line class="s-line" x1="-2" y1="62" x2="-30" y2="62"/><line class="s-line" x1="-2" y1="70" x2="-24" y2="70"/></g><rect class="s-blk" x="20" y="52" width="38" height="20" rx="4"/><circle class="s-wheel" cx="29" cy="76" r="6"/><circle class="s-wheel" cx="49" cy="76" r="6"/><line class="s-arrow-r" x1="76" y1="62" x2="60" y2="62" marker-end="url(#kg-ah-r)"/></g>'),
    },
    {
      zone: "richtung",
      cap: "Ein rollender Ball trifft auf einen schrägen Schläger.",
      why: "Der Ball wird nicht schneller oder langsamer, er fliegt danach in eine andere Richtung: Richtungsänderung.",
      svg: svg("sc", "0 0 160 100",
        '<rect class="s-floor" x="4" y="84" width="152" height="4" rx="2"/><line class="s-bat" x1="86" y1="84" x2="114" y2="56"/><circle class="s-ball a-dir" cx="20" cy="76" r="7"/>'),
    },
  ];

  const KATS = [
    { id: "elastisch", name: "elastische Verformung", sub: "Form kommt zurück" },
    { id: "plastisch", name: "plastische Verformung", sub: "Form bleibt" },
    { id: "beschleunigen", name: "beschleunigen", sub: "wird schneller" },
    { id: "bremsen", name: "bremsen", sub: "wird langsamer" },
    { id: "richtung", name: "Richtungsänderung", sub: "fliegt woandershin" },
  ];

  // Kraft-Labor: Feder und Wagen. Eine Kraft, zwei Wirkungen.
  function kraftLabor(ctx, done) {
    const MAX = 10; // N
    const CM = 12; // px je cm Dehnung (1 N dehnt die Feder um 1 cm)
    const X0 = 14;
    const L0 = 100; // Ruhelänge der Feder in px
    let F = 3;
    const pushed = [];
    const seen = new Set([3]);

    const ticks = [];
    for (let c = 0; c <= MAX; c++) ticks.push('<line class="s-tick" x1="' + (X0 + L0 + c * CM) + '" x2="' + (X0 + L0 + c * CM) + '" y1="104" y2="' + (c % 2 ? 110 : 116) + '"/>' + (c % 2 ? "" : '<text class="s-tx" x="' + (X0 + L0 + c * CM) + '" y="130" text-anchor="middle">' + c + "</text>"));
    const fed = svgEl(svg("lab-svg", "0 0 400 150",
      arrowDefs + '<rect class="s-floor" x="4" y="26" width="7" height="68" rx="2"/><polyline id="l1-coil" class="s-coil" points=""/><rect id="l1-blk" class="s-blk" x="0" y="48" width="26" height="26" rx="4"/><line id="l1-arr" class="s-arrow-b" x1="0" y1="61" x2="0" y2="61" marker-end="url(#kg-ah-b)"/>' + ticks.join("") + '<text class="s-tx" x="' + (X0 + L0 + 5 * CM) + '" y="146" text-anchor="middle">Dehnung in cm</text>'));

    const M2 = 2; // kg
    const trackX = 20;
    const PX = 30; // px je m
    const wagen = svgEl(svg("lab-svg", "0 0 400 90",
      '<rect class="s-floor" x="4" y="62" width="392" height="4" rx="2"/>' +
      Array.from({ length: 11 }, (_, i) => '<line class="s-tick" x1="' + (trackX + 40 + i * PX) + '" x2="' + (trackX + 40 + i * PX) + '" y1="66" y2="72"/>' + (i % 2 ? "" : '<text class="s-tx" x="' + (trackX + 40 + i * PX) + '" y="86" text-anchor="middle">' + i + " m</text>")).join("") +
      '<g id="l1-cart"><rect class="s-blk" x="' + trackX + '" y="30" width="40" height="22" rx="4"/><circle class="s-wheel" cx="' + (trackX + 10) + '" cy="56" r="6"/><circle class="s-wheel" cx="' + (trackX + 30) + '" cy="56" r="6"/><text class="s-tx on" x="' + (trackX + 20) + '" y="46" text-anchor="middle">2 kg</text></g>'));

    const slider = h("input", { type: "range", min: "0", max: String(MAX), step: "0.5", value: String(F), "aria-label": "Grösse der Kraft in Newton" });
    const out = h("p", { class: "kg-read" });
    const push = h("button", { class: "kg-go ghost", type: "button", text: "Wagen anschieben" });
    const note = h("p", { class: "kg-hint" });

    function drawSpring() {
      const L = L0 + F * CM;
      fed.querySelector("#l1-coil").setAttribute("points", spring(X0, X0 + L, 61, 6, 14));
      fed.querySelector("#l1-blk").setAttribute("x", X0 + L);
      const a = fed.querySelector("#l1-arr");
      a.setAttribute("x1", X0 + L + 26 + 2);
      a.setAttribute("x2", X0 + L + 26 + 2 + (F > 0 ? 14 + F * 3 : 0));
      a.style.opacity = F > 0 ? 1 : 0;
      out.innerHTML = "Kraft <b>F = " + fmt(F, 1) + " N</b> &nbsp;·&nbsp; Dehnung der Feder <b>" + fmt(F, 1) + " cm</b>";
    }

    let cartX = 0;
    let busy = false;
    function setCart(m) {
      cartX = m;
      wagen.querySelector("#l1-cart").setAttribute("transform", "translate(" + m * PX + ",0)");
    }
    function run() {
      if (busy) return;
      busy = true;
      setCart(0);
      const s = (F / M2) * 0.5 * 4; // a = F/m, nach t = 2 s: s = ½·a·t²
      const T = 1800;
      const t0 = performance.now();
      const step = () => {
        if (!ctx.alive()) return;
        const t = clamp((performance.now() - t0) / T, 0, 1);
        setCart(s * t * t);
        if (t < 1) requestAnimationFrame(step);
        else {
          busy = false;
          note.textContent = "Mit " + fmt(F, 1) + " N kommt der Wagen (2 kg, ohne Reibung) in 2 s " + fmt(s, 1) + " m weit.";
          pushed.push(F);
          check();
        }
      };
      requestAnimationFrame(step);
    }
    const ready = h("button", { class: "kg-go hidden", type: "button", text: "Das habe ich verstanden" });
    function check() {
      if (pushed.length >= 2 && seen.size >= 3) ready.classList.remove("hidden");
    }
    slider.addEventListener("input", () => {
      F = +slider.value;
      seen.add(F);
      drawSpring();
      check();
    });
    push.addEventListener("click", run);
    ready.addEventListener("click", done);
    drawSpring();
    setCart(0);
    const box = h("div", { class: "kg-card kg-labcard" },
      h("p", { class: "kg-tag", text: "Versuch" }),
      h("h2", { class: "kg-h", text: "Je grösser die Kraft, desto grösser die Wirkung" }),
      h("p", { text: "Verändere die Kraft mit dem Regler. Probiere mindestens drei Werte aus und schiebe den Wagen zweimal an." }),
      fed, out, h("label", { class: "kg-slider" }, h("span", { text: "Kraft" }), slider), wagen, push, note, ready);
    return box;
  }

  KG.level({
    n: 1,
    name: "Werkstatt",
    topic: "Kraftwirkungen",
    goal: "Ich kann Kraftwirkungen unterscheiden (elastisch und plastisch verformen, beschleunigen, bremsen, Richtung ändern) und weiss: Eine grössere Kraft hat eine grössere Wirkung.",
    async run(ctx) {
      await ctx.intro("Werkstatt", [
        "Das erste Modul ist dunkel. Hier prüfst du, was eine <b>Kraft</b> überhaupt bewirken kann.",
        "Eine Kraft kann einen Körper <b>verformen</b> oder seine <b>Bewegung ändern</b>. Gemessen wird sie in <b>Newton (N)</b>.",
      ]);

      const items = SZENEN.map((s) => {
        const face = h("div", { class: "kg-scene" });
        face.innerHTML = s.svg;
        face.append(h("p", { text: s.cap }));
        calm(face);
        return { face, label: s.cap, zone: s.zone, why: s.why };
      });
      await ctx.sort({ items, zones: KATS, lead: "Welche <b>Kraftwirkung</b> siehst du?" });

      await new Promise((resolve) => {
        ctx.progress(0.7);
        const box = kraftLabor(ctx, resolve);
        ctx.show(box);
      });

      ctx.progress(0.85);
      await ctx.quiz([
        { t: "mc", q: "Eine Feder wird mit 3 N gedehnt, dann mit 6 N. Was passiert mit der Dehnung?", opts: ["Sie wird etwa doppelt so gross.", "Sie bleibt gleich.", "Sie wird nur halb so gross.", "Die Feder wird kürzer."], a: 0, why: "Bei einer elastischen Feder ist die Dehnung proportional zur Kraft: doppelte Kraft, doppelte Dehnung." },
        { t: "mc", q: "Mit einer grösseren Kraft wird derselbe Wagen angeschoben. Was ist die Folge?", opts: ["Er wird stärker beschleunigt und ist schneller.", "Er wird langsamer.", "Nichts, die Kraft spielt keine Rolle.", "Er ändert nur die Farbe."], a: 0, why: "Je grösser die Kraft, desto grösser die Wirkung. Hier ist es die Beschleunigung." },
        { t: "mc", q: "Eine Büroklammer wird weit aufgebogen und bleibt verbogen. Welche Verformung ist das?", opts: ["plastisch", "elastisch", "gar keine", "bremsend"], a: 0, why: "Bleibt die Form nach der Kraft verändert, ist es eine plastische Verformung. Wird eine Feder zu stark gezogen, kann sie ebenfalls plastisch verformt werden." },
        { t: "mc", q: "In welcher Einheit wird eine Kraft gemessen?", opts: ["Newton (N)", "Kilogramm (kg)", "Meter (m)", "Sekunde (s)"], a: 0, why: "Die Einheit der Kraft ist das Newton. Kilogramm ist die Einheit der Masse." },
      ]);
      await ctx.finish();
    },
  });

  /* =====================================================================
     Level 2: Schwerkraft-Labor, Gewichtskraft
     ===================================================================== */

  function schwerkraftLabor(ctx) {
    const MAXN = 20; // Skala bis 20 N
    const TOP = 30;
    const PXN = 8.1; // px je N
    const MASSEN = [0.05, 0.1, 0.2, 0.5, 1];
    const hung = [];
    let planet = Phys.planet("erde");

    const ticks = [];
    for (let n = 0; n <= MAXN; n += 2) ticks.push('<line class="s-tick" x1="112" x2="' + (n % 10 ? 120 : 126) + '" y1="' + (TOP + n * PXN) + '" y2="' + (TOP + n * PXN) + '"/><text class="s-tx" x="132" y="' + (TOP + n * PXN + 4) + '">' + n + "</text>");
    const fig = svgEl(svg("kraftmesser", "0 0 200 380",
      '<rect class="s-tube" x="68" y="8" width="44" height="204" rx="10"/>' + ticks.join("") +
      '<text class="s-tx" x="150" y="20">N</text>' +
      '<polyline id="l2-coil" class="s-coil" points=""/><rect id="l2-plate" class="s-blk" x="72" y="0" width="36" height="6" rx="2"/>' +
      '<line id="l2-rod" class="s-rod" x1="90" x2="90" y1="0" y2="0"/><path id="l2-hook" class="s-hook" d="" fill="none"/><g id="l2-load"></g>'));

    let y = 0; // aktuelle Zeigerhöhe in N (animiert)
    function draw(Fn) {
      y = Fn;
      const yp = TOP + clamp(Fn, 0, MAXN + 1) * PXN;
      fig.querySelector("#l2-coil").setAttribute("points", spring(0, yp - 16, 0, 5, 9).split(" ").map((p) => { const [a, b] = p.split(","); return (90 + +b) + "," + (16 + +a); }).join(" "));
      const plate = fig.querySelector("#l2-plate");
      plate.setAttribute("y", yp - 8);
      fig.querySelector("#l2-rod").setAttribute("y1", yp - 2);
      fig.querySelector("#l2-rod").setAttribute("y2", yp + 26);
      fig.querySelector("#l2-hook").setAttribute("d", "M90 " + (yp + 26) + " v6 a5 5 0 1 1 -5 5");
      fig.querySelector("#l2-load").setAttribute("transform", "translate(0," + (yp + 44) + ")");
    }

    const out = h("div", { class: "kg-read big" });
    const info = h("p", { class: "kg-hint" });
    const chips = h("div", { class: "kg-chips" });
    const planets = h("div", { class: "kg-seg", role: "radiogroup", "aria-label": "Planet" });

    const total = () => hung.reduce((s, m) => s + m, 0);
    function refresh(animate) {
      const m = total();
      const F = Phys.gewichtskraft(m, planet.g);
      const load = fig.querySelector("#l2-load");
      load.innerHTML = hung.map((mm, i) => {
        const w = 34 + 20 * Math.sqrt(mm);
        return '<g><rect class="s-mass" x="' + (90 - w / 2) + '" y="' + i * 17 + '" width="' + w + '" height="15" rx="3"/><text class="s-tx on" x="90" y="' + (i * 17 + 11) + '" text-anchor="middle">' + (mm >= 1 ? fmt(mm) + " kg" : fmt(mm * 1000, 0) + " g") + "</text></g>";
      }).join("");
      out.innerHTML = "<div><small>Masse m</small><b>" + fmt(m, 2) + " kg</b></div><div><small>Ortsfaktor g</small><b>" + fmt(planet.g, 2) + " N/kg</b></div><div class=\"hl\"><small>Gewichtskraft F<sub>G</sub></small><b>" + fmt(F, 2) + " N</b></div>";
      info.innerHTML = m ? "F<sub>G</sub> = m · g = " + fmt(m, 2) + " kg · " + fmt(planet.g, 2) + " N/kg = <b>" + fmt(F, 2) + " N</b>" : "Hänge Massestücke an den Kraftmesser.";
      const bottom = TOP + clamp(F, 0, MAXN + 1) * PXN + 44 + hung.length * 17 + 14;
      fig.setAttribute("viewBox", "0 0 200 " + Math.max(250, Math.round(bottom)));
      if (animate) springTo(y, F, draw, ctx.alive);
      else draw(F);
      chips.querySelectorAll("button.add").forEach((b) => (b.disabled = hung.length >= 6 || m + +b.dataset.m > 2.0001));
    }

    MASSEN.forEach((m) => {
      chips.append(h("button", { class: "kg-chip add", type: "button", "data-m": m, text: (m >= 1 ? fmt(m) + " kg" : fmt(m * 1000, 0) + " g"), onclick: () => { hung.push(m); refresh(true); } }));
    });
    chips.append(h("button", { class: "kg-chip ghost", type: "button", text: "Leeren", onclick: () => { hung.length = 0; refresh(true); } }));

    Phys.PLANETEN.forEach((p) => {
      const b = h("button", { class: "kg-segb" + (p === planet ? " on" : ""), type: "button", role: "radio", "aria-checked": p === planet ? "true" : "false" }, h("b", { text: p.name }), h("small", { text: fmt(p.g, 2) + " N/kg" }));
      b.addEventListener("click", () => {
        planet = p;
        planets.querySelectorAll("button").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b ? "true" : "false"); });
        refresh(true);
      });
      planets.append(b);
    });

    draw(0);
    refresh(false);
    const lab = h("div", { class: "kg-lab2" }, h("div", { class: "kg-fig" }, fig), h("div", { class: "kg-ctl" }, h("p", { class: "kg-ctl-l", text: "Ort" }), planets, h("p", { class: "kg-ctl-l", text: "Masse anhängen" }), chips, out, info));
    return h("div", { class: "kg-card kg-labcard" }, h("p", { class: "kg-tag", text: "Kraftmesser" }), h("h2", { class: "kg-h", text: "Wie viel zieht die Masse nach unten?" }), lab);
  }

  KG.level({
    n: 2,
    name: "Schwerkraft-Labor",
    topic: "Gewichtskraft",
    goal: "Ich kann Masse und Gewichtskraft unterscheiden und die Gewichtskraft mit F_G = m · g berechnen.",
    async run(ctx) {
      ctx.show(h("div", { class: "kg-card kg-intro" }, h("h2", { class: "kg-h", text: "Schwerkraft-Labor" }),
        h("p", { html: "Alles, was eine Masse hat, wird von der Erde angezogen. Diese Kraft heisst <b>Gewichtskraft F<sub>G</sub></b>." }),
        h("div", { class: "kg-compare" },
          h("div", {}, h("b", { text: "Masse m" }), h("ul", {}, h("li", { text: "Einheit: Kilogramm (kg)" }), h("li", { text: "Gemessen mit der Waage" }), h("li", { html: "<b>Überall gleich</b>, auch auf dem Mond" }))),
          h("div", {}, h("b", { html: "Gewichtskraft F<sub>G</sub>" }), h("ul", {}, h("li", { text: "Einheit: Newton (N)" }), h("li", { text: "Gemessen mit dem Kraftmesser" }), h("li", { html: "<b>Hängt vom Ort ab</b>" })))),
        h("p", { class: "kg-formula", html: "F<sub>G</sub> = m · g" }),
        h("p", { html: "<b>g</b> ist der Ortsfaktor: Erde 9.81 N/kg, Mond 1.62 N/kg, Mars 3.71 N/kg." })));
      await ctx.cont("Zum Kraftmesser");

      const lab = schwerkraftLabor(ctx);
      const tasks = h("div", { class: "kg-tasks" });
      ctx.show(h("div", { class: "kg-split" }, lab, tasks));
      const sub = ctx.sub(tasks);

      const mars = Phys.planet("mars").g;
      const mond = Phys.planet("mond").g;
      const calc = pick([{ m: 2, p: "mars" }, { m: 3, p: "mars" }, { m: 0.8, p: "mond" }, { m: 5, p: "mond" }]);
      const g = Phys.planet(calc.p).g;
      const fc = Phys.gewichtskraft(calc.m, g);
      const list = [
        { t: "num", q: "Stelle die <b>Erde</b> ein und hänge <b>500 g</b> an. Wie viel zeigt der Kraftmesser an?", a: Phys.gewichtskraft(0.5, 9.81), tol: 0.1, unit: "N", why: "F<sub>G</sub> = 0.5 kg · 9.81 N/kg = 4.9 N. Wichtig: 500 g sind 0.5 kg." },
        { t: "num", q: "Berechne die Gewichtskraft von <b>" + fmt(calc.m) + " kg</b> auf dem <b>" + Phys.planet(calc.p).name + "</b> (g = " + fmt(g) + " N/kg).", a: fc, tol: Math.max(0.03, fc * 0.012), unit: "N", why: "F<sub>G</sub> = m · g = " + fmt(calc.m) + " kg · " + fmt(g) + " N/kg = " + fmt(fc) + " N." },
        { t: "num", q: "Eine Person hat eine Masse von <b>70 kg</b>. Wie gross ist ihre Gewichtskraft auf der <b>Erde</b>?", a: 70 * 9.81, tol: 5, unit: "N", why: "F<sub>G</sub> = 70 kg · 9.81 N/kg = 686.7 N, also rund 687 N." },
        { t: "mc", q: "Ein Stein hat auf der Erde die Masse 3 kg. Wie gross ist seine <b>Masse</b> auf dem Mond?", opts: ["3 kg, die Masse ändert sich nicht", "0.5 kg, auf dem Mond ist alles leichter", "4.86 kg", "0 kg, es gibt keine Schwerkraft"], a: 0, why: "Die Masse gibt an, wie viel Stoff im Stein steckt. Das ist überall gleich. Nur die <b>Gewichtskraft</b> ändert sich." },
        { t: "num", q: "Und wie gross ist die <b>Gewichtskraft</b> dieses 3-kg-Steins auf dem <b>Mond</b> (g = 1.62 N/kg)?", a: 3 * mond, tol: 0.05, unit: "N", why: "F<sub>G</sub> = 3 kg · 1.62 N/kg = 4.86 N. Auf der Erde wären es 29.4 N." },
        { t: "num", q: "Auf dem <b>Mars</b> zeigt der Kraftmesser <b>18.55 N</b> an. Welche Masse hängt daran?", a: 18.55 / mars, tol: 0.05, unit: "kg", why: "m = F<sub>G</sub> : g = 18.55 N : 3.71 N/kg = 5 kg." },
        { t: "mc", q: "Welche Aussage stimmt?", opts: ["Die Masse ist überall gleich, die Gewichtskraft hängt vom Ort ab.", "Masse und Gewichtskraft ändern sich mit dem Ort.", "Masse und Gewichtskraft sind überall gleich.", "Die Masse ändert sich mit dem Ort, die Gewichtskraft nicht."], a: 0, why: "Masse (kg) = wie viel Stoff. Gewichtskraft (N) = wie stark der Himmelskörper daran zieht. Das hängt vom Ortsfaktor g ab." },
        { t: "mc", q: "Warum ist die Gewichtskraft auf dem Mond kleiner als auf der Erde?", opts: ["Der Mond hat einen kleineren Ortsfaktor g und zieht schwächer.", "Alle Körper verlieren auf dem Mond Masse.", "Auf dem Mond gibt es keine Anziehung.", "Der Kraftmesser geht auf dem Mond falsch."], a: 0, why: "Der Mond hat weniger Masse als die Erde und zieht deshalb schwächer: g = 1.62 N/kg statt 9.81 N/kg." },
      ];
      for (let i = 0; i < list.length; i++) {
        ctx.progress(i / list.length);
        let r = await sub.ask(list[i], { tag: "Aufgabe " + (i + 1) + " von " + list.length });
        if (!r.ok) {
          await sub.ask(list[i], { attempt: 1 });
        }
      }
      await ctx.finish();
    },
  });

  /* =====================================================================
     Level 3: Rutschbahn, Reibung
     ===================================================================== */

  function rutschLabor(ctx) {
    const M = 50; // kg
    const G = 9.81;
    const MAXF = 300;
    let F = 0;
    let v = 0;
    let dist = 0;
    let art = "boden";
    let last = performance.now();
    let state = { reibung: 0, art: "Haftreibung" };

    const fig = svgEl(svg("lab-svg", "0 0 400 170",
      arrowDefs +
      '<rect class="s-ground" x="0" y="124" width="400" height="46"/><g id="l3-dash"></g>' +
      '<g id="l3-wheels" class="hidden"><circle class="s-wheel" cx="162" cy="120" r="6"/><circle class="s-wheel" cx="198" cy="120" r="6"/></g>' +
      '<rect id="l3-crate" class="s-crate" x="150" y="68" width="60" height="50" rx="3"/><line class="s-rib" x1="150" y1="68" x2="210" y2="118"/><line class="s-rib" x1="210" y1="68" x2="150" y2="118"/><text class="s-tx on" x="180" y="98" text-anchor="middle">50 kg</text>' +
      '<line id="l3-push" class="s-arrow-b" x1="0" y1="93" x2="0" y2="93" marker-end="url(#kg-ah-b)"/><text id="l3-pushl" class="s-tx b" x="0" y="82">F</text>' +
      '<line id="l3-fric" class="s-arrow-r" x1="0" y1="146" x2="0" y2="146" marker-end="url(#kg-ah-r)"/><text id="l3-fricl" class="s-tx r" x="0" y="164">F<tspan baseline-shift="sub" font-size="9">R</tspan></text>'));

    const dash = fig.querySelector("#l3-dash");
    for (let i = 0; i < 14; i++) dash.insertAdjacentHTML("beforeend", '<line class="s-line" x1="0" x2="26" y1="150" y2="150" transform="translate(' + i * 40 + ',0)"/>');

    // Reibungsdiagramm: Reibungskraft gegen Schiebekraft
    const gx = (f) => 12 + (f / MAXF) * 176;
    const gy = (r) => 108 - (r / 270) * 96;
    const curve = {
      boden: [[0, 0], [0.5 * M * G, 0.5 * M * G], [0.5 * M * G, 0.4 * M * G], [MAXF, 0.4 * M * G]],
      rollen: [[0, 0], [0.02 * M * G, 0.02 * M * G], [MAXF, 0.02 * M * G]],
    };
    const graph = svgEl(svg("graph", "0 0 200 130", '<line class="s-ax" x1="12" y1="108" x2="192" y2="108"/><line class="s-ax" x1="12" y1="108" x2="12" y2="8"/><polyline id="l3-curve" class="s-curve" points=""/><circle id="l3-dot" class="s-dot" r="5" cx="12" cy="108"/><text class="s-tx" x="192" y="124" text-anchor="end">Schiebekraft F</text><text class="s-tx" x="16" y="14">Reibungskraft F<tspan baseline-shift="sub" font-size="8">R</tspan></text>'));
    function drawCurve() {
      graph.querySelector("#l3-curve").setAttribute("points", curve[art].map((p) => gx(p[0]).toFixed(1) + "," + gy(p[1]).toFixed(1)).join(" "));
    }

    const read = h("div", { class: "kg-read big" });
    const slider = h("input", { type: "range", min: "0", max: String(MAXF), step: "1", value: "0", "aria-label": "Schiebekraft in Newton" });
    const surf = h("div", { class: "kg-seg", role: "radiogroup", "aria-label": "Unterlage" });
    const reset = h("button", { class: "kg-chip ghost", type: "button", text: "Zurücksetzen" });

    const mk = (id, label, sub) => {
      const b = h("button", { class: "kg-segb" + (id === art ? " on" : ""), type: "button", role: "radio", "aria-checked": id === art ? "true" : "false" }, h("b", { text: label }), h("small", { text: sub }));
      b.addEventListener("click", () => {
        art = id;
        v = 0;
        dist = 0;
        surf.querySelectorAll("button").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b ? "true" : "false"); });
        fig.querySelector("#l3-wheels").classList.toggle("hidden", id !== "rollen");
        fig.querySelector("#l3-crate").setAttribute("y", id === "rollen" ? 62 : 68);
        drawCurve();
      });
      return b;
    };
    surf.append(mk("boden", "Holzboden", "Kiste rutscht"), mk("rollen", "Rollen", "Kiste auf Rollwagen"));
    reset.addEventListener("click", () => {
      F = 0;
      v = 0;
      dist = 0;
      slider.value = "0";
    });
    slider.addEventListener("input", () => (F = +slider.value));

    function frame(now) {
      if (!ctx.alive()) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      state = Phys.kiste({ v }, F, M, art, dt, G);
      v = state.v;
      dist += v * dt;
      const off = (dist * 40) % 40;
      dash.setAttribute("transform", "translate(" + -off + ",0)");
      const reibungLen = state.reibung / 3;
      const pushLen = F / 3;
      const push = fig.querySelector("#l3-push");
      push.setAttribute("x1", 148 - pushLen);
      push.setAttribute("x2", 148);
      push.style.opacity = F > 0 ? 1 : 0;
      fig.querySelector("#l3-pushl").setAttribute("x", 148 - pushLen);
      const fr = fig.querySelector("#l3-fric");
      fr.setAttribute("x1", 214);
      fr.setAttribute("x2", 214 - reibungLen);
      fr.style.opacity = state.reibung > 0.5 ? 1 : 0;
      fig.querySelector("#l3-fricl").setAttribute("x", 214 - reibungLen);
      graph.querySelector("#l3-dot").setAttribute("cx", gx(F));
      graph.querySelector("#l3-dot").setAttribute("cy", gy(state.reibung));
      read.innerHTML =
        "<div><small>Schiebekraft F</small><b>" + fmt(F, 0) + " N</b></div><div class=\"hl\"><small>Reibungskraft F<sub>R</sub></small><b>" + fmt(state.reibung, 0) + " N</b></div><div><small>Art</small><b>" + (v === 0 ? (F === 0 ? "Ruhe" : state.art) : state.art) + "</b></div><div><small>Geschwindigkeit</small><b>" + fmt(v, 1) + " m/s</b></div>";
      requestAnimationFrame(frame);
    }
    drawCurve();
    requestAnimationFrame(frame);

    return h("div", { class: "kg-card kg-labcard" },
      h("p", { class: "kg-tag", text: "Versuch" }),
      h("h2", { class: "kg-h", text: "Wann bewegt sich die Kiste?" }),
      h("p", { text: "Erhöhe die Schiebekraft langsam. Beobachte die Reibungskraft, besonders in dem Moment, wo sich die Kiste losreisst. Die Kiste hat 50 kg. Reibung wirkt ohne Luftwiderstand." }),
      fig, read, h("label", { class: "kg-slider" }, h("span", { text: "Schiebekraft" }), slider), surf, reset,
      h("p", { class: "kg-ctl-l", text: "Diagramm: Reibungskraft gegen Schiebekraft" }), graph);
  }

  KG.level({
    n: 3,
    name: "Rutschbahn",
    topic: "Reibung",
    goal: "Ich kann Haftreibung, Gleitreibung und Rollreibung unterscheiden und vergleichen.",
    async run(ctx) {
      await ctx.intro("Rutschbahn", [
        "Wo sich zwei Flächen berühren, wirkt <b>Reibung</b>. Sie bremst die Bewegung oder hält etwas fest.",
        "Es gibt drei Arten: <b>Haftreibung</b> (Körper ruht), <b>Gleitreibung</b> (Körper rutscht) und <b>Rollreibung</b> (Körper rollt).",
      ]);

      const scn = (text) => h("div", { class: "kg-scn", text });
      const ZONEN = [
        { id: "haft", name: "Haftreibung", sub: "ruht" },
        { id: "gleit", name: "Gleitreibung", sub: "rutscht" },
        { id: "roll", name: "Rollreibung", sub: "rollt" },
      ];
      await ctx.sort({
        lead: "Welche <b>Reibungsart</b> wirkt hier?",
        zones: ZONEN,
        items: [
          { face: scn("Ein Auto steht am Hang und rutscht nicht ab."), label: "Ein Auto steht am Hang und rutscht nicht ab.", zone: "haft", why: "Das Auto ruht. Die Haftreibung zwischen Reifen und Strasse hält es fest." },
          { face: scn("Du schiebst ein schweres Sofa, aber es bewegt sich noch nicht."), label: "Du schiebst ein schweres Sofa, aber es bewegt sich noch nicht.", zone: "haft", why: "Solange sich das Sofa nicht bewegt, wirkt Haftreibung. Sie ist genauso gross wie deine Schiebekraft." },
          { face: scn("Ein Schlitten rutscht den Hang hinunter."), label: "Ein Schlitten rutscht den Hang hinunter.", zone: "gleit", why: "Die Kufen gleiten über den Schnee: Gleitreibung." },
          { face: scn("Du schiebst einen Radiergummi über das Pult."), label: "Du schiebst einen Radiergummi über das Pult.", zone: "gleit", why: "Eine Fläche rutscht über die andere: Gleitreibung." },
          { face: scn("Ein Rollkoffer wird über den Bahnsteig gezogen."), label: "Ein Rollkoffer wird über den Bahnsteig gezogen.", zone: "roll", why: "Die Räder rollen ab. Das ist Rollreibung, die kleinste der drei Arten." },
          { face: scn("Eine Kugel rollt über den Tisch."), label: "Eine Kugel rollt über den Tisch.", zone: "roll", why: "Ein rollender Körper hat Rollreibung." },
        ],
      });

      const lab = rutschLabor(ctx);
      const tasks = h("div", { class: "kg-tasks" });
      ctx.show(h("div", { class: "kg-split" }, lab, tasks));
      const sub = ctx.sub(tasks);
      const FN = 50 * 9.81;
      const list = [
        { t: "num", q: "Auf dem <b>Holzboden</b>: Bei welcher Schiebekraft setzt sich die Kiste gerade in Bewegung? (Das ist die grösste Haftreibungskraft.)", a: 0.5 * FN, tol: 8, unit: "N", why: "Die Kiste bewegt sich, sobald die Schiebekraft die maximale Haftreibung übersteigt: 0.5 · 490.5 N ≈ 245 N." },
        { t: "num", q: "Die Kiste gleitet. Wie gross ist die <b>Gleitreibungskraft</b>? (Lies sie im Versuch ab, während die Kiste rutscht.)", a: 0.4 * FN, tol: 6, unit: "N", why: "Beim Gleiten wirken 0.4 · 490.5 N ≈ 196 N. Das ist weniger als die maximale Haftreibung." },
        { t: "num", q: "Wähle <b>Rollen</b>. Wie gross ist die <b>Rollreibungskraft</b>?", a: 0.02 * FN, tol: 1, unit: "N", why: "Rollen reiben fast nicht: 0.02 · 490.5 N ≈ 10 N." },
        { t: "mc", q: "Welche Reihenfolge stimmt (grösste Reibungskraft zuerst)?", opts: ["Haftreibung, Gleitreibung, Rollreibung", "Gleitreibung, Haftreibung, Rollreibung", "Rollreibung, Gleitreibung, Haftreibung", "Alle drei sind gleich gross"], a: 0, why: "Haftreibung (max.) &gt; Gleitreibung &gt; Rollreibung. Darum ist Anschieben am schwersten und Rollen am leichtesten." },
        { t: "mc", q: "Warum ist es leichter, eine Kiste im Rutschen zu halten, als sie anzuschieben?", opts: ["Die Gleitreibung ist kleiner als die maximale Haftreibung.", "Die Kiste wird beim Schieben leichter.", "Die Haftreibung wirkt nur beim Gleiten.", "Die Reibung verschwindet, sobald sich die Kiste bewegt."], a: 0, why: "Sobald sich die Kiste bewegt, sinkt die Reibung von der Haftreibung auf die kleinere Gleitreibung." },
        { t: "mc", q: "Wie bewegst du eine schwere Kiste mit der kleinsten Kraft?", opts: ["Rollen unterlegen", "Auf rauen Boden stellen", "Bremsen anziehen", "Mehr Gewicht in die Kiste legen"], a: 0, why: "Rollreibung ist viel kleiner als Gleitreibung. Darum hat man Räder erfunden." },
      ];
      for (let i = 0; i < list.length; i++) {
        ctx.progress(i / list.length);
        const r = await sub.ask(list[i], { tag: "Aufgabe " + (i + 1) + " von " + list.length });
        if (!r.ok) await sub.ask(list[i], { attempt: 1 });
      }
      await ctx.finish();
    },
  });
})();
