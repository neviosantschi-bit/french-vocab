"use strict";

// Bewegung: nur Darstellung, keine Logik der Seite.
//   - Knoepfe ruecken ein kleines Stueck zum Mauszeiger, wenn er in der Naehe ist
//   - die Buchstaben von "pg8" heben sich wie eine Welle unter dem Zeiger
//   - eine kleine Karte folgt dem Zeiger ueber Ordnern und Unit-Zeilen
//   - die Quizkarte neigt sich leicht zum Zeiger
// Alles laeuft in einer einzigen Animationsschleife, die schlaeft, wenn nichts mehr in Bewegung ist.
// Aus bei "weniger Bewegung" und auf Touchgeraeten.

(() => {
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || calm) return;

  const MAGNETS = ".go, .pill, .account, .choice, .unit-chip, .chip";
  const REACH = 90; // so nah (px) muss der Zeiger sein, damit ein Knopf reagiert
  const PULL = 7; // so weit (px) ruecken Knoepfe hoechstens
  const IDLE = 500; // so lange (ms) laeuft die Schleife nach der letzten Mausbewegung weiter

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const visible = (el) => el.getClientRects().length > 0;

  const pointer = { x: -1000, y: -1000, in: false, moved: 0 };

  /* ---------------- Knoepfe ---------------- */

  const pulled = new Map(); // Element -> { x, y } aktueller Versatz

  function magnets(out) {
    const list = pointer.in ? Array.from(document.querySelectorAll(MAGNETS)) : Array.from(pulled.keys());
    const reads = [];
    list.forEach((el) => {
      if (!visible(el) || el.disabled) {
        reads.push({ el: el, tx: 0, ty: 0 });
        return;
      }
      if (!pointer.in) {
        reads.push({ el: el, tx: 0, ty: 0 });
        return;
      }
      const r = el.getBoundingClientRect();
      const ex = Math.max(r.left - pointer.x, 0, pointer.x - r.right);
      const ey = Math.max(r.top - pointer.y, 0, pointer.y - r.bottom);
      const d = Math.hypot(ex, ey);
      if (d >= REACH) {
        reads.push({ el: el, tx: 0, ty: 0 });
        return;
      }
      const f = 1 - d / REACH;
      const nx = clamp((pointer.x - (r.left + r.width / 2)) / Math.max(r.width / 2, 40), -1, 1);
      const ny = clamp((pointer.y - (r.top + r.height / 2)) / Math.max(r.height / 2, 24), -1, 1);
      reads.push({ el: el, tx: nx * PULL * f, ty: ny * PULL * f * 0.8 });
    });
    reads.forEach(({ el, tx, ty }) => {
      const cur = pulled.get(el) || { x: 0, y: 0 };
      cur.x = lerp(cur.x, tx, 0.2);
      cur.y = lerp(cur.y, ty, 0.2);
      if (!tx && !ty && Math.abs(cur.x) < 0.05 && Math.abs(cur.y) < 0.05) {
        el.style.translate = "";
        pulled.delete(el);
        return;
      }
      el.style.translate = cur.x.toFixed(2) + "px " + cur.y.toFixed(2) + "px";
      pulled.set(el, cur);
      out.busy = true;
    });
  }

  /* ---------------- Wortmarke ---------------- */

  const letters = [];
  const mark = document.querySelector(".wordmark");
  if (mark) {
    const text = mark.textContent.trim();
    mark.setAttribute("aria-label", text);
    mark.textContent = "";
    Array.from(text).forEach((ch) => {
      const s = document.createElement("span");
      s.className = "wm-ch";
      s.setAttribute("aria-hidden", "true");
      s.textContent = ch;
      mark.appendChild(s);
      letters.push({ el: s, v: 0 });
    });
  }

  function wordmark(out) {
    if (!mark || !visible(mark)) return;
    const box = mark.getBoundingClientRect();
    const near =
      pointer.in &&
      pointer.x > box.left - 70 &&
      pointer.x < box.right + 70 &&
      pointer.y > box.top - 40 &&
      pointer.y < box.bottom + 40;
    const reads = letters.map((l) => {
      const r = l.el.getBoundingClientRect();
      return { l: l, dx: pointer.x - (r.left + r.width / 2) };
    });
    reads.forEach(({ l, dx }) => {
      const target = near ? Math.exp(-(dx * dx) / (2 * 55 * 55)) : 0;
      l.v = lerp(l.v, target, 0.18);
      if (l.v < 0.003 && !target) {
        if (l.el.style.transform) l.el.style.transform = "";
        l.v = 0;
        return;
      }
      const lean = clamp(dx / 55, -1, 1) * l.v * 9;
      l.el.style.transform =
        "translateY(" + (-9 * l.v).toFixed(2) + "px) rotate(" + lean.toFixed(2) + "deg) scale(" + (1 + 0.14 * l.v).toFixed(3) + ")";
      out.busy = true;
    });
  }

  /* ---------------- Karte am Zeiger ---------------- */

  const card = document.createElement("div");
  card.className = "cursor-card";
  card.setAttribute("aria-hidden", "true");
  card.innerHTML = '<div class="cc"><span class="cc-title"></span><span class="cc-line"></span><span class="cc-line cc-line2"></span></div>';
  document.body.appendChild(card);
  const cc = card.querySelector(".cc");
  const ccTitle = card.querySelector(".cc-title");
  const ccLine = card.querySelector(".cc-line");
  const ccLine2 = card.querySelector(".cc-line2");

  const cardState = { x: 0, y: 0, rot: 0, on: false, target: null };

  // Was die Karte ueber einem Ziel zeigt: [Titel, Zeile 1, Zeile 2, Reiterfarbe]
  function describe(t) {
    if (t.classList.contains("band")) {
      const meter = t.querySelector(".band-meter > span:not(.seg)");
      return [
        t.querySelector(".band-name").textContent,
        (t.querySelector(".band-count") || {}).textContent || "",
        meter ? meter.textContent : "",
        getComputedStyle(t).backgroundColor,
      ];
    }
    // Unit-Zeile: ein zufaelliges Wort aus der Unit als Vorschau
    const name = (t.querySelector(".row-name") || {}).textContent;
    const subject = typeof current !== "undefined" && current && current.subject;
    const unit = subject && subject.units.find((u) => u.name === name);
    const color = getComputedStyle(document.body).getPropertyValue("--c") || "";
    if (unit && unit.entries && unit.entries.length) {
      const e = unit.entries[Math.floor(Math.random() * unit.entries.length)];
      const [a, b] = subject.sides;
      return [e[b.key], e[a.key], "Vorschau", color];
    }
    if (unit && unit.files && unit.files.length) {
      return [unit.name, unit.files.length + (unit.files.length === 1 ? " Datei" : " Dateien"), "zum Herunterladen", color];
    }
    return [name || "", "Noch leer", "", color];
  }

  function aim(e) {
    const t = e.target.closest ? e.target.closest(".band, #unit-list .row") : null;
    if (t && t.closest(".opening")) {
      showCard(null);
      return;
    }
    if (t === cardState.target) return;
    showCard(t);
  }

  function showCard(t) {
    cardState.target = t;
    if (!t) {
      card.classList.remove("is-on");
      cardState.on = false;
      return;
    }
    const [title, line, line2, color] = describe(t);
    ccTitle.textContent = title;
    ccLine.textContent = line;
    ccLine2.textContent = line2;
    ccLine2.hidden = !line2;
    ccLine.hidden = !line;
    card.style.setProperty("--tab", color || "#191c3d");
    // Inhalt wechselt: kurzer Pop, damit man es sieht.
    cc.classList.remove("pop");
    void cc.offsetWidth;
    cc.classList.add("pop");
    if (!cardState.on) {
      // Erstes Erscheinen: direkt am Zeiger starten statt von der alten Stelle zu fliegen.
      cardState.x = pointer.x;
      cardState.y = pointer.y;
    }
    card.classList.add("is-on");
    cardState.on = true;
  }

  function followCard(out) {
    if (!cardState.on && card.style.transform === "") return;
    const nx = lerp(cardState.x, pointer.x, 0.22);
    // Neigung wie im Tutorial: je schneller der Zeiger seitlich ist, desto mehr kippt die Karte.
    const tilt = clamp((pointer.x - nx) * 0.5, -12, 12);
    cardState.rot = lerp(cardState.rot, cardState.on ? tilt : 0, 0.2);
    cardState.y = lerp(cardState.y, pointer.y, 0.22);
    cardState.x = nx;
    card.style.transform =
      "translate3d(" + (cardState.x + 18).toFixed(1) + "px," + (cardState.y + 22).toFixed(1) + "px,0) rotate(" + cardState.rot.toFixed(2) + "deg)";
    if (cardState.on) out.busy = true;
  }

  /* ---------------- Quizkarte ---------------- */

  const tilt = { x: 0, y: 0 };

  function deck(out) {
    const el = document.querySelector(".deck");
    if (!el || !visible(el)) return;
    let tx = 0;
    let ty = 0;
    if (pointer.in) {
      const r = el.getBoundingClientRect();
      const over = pointer.x > r.left - 40 && pointer.x < r.right + 40 && pointer.y > r.top - 40 && pointer.y < r.bottom + 40;
      if (over) {
        tx = clamp((pointer.x - (r.left + r.width / 2)) / (r.width / 2), -1, 1) * 4;
        ty = -clamp((pointer.y - (r.top + r.height / 2)) / (r.height / 2), -1, 1) * 4;
      }
    }
    tilt.x = lerp(tilt.x, tx, 0.12);
    tilt.y = lerp(tilt.y, ty, 0.12);
    if (!tx && !ty && Math.abs(tilt.x) < 0.02 && Math.abs(tilt.y) < 0.02) {
      if (el.style.transform) el.style.transform = "";
      return;
    }
    el.style.transform = "perspective(900px) rotateX(" + tilt.y.toFixed(2) + "deg) rotateY(" + tilt.x.toFixed(2) + "deg)";
    out.busy = true;
  }

  /* ---------------- Schleife ---------------- */

  let raf = 0;

  function tick(now) {
    raf = 0;
    const out = { busy: false };
    magnets(out);
    wordmark(out);
    deck(out);
    followCard(out);
    if (out.busy || now - pointer.moved < IDLE) raf = requestAnimationFrame(tick);
  }

  const wake = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  document.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.in = true;
      pointer.moved = performance.now();
      aim(e);
      wake();
    },
    { passive: true }
  );

  document.documentElement.addEventListener("pointerleave", () => {
    pointer.in = false;
    showCard(null);
    wake();
  });

  // Ein Bildschirmwechsel unter dem ruhenden Zeiger: Karte weg, damit sie nicht haengen bleibt.
  document.addEventListener("click", () => {
    showCard(null);
  });
})();
