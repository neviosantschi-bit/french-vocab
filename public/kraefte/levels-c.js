"use strict";

// Kräfte-Spiel, Level 6 und 7: Kraftsparende Geräte (Hebel, Flaschenzug, schiefe Ebene) und Hebel markieren.

(() => {
  const { h, svgEl, shuffle, fmt, clamp, springTo, arrowDefs, addXp } = KG.util;

  const REGEL = "Goldene Regel der Mechanik: Was du an Kraft sparst, musst du an Weg zugeben.";

  const regelBox = (extra) => h("p", { class: "kg-golden", html: "<b>Goldene Regel der Mechanik</b> Was du an Kraft sparst, musst du an Weg zugeben." + (extra ? "<br>" + extra : "") });

  // Aufgaben nacheinander in einem Teil der Seite stellen; falsche Fragen kommen einmal nochmal.
  async function aufgaben(sub, list) {
    for (let i = 0; i < list.length; i++) {
      const r = await sub.ask(list[i], { tag: "Aufgabe " + (i + 1) + " von " + list.length });
      if (!r.ok) await sub.ask(list[i], { attempt: 1 });
    }
  }

  /* =====================================================================
     Level 6, Teil 1: Hebel
     ===================================================================== */

  function hebelSim(ctx, onBalance) {
    const PX = 240;
    const PY = 140;
    const SLOT = 44; // px je Platz
    const CMS = 10; // cm je Platz
    const WERTE = [1, 2, 3, 5];
    const puzzles = [{ F: 4, a: 30 }, { F: 5, a: 40 }, { F: 6, a: 20 }];
    let pi = 0;
    let left = [puzzles[0]];
    let right = []; // { F, a }
    let sel = 2;
    let theta = 0;

    const fig = svgEl('<svg viewBox="0 52 480 200" class="lab-svg hebel-svg" role="img" aria-label="Hebel mit Gewichten"></svg>');
    const status = h("p", { class: "kg-read" });
    const chips = h("div", { class: "kg-chips" });
    const msg = h("p", { class: "kg-hint", role: "status" });

    const hang = (x, y, F, cls, attr) => {
      const w = 22 + F * 3;
      const hh = 18 + F * 2;
      return '<g class="hw ' + cls + '" ' + (attr || "") + '><line class="h-rope" x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y + 12) + '"/><rect class="h-w" x="' + (x - w / 2) + '" y="' + (y + 12) + '" width="' + w + '" height="' + hh + '" rx="4"/><text class="s-tx on" x="' + x + '" y="' + (y + 12 + hh / 2 + 4) + '" text-anchor="middle">' + F + " N</text></g>";
    };
    const hangH = (F) => 12 + 18 + F * 2;

    function draw(th) {
      theta = th;
      const r = (th * Math.PI) / 180;
      const c = Math.cos(r);
      const s = Math.sin(r);
      const pos = (side, slot) => [PX + side * slot * SLOT * c, PY + side * slot * SLOT * s];
      let m = "";
      m += '<polygon class="h-fulcrum" points="' + (PX - 24) + "," + (PY + 74) + " " + (PX + 24) + "," + (PY + 74) + " " + PX + "," + (PY + 6) + '"/><rect class="h-base" x="' + (PX - 50) + '" y="' + (PY + 72) + '" width="100" height="10" rx="4"/>';
      const a = pos(-1, 5.2);
      const b = pos(1, 5.2);
      m += '<line class="h-beam" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"/>';
      for (let k = 1; k <= 5; k++) {
        [-1, 1].forEach((side) => {
          const p = pos(side, k);
          m += '<circle class="h-pt" cx="' + p[0] + '" cy="' + p[1] + '" r="3.5"/><text class="s-tx" x="' + p[0] + '" y="' + (p[1] - 12) + '" text-anchor="middle">' + k * CMS + "</text>";
        });
      }
      m += '<circle class="h-pivot" cx="' + PX + '" cy="' + PY + '" r="7"/>';
      // linke Gewichte (fest)
      left.forEach((w) => {
        const p = pos(-1, w.a / CMS);
        m += hang(p[0], p[1], w.F, "fixed");
      });
      // rechte Gewichte: pro Platz übereinander
      const byslot = {};
      right.forEach((w, i) => (byslot[w.a] = (byslot[w.a] || []).concat([[w, i]])));
      Object.keys(byslot).forEach((k) => {
        const p = pos(1, +k / CMS);
        let yy = p[1];
        byslot[k].forEach(([w, i]) => {
          m += hang(p[0], yy, w.F, "mine", 'data-i="' + i + '" tabindex="0" role="button" aria-label="' + w.F + " N bei " + w.a + ' cm entfernen"');
          yy += hangH(w.F);
        });
      });
      // Plätze rechts: antippen zum Anhängen
      for (let k = 1; k <= 5; k++) {
        const p = pos(1, k);
        m += '<g class="h-slot" data-a="' + k * CMS + '" tabindex="0" role="button" aria-label="Gewicht bei ' + k * CMS + ' cm anhängen"><circle cx="' + p[0] + '" cy="' + (p[1] - 38) + '" r="16"/><text x="' + p[0] + '" y="' + (p[1] - 32) + '" text-anchor="middle">+</text></g>';
      }
      fig.innerHTML = m;
    }

    const momentsL = () => left.reduce((s, w) => s + w.F * w.a, 0);
    const momentsR = () => right.reduce((s, w) => s + w.F * w.a, 0);

    function update(animate) {
      const diff = Phys.hebelDrehmoment(left, right);
      const target = -clamp(diff / 60, -1, 1) * 12;
      const lt = left.map((w) => w.F + " N · " + w.a + " cm").join(" + ");
      const rt = right.length ? right.map((w) => w.F + " N · " + w.a + " cm").join(" + ") : "noch nichts";
      status.innerHTML = "Links: " + lt + " = <b>" + momentsL() + " N·cm</b><br>Rechts: " + rt + (right.length ? " = <b>" + momentsR() + " N·cm</b>" : "");
      const bal = diff === 0 && right.length > 0;
      fig.classList.toggle("balanced", bal);
      msg.textContent = bal ? "Gleichgewicht: F₁ · a₁ = F₂ · a₂ (" + momentsL() + " N·cm = " + momentsR() + " N·cm)." : diff > 0 ? "Die linke Seite sinkt: Links dreht stärker." : diff < 0 ? "Die rechte Seite sinkt: Rechts dreht stärker." : "Hänge Gewichte rechts an die Plätze mit +.";
      if (animate) springTo(theta, target, draw, ctx.alive);
      else draw(target);
      if (bal) onBalance(left[0]);
    }

    WERTE.forEach((F) => {
      const b = h("button", { class: "kg-chip" + (F === sel ? " on" : ""), type: "button", text: F + " N" });
      b.addEventListener("click", () => {
        sel = F;
        chips.querySelectorAll(".kg-chip.pick").forEach((x) => x.classList.toggle("on", x === b));
      });
      b.classList.add("pick");
      chips.append(b);
    });
    chips.append(h("button", { class: "kg-chip ghost", type: "button", text: "Rechts leeren", onclick: () => { right = []; update(true); } }));

    fig.addEventListener("click", (e) => {
      const slot = e.target.closest(".h-slot");
      const mine = e.target.closest(".hw.mine");
      if (mine) {
        right.splice(+mine.getAttribute("data-i"), 1);
        update(true);
      } else if (slot) {
        if (right.length >= 8) return;
        right.push({ F: sel, a: +slot.getAttribute("data-a") });
        update(true);
      }
    });
    fig.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.closest) {
        const t = e.target.closest(".h-slot, .hw.mine");
        if (t) {
          e.preventDefault();
          t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        }
      }
    });

    update(false);
    const api = {
      el: h("div", { class: "kg-card kg-labcard" },
        h("p", { class: "kg-tag", text: "Hebel" }),
        h("h2", { class: "kg-h", text: "Bringe den Hebel ins Gleichgewicht" }),
        h("p", { html: "Wähle ein Gewicht und tippe rechts auf ein <b>+</b>. Tippe ein Gewicht an, um es zu entfernen. Es gilt das <b>Hebelgesetz</b>: <b>Kraft · Kraftarm = Last · Lastarm</b> (F₁ · a₁ = F₂ · a₂)." }),
        fig, chips, status, msg),
      next() {
        pi += 1;
        left = [puzzles[pi]];
        right = [];
        update(true);
        return puzzles[pi];
      },
      first: puzzles[0],
      count: puzzles.length,
    };
    return api;
  }

  async function hebelPart(ctx) {
    const tasks = h("div", { class: "kg-tasks" });
    let resolveBal;
    let solved = 0;
    const sim = hebelSim(ctx, () => resolveBal && resolveBal());
    ctx.show(h("div", { class: "kg-split" }, h("div", {}, sim.el, regelBox()), tasks));
    const sub = ctx.sub(tasks);

    for (let i = 0; i < 2; i++) {
      const w = i === 0 ? sim.first : sim.next();
      sub.show(h("div", { class: "kg-card" }, h("p", { class: "kg-tag", text: "Gleichgewicht " + (i + 1) + " von 2" }), h("p", { class: "kg-q", html: "Links hängen <b>" + w.F + " N</b> im Abstand <b>" + w.a + " cm</b> vom Drehpunkt. Hänge rechts Gewichte so an, dass der Hebel im <b>Gleichgewicht</b> ist." })));
      await new Promise((r) => (resolveBal = r));
      resolveBal = null;
      addXp(i === 0 ? 15 : 12);
      solved += 1;
      sub.show(h("div", { class: "kg-card" }, h("p", { class: "kg-fb-h", text: "Gleichgewicht" }), h("p", { html: "Links: " + w.F + " N · " + w.a + " cm = " + w.F * w.a + " N·cm. Rechts muss dasselbe herauskommen." })));
      await sub.cont("Weiter");
    }

    const list = [
      { t: "num", q: "Eine Wippe ist im Gleichgewicht. Links hängen <b>20 N</b> im Abstand <b>60 cm</b>. Rechts ist der Abstand <b>40 cm</b>. Wie gross ist das Gewicht rechts?", a: Phys.hebelF2(20, 60, 40), tol: 0.5, unit: "N", why: "F₁ · a₁ = F₂ · a₂, also F₂ = 20 N · 60 cm : 40 cm = 30 N." },
      { t: "num", q: "Mit einem Brecheisen soll eine Last von <b>300 N</b> gehoben werden. Der Lastarm ist <b>0.3 m</b>, der Kraftarm <b>1.2 m</b>. Wie gross ist die nötige Kraft?", a: Phys.hebelF2(300, 0.3, 1.2), tol: 1, unit: "N", why: "Kraft · Kraftarm = Last · Lastarm. F = 300 N · 0.3 m : 1.2 m = 75 N." },
      { t: "num", q: "Eine Last von <b>240 N</b> hängt am Lastarm <b>0.5 m</b>. Du drückst mit <b>80 N</b>. Wie lang muss der Kraftarm sein?", a: (240 * 0.5) / 80, tol: 0.02, unit: "m", why: "a₁ = F₂ · a₂ : F₁ = 240 N · 0.5 m : 80 N = 1.5 m." },
      { t: "mc", q: "Wie kannst du mit einem Hebel Kraft sparen?", opts: ["Den Kraftarm länger machen als den Lastarm", "Den Kraftarm kürzer machen als den Lastarm", "Den Drehpunkt weglassen", "Die Last schwerer machen"], a: 0, why: "Je länger der Kraftarm im Vergleich zum Lastarm, desto kleiner die nötige Kraft. Dafür bewegt sich das Ende des Kraftarms über einen längeren Weg." },
    ];
    await aufgaben(sub, list);
  }

  /* =====================================================================
     Level 6, Teil 2: Flaschenzug
     ===================================================================== */

  function flaschenzugSim(ctx) {
    const LAST = 120; // N
    const PXM = 40; // px je m Hub
    let n = 2;
    let h0 = 0; // gehobene Höhe in m
    let busy = false;
    const fig = svgEl('<svg viewBox="0 0 480 310" class="lab-svg" role="img" aria-label="Flaschenzug"></svg>');
    const read = h("div", { class: "kg-read big" });
    const msg = h("p", { class: "kg-hint", role: "status" });
    const seg = h("div", { class: "kg-seg", role: "radiogroup", "aria-label": "Tragende Seilstücke" });
    const lift = h("button", { class: "kg-go ghost", type: "button", text: "Last um 1 m heben" });
    const back = h("button", { class: "kg-chip ghost", type: "button", text: "Zurücksetzen" });

    function draw() {
      const xs = Array.from({ length: n }, (_, i) => 240 + (i - (n - 1) / 2) * 30);
      const yTop = 56; // Unterkante des oberen Blocks
      const yBot = 210 - h0 * PXM; // Oberkante des unteren Blocks
      const bw = n * 30 + 14;
      let m = '<rect class="h-base" x="120" y="14" width="240" height="12" rx="4"/>';
      m += '<rect class="fz-block" x="' + (240 - bw / 2) + '" y="26" width="' + bw + '" height="30" rx="8"/>';
      const kt = Math.ceil(n / 2);
      const kb = Math.floor(n / 2);
      for (let i = 0; i < kt; i++) m += '<circle class="fz-pul" cx="' + (240 + (i - (kt - 1) / 2) * 58) + '" cy="41" r="10"/>';
      m += '<rect class="fz-block" x="' + (240 - bw / 2) + '" y="' + yBot + '" width="' + bw + '" height="30" rx="8"/>';
      for (let i = 0; i < kb; i++) m += '<circle class="fz-pul" cx="' + (240 + (i - (kb - 1) / 2) * 58) + '" cy="' + (yBot + 15) + '" r="10"/>';
      xs.forEach((x) => (m += '<line class="fz-rope" x1="' + x + '" y1="' + yTop + '" x2="' + x + '" y2="' + yBot + '"/>'));
      // freies Seilende
      const xr = xs[xs.length - 1] + 14;
      const yH = 46 + n * h0 * PXM;
      m += '<path class="fz-rope" fill="none" d="M' + (xs[xs.length - 1]) + " " + yTop + " Q" + xr + " 30 " + (xr + 70) + " 44 L" + (xr + 70) + " " + yH + '"/>';
      m += '<circle class="fz-hand" cx="' + (xr + 70) + '" cy="' + yH + '" r="9"/><line class="s-arrow-b" x1="' + (xr + 70) + '" y1="' + (yH + 16) + '" x2="' + (xr + 70) + '" y2="' + (yH + 16 + 26) + '" marker-end="url(#kg-ah-b)"/>';
      // Last
      m += '<line class="fz-rope" x1="240" y1="' + (yBot + 30) + '" x2="240" y2="' + (yBot + 44) + '"/><rect class="s-crate" x="205" y="' + (yBot + 44) + '" width="70" height="48" rx="3"/><text class="s-tx on" x="240" y="' + (yBot + 73) + '" text-anchor="middle">' + LAST + " N</text>";
      // Höhenmarke
      m += '<line class="s-tick" x1="60" y1="210" x2="60" y2="' + (210 - PXM) + '"/><text class="s-tx" x="68" y="' + (210 - PXM / 2 + 4) + '">1 m</text>';
      fig.innerHTML = arrowDefs + m;
      read.innerHTML =
        "<div><small>Tragende Seilstücke</small><b>" + n + "</b></div><div class=\"hl\"><small>Zugkraft F</small><b>" + fmt(Phys.flaschenzugKraft(LAST, n), 1) + " N</b></div><div><small>Gezogenes Seil</small><b>" + fmt(Phys.flaschenzugWeg(h0, n), 1) + " m</b></div><div><small>Last gehoben um</small><b>" + fmt(h0, 1) + " m</b></div>";
    }

    [1, 2, 4].forEach((k) => {
      const b = h("button", { class: "kg-segb" + (k === n ? " on" : ""), type: "button", role: "radio", "aria-checked": k === n ? "true" : "false" }, h("b", { text: k }), h("small", { text: k === 1 ? "Seilstück" : "Seilstücke" }));
      b.addEventListener("click", () => {
        if (busy) return;
        n = k;
        h0 = 0;
        seg.querySelectorAll("button").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b ? "true" : "false"); });
        msg.textContent = "Mit " + n + " tragenden Seilstücken: Zugkraft " + fmt(LAST / n, 1) + " N, aber für 1 m Hub ziehst du " + n + " m Seil.";
        draw();
      });
      seg.append(b);
    });
    lift.addEventListener("click", () => {
      if (busy) return;
      busy = true;
      h0 = 0;
      const t0 = performance.now();
      const step = () => {
        if (!ctx.alive()) return;
        const t = clamp((performance.now() - t0) / 1600, 0, 1);
        h0 = t * t * (3 - 2 * t);
        draw();
        if (t < 1) requestAnimationFrame(step);
        else {
          h0 = 1;
          draw();
          busy = false;
          msg.innerHTML = "Kraft · Weg: <b>" + fmt(Phys.flaschenzugKraft(LAST, n), 1) + " N · " + n + " m = " + LAST + " N·m</b>. Das ist immer gleich viel, egal wie viele Seilstücke.";
        }
      };
      requestAnimationFrame(step);
    });
    back.addEventListener("click", () => {
      if (busy) return;
      h0 = 0;
      draw();
    });
    draw();
    return h("div", { class: "kg-card kg-labcard" }, h("p", { class: "kg-tag", text: "Flaschenzug" }), h("h2", { class: "kg-h", text: "Weniger Kraft, mehr Seil" }),
      h("p", { html: "Eine Last von <b>120 N</b> wird gehoben. Wähle, wie viele Seilstücke die Last tragen, und hebe sie um 1 m. (Ohne Reibung und ohne das Gewicht der Rollen.)" }),
      fig, seg, h("div", { class: "kg-actions" }, lift, back), read, msg);
  }

  async function flaschenzugPart(ctx) {
    const tasks = h("div", { class: "kg-tasks" });
    ctx.show(h("div", { class: "kg-split" }, h("div", {}, flaschenzugSim(ctx), regelBox()), tasks));
    const sub = ctx.sub(tasks);
    sub.show(h("div", { class: "kg-card" }, h("p", { class: "kg-q", text: "Probiere 1, 2 und 4 Seilstücke aus und hebe die Last jedes Mal um 1 m. Was fällt dir bei Zugkraft und Seilweg auf?" })));
    await sub.cont("Ich habe es ausprobiert");
    await aufgaben(sub, [
      { t: "num", q: "Eine Last von <b>600 N</b> hängt an einem Flaschenzug mit <b>4</b> tragenden Seilstücken. Wie gross ist die Zugkraft?", a: Phys.flaschenzugKraft(600, 4), tol: 1, unit: "N", why: "F = F<sub>Last</sub> : n = 600 N : 4 = 150 N." },
      { t: "num", q: "Die Last soll <b>2 m</b> hoch, der Flaschenzug hat <b>2</b> tragende Seilstücke. Wie viele Meter Seil musst du ziehen?", a: Phys.flaschenzugWeg(2, 2), tol: 0.05, unit: "m", why: "Seilweg = n · Hub = 2 · 2 m = 4 m. Du sparst Kraft, ziehst aber mehr Seil." },
      { t: "num", q: "Mit <b>4</b> tragenden Seilstücken ziehst du mit <b>50 N</b>. Wie gross ist die Gewichtskraft der Last?", a: 50 * 4, tol: 1, unit: "N", why: "F<sub>Last</sub> = F · n = 50 N · 4 = 200 N." },
      { t: "mc", q: "Was bleibt beim Flaschenzug immer gleich, wenn du mehr Seilstücke nimmst?", opts: ["Das Produkt aus Kraft und Weg", "Die Zugkraft", "Der Seilweg", "Die Anzahl der Rollen"], a: 0, why: "Weniger Kraft heisst mehr Weg: Kraft · Weg bleibt gleich. Das ist die Goldene Regel der Mechanik." },
    ]);
  }

  /* =====================================================================
     Level 6, Teil 3: Schiefe Ebene
     ===================================================================== */

  function ebeneSim(ctx) {
    const FG = 500;
    const HM = 1; // Höhe in m
    const SC = 66; // px je m
    let alpha = 30;
    let l = Phys.rampeLaenge(HM, alpha);
    const fig = svgEl('<svg viewBox="0 96 480 144" class="lab-svg" role="img" aria-label="Schiefe Ebene"></svg>');
    const read = h("div", { class: "kg-read big" });
    const msg = h("p", { class: "kg-hint", role: "status" });
    const sa = h("input", { type: "range", min: "10", max: "60", step: "1", value: String(alpha), "aria-label": "Neigungswinkel in Grad" });
    const sl = h("input", { type: "range", min: String(Phys.rampeLaenge(HM, 60).toFixed(2)), max: String(Phys.rampeLaenge(HM, 10).toFixed(2)), step: "0.05", value: String(l), "aria-label": "Länge der Rampe in Metern" });

    function draw() {
      const base = Math.sqrt(l * l - HM * HM) * SC;
      const x0 = 30;
      const yb = 214;
      const x1 = x0 + base;
      const yt = yb - HM * SC;
      const F = Phys.schiefeEbeneKraft(FG, HM, l);
      const ux = (x1 - x0) / (l * SC);
      const uy = -(yb - yt) / (l * SC);
      // Kiste in der Mitte der Rampe, senkrecht zur Rampe aufgesetzt
      const cx = x0 + (x1 - x0) * 0.5;
      const cy = yb + (yt - yb) * 0.5;
      const nx = uy; // Normalenvektor nach oben links: (uy, -ux) mit uy<0
      const ny = -ux;
      const ang = (Math.atan2(uy, ux) * 180) / Math.PI;
      const aLen = F * 0.22;
      let m = '<rect class="d-floor" x="0" y="' + yb + '" width="480" height="26"/><polygon class="d-floor" points="' + x0 + "," + yb + " " + x1 + "," + yb + " " + x1 + "," + yt + '"/>';
      m += '<line class="s-tick" x1="' + (x1 + 16) + '" y1="' + yb + '" x2="' + (x1 + 16) + '" y2="' + yt + '"/><text class="s-tx" x="' + (x1 + 24) + '" y="' + ((yb + yt) / 2 + 4) + '">h = ' + HM + " m</text>";
      m += '<g transform="translate(' + (cx + nx * 17) + "," + (cy + ny * 17) + ") rotate(" + ang + ')"><rect class="s-crate" x="-20" y="-17" width="40" height="34" rx="3"/></g>';
      // Gewichtskraft (grau, senkrecht) und Zugkraft längs der Rampe
      m += '<line class="s-arrow-r" x1="' + (cx + nx * 17) + '" y1="' + (cy + ny * 17) + '" x2="' + (cx + nx * 17) + '" y2="' + (cy + ny * 17 + FG * 0.12) + '" marker-end="url(#kg-ah-r)" opacity="0.55"/>';
      m += '<line class="s-arrow-b" x1="' + (cx + nx * 17) + '" y1="' + (cy + ny * 17) + '" x2="' + (cx + nx * 17 + ux * aLen) + '" y2="' + (cy + ny * 17 + uy * aLen) + '" marker-end="url(#kg-ah-b)"/>';
      m += '<text class="s-tx r" x="' + (cx + nx * 17 + 10) + '" y="' + (cy + ny * 17 + FG * 0.12 + 4) + '">F<tspan baseline-shift="sub" font-size="9">G</tspan> = 500 N</text>';
      m += '<text class="s-tx b" x="' + (cx + nx * 17 + ux * aLen + 8) + '" y="' + (cy + ny * 17 + uy * aLen - 4) + '">F</text>';
      // Winkel α am linken Fuß der Rampe
      const ar = (alpha * Math.PI) / 180;
      m += '<path class="s-tick" fill="none" d="M' + (x0 + 40) + " " + yb + " A40 40 0 0 0 " + (x0 + 40 * Math.cos(ar)) + " " + (yb - 40 * Math.sin(ar)) + '"/><text class="s-tx" x="' + (x0 + 50) + '" y="' + (yb - 8) + '">α</text>';
      fig.innerHTML = arrowDefs + m;
      read.innerHTML =
        "<div><small>Winkel α</small><b>" + fmt(alpha, 0) + "°</b></div><div><small>Länge der Rampe l</small><b>" + fmt(l, 2) + " m</b></div><div class=\"hl\"><small>Nötige Kraft F</small><b>" + fmt(F, 0) + " N</b></div><div><small>Kraft · Weg</small><b>" + fmt(F * l, 0) + " N·m</b></div>";
    }
    sa.addEventListener("input", () => {
      alpha = +sa.value;
      l = Phys.rampeLaenge(HM, alpha);
      sl.value = String(l);
      msg.textContent = "Steiler: kurzer Weg, aber viel Kraft.";
      draw();
    });
    sl.addEventListener("input", () => {
      l = +sl.value;
      alpha = Phys.rampeWinkel(HM, l);
      sa.value = String(Math.round(alpha));
      msg.textContent = "Länger und flacher: weniger Kraft, aber ein längerer Weg.";
      draw();
    });
    draw();
    return h("div", { class: "kg-card kg-labcard" }, h("p", { class: "kg-tag", text: "Schiefe Ebene" }), h("h2", { class: "kg-h", text: "Ein Fass auf die Rampe" }),
      h("p", { html: "Das Fass wiegt <b>500 N</b> und muss <b>1 m</b> hoch. Verändere Winkel oder Länge der Rampe. Gezeigt ist die Kraft entlang der Rampe (ohne Reibung)." }),
      fig,
      h("label", { class: "kg-slider" }, h("span", { text: "Neigungswinkel α" }), sa),
      h("label", { class: "kg-slider" }, h("span", { text: "Länge der Rampe l" }), sl), read, msg);
  }

  async function ebenePart(ctx) {
    const tasks = h("div", { class: "kg-tasks" });
    ctx.show(h("div", { class: "kg-split" }, h("div", {}, ebeneSim(ctx), regelBox("Hier: F · l = F<sub>G</sub> · h, also immer 500 N · 1 m = 500 N·m.")), tasks));
    const sub = ctx.sub(tasks);
    sub.show(h("div", { class: "kg-card" }, h("p", { class: "kg-q", text: "Schiebe die Regler. Wie verändern sich Kraft und Rampenlänge, wenn die Rampe flacher wird?" })));
    await sub.cont("Ich habe es ausprobiert");
    await aufgaben(sub, [
      { t: "num", q: "Ein Fass mit <b>600 N</b> soll auf <b>1 m</b> Höhe. Die Rampe ist <b>4 m</b> lang. Wie gross ist die Kraft entlang der Rampe (ohne Reibung)?", a: Phys.schiefeEbeneKraft(600, 1, 4), tol: 1, unit: "N", why: "F = F<sub>G</sub> · h : l = 600 N · 1 m : 4 m = 150 N." },
      { t: "num", q: "Dasselbe Fass (<b>600 N</b>, Höhe <b>1 m</b>), aber die Rampe ist nur <b>2 m</b> lang. Wie gross ist die Kraft?", a: Phys.schiefeEbeneKraft(600, 1, 2), tol: 1, unit: "N", why: "F = 600 N · 1 m : 2 m = 300 N. Die kürzere Rampe braucht mehr Kraft." },
      { t: "num", q: "Du kannst höchstens <b>80 N</b> aufbringen. Eine Last von <b>400 N</b> soll <b>1 m</b> hoch. Wie lang muss die Rampe mindestens sein?", a: (400 * 1) / 80, tol: 0.05, unit: "m", why: "l = F<sub>G</sub> · h : F = 400 N · 1 m : 80 N = 5 m." },
      { t: "mc", q: "Die Rampe wird bei gleicher Höhe doppelt so lang. Was passiert?", opts: ["Die Kraft halbiert sich, der Weg verdoppelt sich.", "Die Kraft verdoppelt sich, der Weg halbiert sich.", "Kraft und Weg verdoppeln sich.", "Nichts ändert sich."], a: 0, why: "F = F<sub>G</sub> · h : l. Doppeltes l bedeutet halbes F. Dafür ist der Weg doppelt so lang: Goldene Regel." },
    ]);
  }

  KG.level({
    n: 6,
    name: "Maschinenraum",
    topic: "Kraftsparende Geräte",
    goal: "Ich kann das Hebelgesetz anwenden und erklären, wie Flaschenzug und schiefe Ebene Kraft sparen. Ich kenne die Goldene Regel der Mechanik.",
    async run(ctx) {
      await ctx.intro("Maschinenraum", [
        "Hebel, Flaschenzug und schiefe Ebene sind <b>kraftsparende Geräte</b>. Sie machen dir die Arbeit leichter.",
        "Aber Vorsicht: " + REGEL + " Das merkst du in jedem der drei Versuche.",
      ]);
      await hebelPart(ctx);
      ctx.progress(0.33);
      await flaschenzugPart(ctx);
      ctx.progress(0.66);
      await ebenePart(ctx);
      ctx.progress(0.9);
      await ctx.quiz([
        { t: "mc", q: "Was gilt für alle kraftsparenden Geräte (Hebel, Flaschenzug, schiefe Ebene)?", opts: ["Man spart Kraft, muss dafür aber einen längeren Weg zurücklegen.", "Man spart Kraft und Weg gleichzeitig.", "Man spart Weg, braucht dafür mehr Kraft.", "Sie machen die Last leichter, sodass ihre Gewichtskraft kleiner wird."], a: 0, why: "Das ist die Goldene Regel der Mechanik. Die Last wird nicht leichter: Man verteilt dieselbe Arbeit auf mehr Weg und weniger Kraft." },
      ]);
      await ctx.finish();
    },
  });

  /* =====================================================================
     Level 7: Hebel-Markierung
     ===================================================================== */

  // P = Drehpunkt, K = Angriffspunkt der Kraft, L = Angriffspunkt der Last. Koordinaten im Bild (400 × 240).
  const HEBEL = [
    {
      name: "Schere", pLab: "die Schraube, die beide Hälften verbindet", P: [200, 120], K: [70, 83], L: [300, 149], tol: 24, kLab: "Finger drücken", lLab: "Papier",
      art:
        '<line class="l-bar" x1="60" y1="80" x2="340" y2="160"/><line class="l-bar" x1="60" y1="160" x2="340" y2="80"/>' +
        '<circle class="l-ring" cx="40" cy="74" r="17"/><circle class="l-ring" cx="40" cy="166" r="17"/><circle class="l-screw" cx="200" cy="120" r="7"/>' +
        '<line class="l-paper" x1="300" y1="92" x2="300" y2="150"/>',
    },
    {
      name: "Brecheisen", pLab: "die Stelle, an der das Eisen auf dem Brett aufliegt", P: [150, 170], K: [350, 88], L: [100, 152], tol: 24, kLab: "Hand zieht", lLab: "Nagel",
      art:
        '<rect class="l-floor" x="20" y="170" width="360" height="30" rx="3"/><line class="l-nail" x1="100" y1="170" x2="100" y2="144"/><rect class="l-nailhead" x="92" y="140" width="16" height="6" rx="2"/>' +
        '<path class="l-bar" fill="none" d="M96 152 L130 165 L150 170 L365 82"/><circle class="l-hand" cx="362" cy="84" r="8"/>',
    },
    {
      name: "Schubkarre", pLab: "die Achse des Rades", P: [90, 180], K: [330, 132], L: [190, 160], tol: 24, kLab: "Hände heben", lLab: "Ladung",
      art:
        '<rect class="l-floor" x="0" y="206" width="400" height="24"/><circle class="l-wheel" cx="90" cy="182" r="24"/><circle class="l-hub" cx="90" cy="182" r="5"/>' +
        '<line class="l-bar" x1="90" y1="180" x2="345" y2="129"/><polygon class="l-tray" points="130,170 258,146 276,104 120,128"/><circle class="l-load" cx="195" cy="118" r="22"/>' +
        '<line class="l-grip" x1="318" y1="134" x2="346" y2="128"/>',
    },
    {
      name: "Flaschenöffner", pLab: "die Stelle, an der der Öffner hinten auf dem Kronkorken aufliegt", P: [100, 128], K: [340, 100], L: [160, 121], tol: 18, kLab: "Hand hebt", lLab: "Haken unter dem Kronkorken",
      art:
        '<rect class="l-bottle" x="118" y="147" width="34" height="68" rx="4"/><rect class="l-cap" x="98" y="129" width="74" height="18" rx="4"/>' +
        '<line class="l-bar" x1="100" y1="128" x2="352" y2="98"/><path class="l-bar thin" fill="none" d="M160 121 V146 H170"/>',
    },
    {
      name: "Arm", pLab: "das Ellbogengelenk", P: [110, 130], K: [150, 130], L: [325, 130], tol: 15, kLab: "Muskel zieht", lLab: "Gewicht in der Hand",
      art:
        '<circle class="l-joint" cx="110" cy="40" r="12"/><line class="l-limb" x1="110" y1="46" x2="110" y2="130"/><line class="l-limb" x1="110" y1="130" x2="338" y2="130"/>' +
        '<path class="l-muscle" fill="none" d="M120 60 Q158 92 150 124"/><circle class="l-joint" cx="110" cy="130" r="9"/><circle class="l-ball" cx="326" cy="152" r="18"/>',
    },
  ];

  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  function markieren(ctx, H, idx, total) {
    return new Promise((resolve) => {
      const W = 400;
      const Ht = 240;
      const marks = { pivot: null, kraft: null, last: null };
      const ok = { pivot: false, kraft: false, last: false };
      let tool = "pivot";
      let tries = 0;
      let start = null;
      let cur = null;
      let drag = false;
      let pend = false;

      const svg = svgEl('<svg viewBox="0 0 ' + W + " " + Ht + '" class="lever-svg" role="img" aria-label="' + H.name + ': Drehpunkt, Kraftarm und Lastarm markieren">' + arrowDefs + '<rect width="400" height="240" class="d-sky"/>' + H.art + '<g class="lm"></g></svg>');
      const layer = svg.querySelector(".lm");
      svg.style.touchAction = "none";
      const msg = h("div", { class: "kg-fb hidden", role: "status" });
      const hint = h("p", { class: "kg-hint", role: "status" });
      const host = h("div", { class: "det-quiz" });
      const sub = ctx.sub(host);
      const toolBar = h("div", { class: "kg-seg tools", role: "radiogroup", "aria-label": "Werkzeug" });
      const check = h("button", { class: "kg-go", type: "button", text: "Prüfen" });
      const reset = h("button", { class: "kg-go ghost", type: "button", text: "Zurücksetzen" });

      const TOOLS = [
        { id: "pivot", name: "Drehpunkt", sub: "antippen", c: "a" },
        { id: "kraft", name: "Kraftarm", sub: "ziehen", c: "b" },
        { id: "last", name: "Lastarm", sub: "ziehen", c: "g" },
      ];
      const COLORS = { a: "#ffbe55", b: "#4fd8e8", g: "#4fe3a1" };
      TOOLS.forEach((t) => {
        const b = h("button", { class: "kg-segb tool-" + t.c + (t.id === tool ? " on" : ""), type: "button", role: "radio", "aria-checked": t.id === tool ? "true" : "false", "data-t": t.id }, h("b", { text: t.name }), h("small", { text: t.sub }));
        b.addEventListener("click", () => setTool(t.id));
        toolBar.append(b);
      });
      function setTool(id) {
        tool = id;
        pend = false;
        start = null;
        toolBar.querySelectorAll("button").forEach((x) => { const on = x.getAttribute("data-t") === id; x.classList.toggle("on", on); x.setAttribute("aria-checked", on ? "true" : "false"); });
        hint.textContent = id === "pivot" ? "Tippe auf den Drehpunkt." : id === "kraft" ? "Ziehe vom Drehpunkt zum Angriffspunkt der Kraft (" + H.kLab + ")." : "Ziehe vom Drehpunkt zum Angriffspunkt der Last (" + H.lLab + ").";
      }

      const pt = (e) => {
        const r = svg.getBoundingClientRect();
        return [clamp(((e.clientX - r.left) / r.width) * W, 0, W), clamp(((e.clientY - r.top) / r.height) * Ht, 0, Ht)];
      };

      function paint() {
        let m = "";
        const line = (a, b, c, st, extra) => '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="' + COLORS[c] + '" stroke-width="5" stroke-linecap="round" ' + (st ? 'stroke-dasharray="8 6"' : "") + " " + (extra || "") + "/>";
        if (H.show) {
          m += line(H.P, H.K, "b", true) + line(H.P, H.L, "g", true) + '<circle cx="' + H.P[0] + '" cy="' + H.P[1] + '" r="9" fill="none" stroke="' + COLORS.a + '" stroke-width="3" stroke-dasharray="4 3"/>';
        }
        // Kraft- und Lastarm liegen manchmal auf derselben Linie: leicht nebeneinander zeichnen
        const shift = (a, b, f) => {
          const d = dist(a, b) || 1;
          const nx = (-(b[1] - a[1]) / d) * f;
          const ny = ((b[0] - a[0]) / d) * f;
          return [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny]];
        };
        ["kraft", "last"].forEach((k) => {
          const mk = marks[k];
          if (!mk) return;
          const c = k === "kraft" ? "b" : "g";
          const sh = shift(mk[0], mk[1], k === "kraft" ? 4 : -4);
          m += line(sh[0], sh[1], c, false, ok[k] ? "" : "opacity=\"0.85\"") + '<circle cx="' + sh[1][0] + '" cy="' + sh[1][1] + '" r="6" fill="' + COLORS[c] + '"/>';
        });
        if (drag && start) m += line(start, cur, tool === "kraft" ? "b" : "g", false, 'opacity="0.7"');
        if (marks.pivot) m += '<circle cx="' + marks.pivot[0] + '" cy="' + marks.pivot[1] + '" r="9" fill="' + COLORS.a + '" stroke="#0a1020" stroke-width="2"/>';
        layer.innerHTML = m;
      }

      svg.addEventListener("pointerdown", (e) => {
        if (H.locked) return;
        const p = pt(e);
        if (tool === "pivot") {
          marks.pivot = p;
          ok.pivot = false;
          paint();
          return;
        }
        if (pend) {
          pend = false;
          marks[tool] = [start, p];
          start = null;
          paint();
          return;
        }
        start = p;
        cur = p;
        drag = true;
        svg.setPointerCapture(e.pointerId);
        paint();
      });
      svg.addEventListener("pointermove", (e) => {
        if (!drag) return;
        cur = pt(e);
        paint();
      });
      const up = () => {
        if (!drag) return;
        drag = false;
        if (dist(start, cur) < 14) {
          pend = true;
          hint.textContent = "Tippe jetzt den Endpunkt an.";
          paint();
          return;
        }
        marks[tool] = [start, cur];
        ok[tool] = false;
        start = null;
        paint();
      };
      svg.addEventListener("pointerup", up);
      svg.addEventListener("pointercancel", up);

      reset.addEventListener("click", () => {
        marks.pivot = marks.kraft = marks.last = null;
        msg.className = "kg-fb hidden";
        paint();
      });

      const near = (a, b) => dist(a, b) <= H.tol;
      const armOk = (mk, target) => mk && ((near(mk[0], H.P) && near(mk[1], target)) || (near(mk[1], H.P) && near(mk[0], target)));

      check.addEventListener("click", async () => {
        if (!marks.pivot && !marks.kraft && !marks.last) {
          hint.textContent = "Setze zuerst den Drehpunkt und ziehe die beiden Arme.";
          return;
        }
        const res = { pivot: !!marks.pivot && near(marks.pivot, H.P), kraft: armOk(marks.kraft, H.K), last: armOk(marks.last, H.L) };
        const names = { pivot: "Drehpunkt", kraft: "Kraftarm", last: "Lastarm" };
        const missing = ["pivot", "kraft", "last"].filter((k) => !marks[k]);
        if (missing.length) {
          hint.textContent = "Es fehlt noch: " + missing.map((k) => names[k]).join(", ") + ".";
          return;
        }
        tries += 1;
        Object.keys(res).forEach((k) => (ok[k] = res[k]));
        if (res.pivot && res.kraft && res.last) {
          addXp(tries === 1 ? 15 : 8);
          H.locked = true;
          check.remove();
          reset.remove();
          msg.className = "kg-fb ok";
          msg.replaceChildren(h("p", { class: "kg-fb-h", text: "Alles richtig" }), h("p", { class: "kg-fb-w", html: "Der Drehpunkt ist der Punkt, um den sich der Hebel dreht. Der <b>Kraftarm</b> geht vom Drehpunkt zur Kraft (" + H.kLab + "), der <b>Lastarm</b> zur Last (" + H.lLab + ")." }));
          paint();
          const kl = dist(H.P, H.K);
          const ll = dist(H.P, H.L);
          const longer = kl > ll;
          await sub.ask({
            t: "mc", q: "Beim Hebel „" + H.name + "“: Wie verhalten sich Kraftarm und Lastarm?",
            opts: ["Der Kraftarm ist länger als der Lastarm: Man spart Kraft.", "Der Kraftarm ist kürzer als der Lastarm: Man braucht mehr Kraft als die Last wiegt.", "Beide sind etwa gleich lang."], a: longer ? 0 : 1,
            why: longer ? "Der Kraftarm ist länger, deshalb reicht eine kleinere Kraft als die Last. Dafür bewegt sich die Kraft über einen längeren Weg." : "Hier ist der Kraftarm kürzer. Der Muskel muss deutlich mehr Kraft aufbringen, als das Gewicht in der Hand wiegt. Dafür bewegt sich die Hand weit und schnell.",
          }, { tag: "Kraft sparen?" });
          sub.show(h("div", { class: "kg-actions" }, h("button", { class: "kg-go", type: "button", text: idx + 1 < total ? "Nächster Hebel" : "Fertig", onclick: resolve })));
          return;
        }
        // Falsch: richtige Teile bleiben, falsche werden gelöscht
        const wrong = ["pivot", "kraft", "last"].filter((k) => !res[k]);
        wrong.forEach((k) => (marks[k] = null));
        KG.util.addReview({ t: "mc", q: "Beim Hebel „" + H.name + "“: Wo liegt der Drehpunkt?", opts: [H.pLab, "Dort, wo die Kraft angreift (" + H.kLab + ")", "Dort, wo die Last angreift (" + H.lLab + ")"], a: 0, why: "Der Drehpunkt ist die Stelle, um die sich der Hebel dreht: " + H.pLab + "." });
        msg.className = "kg-fb bad";
        const tip = { pivot: "Der Drehpunkt ist die Stelle, um die sich der Hebel dreht.", kraft: "Der Kraftarm führt vom Drehpunkt zum Angriffspunkt der Kraft (" + H.kLab + ").", last: "Der Lastarm führt vom Drehpunkt zum Angriffspunkt der Last (" + H.lLab + ")." };
        msg.replaceChildren(h("p", { class: "kg-fb-h", text: "Noch nicht ganz" }), h("p", { class: "kg-fb-w", text: "Falsch: " + wrong.map((k) => names[k]).join(", ") + ". " + tip[wrong[0]] }));
        if (tries >= 3) {
          H.show = true;
          H.locked = true;
          check.remove();
          reset.remove();
          msg.append(h("p", { class: "kg-fb-w", text: "Gestrichelt siehst du die richtige Lösung." }), h("button", { class: "kg-go", type: "button", text: idx + 1 < total ? "Nächster Hebel" : "Fertig", onclick: resolve }));
        }
        paint();
      });

      setTool("pivot");
      paint();
      ctx.show(h("div", { class: "kg-card" },
        h("p", { class: "kg-tag", text: "Hebel " + (idx + 1) + " von " + total }),
        h("h2", { class: "kg-h", text: H.name }),
        h("p", { html: "Markiere <b>Drehpunkt</b>, <b>Kraftarm</b> und <b>Lastarm</b>." }),
        h("div", { class: "det-wrap" }, svg), toolBar, hint, h("div", { class: "kg-actions" }, check, reset), msg, host));
    });
  }

  KG.level({
    n: 7,
    name: "Hebel-Markierung",
    topic: "Hebel im Alltag",
    goal: "Ich kann bei Hebeln im Alltag Drehpunkt, Kraftarm und Lastarm erkennen und einzeichnen.",
    async run(ctx) {
      await ctx.intro("Hebel-Markierung", [
        "Hebel stecken überall: in Schere, Brecheisen, Schubkarre, Flaschenöffner und sogar in deinem Arm.",
        "Der <b>Drehpunkt</b> ist der Punkt, um den sich der Hebel dreht. Der <b>Kraftarm</b> geht vom Drehpunkt bis dorthin, wo die Kraft angreift. Der <b>Lastarm</b> geht vom Drehpunkt bis zur Last.",
      ]);
      const list = HEBEL.map((x) => Object.assign({}, x, { locked: false, show: false }));
      for (let i = 0; i < list.length; i++) {
        ctx.progress(i / list.length);
        await markieren(ctx, list[i], i, list.length);
      }
      await ctx.finish();
    },
  });
})();
