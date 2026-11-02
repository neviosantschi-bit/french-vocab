"use strict";

// Kräfte-Spiel: das Gerüst.
//   - Spielstand (localStorage, pro Konto): erledigte Level, XP, Wiederholungsliste
//   - Fragen (Auswahl und Zahl), Zuordnen per Ziehen oder Tippen, Wiederholung
//   - Stationsübersicht mit den 10 Lernzielen
// Die Level selbst stehen in levels-*.js und melden sich mit KG.level({ ... }) an.

const KG = (() => {
  const LEVELS = [];
  const KEY = "lb-kraefte:";

  let state = null;
  let stateKey = "";
  let root = null;
  let exitFn = () => {};
  let runId = 0; // zählt hoch, wenn man ein Level verlässt: alte Abläufe hören dann auf
  let refs = []; // XP- und Energieanzeigen, die gerade im DOM sind
  let live = 0; // Fortschritt im laufenden Level (0 bis 1), füllt die Stationsenergie vor

  /* ---------------- Kleinigkeiten ---------------- */

  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  function shuffle(a) {
    const out = a.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = rnd(i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  // Zahl für die Anzeige: Punkt als Dezimalzeichen, keine überflüssigen Nullen.
  const fmt = (x, d = 2) => String(+Number(x).toFixed(d));

  // Element bauen. props: class, html, text, on<Ereignis>, style (Objekt), sonst Attribut.
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach((k) => {
        const v = props[k];
        if (v == null || v === false) return;
        if (k === "class") e.className = v;
        else if (k === "html") e.innerHTML = v;
        else if (k === "text") e.textContent = v;
        else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
        else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v);
        else e.setAttribute(k, v === true ? "" : v);
      });
    }
    kids.flat(2).forEach((c) => {
      if (c == null || c === false) return;
      e.append(c);
    });
    return e;
  }

  // SVG aus Text bauen. Ein Teilstück (z. B. "<g>") wird in ein <svg> gepackt, damit es im SVG-Namensraum landet.
  const svgEl = (markup) => {
    const m = markup.trim();
    const t = document.createElement("template");
    t.innerHTML = /^<svg[\s>]/.test(m) ? m : '<svg xmlns="http://www.w3.org/2000/svg">' + m + "</svg>";
    return /^<svg[\s>]/.test(m) ? t.content.firstChild : t.content.firstChild.firstChild;
  };

  /* ---------------- Spielstand ---------------- */

  const fresh = () => ({ v: 1, done: {}, xp: 0, counter: 0, review: [], misc: {} });

  function load() {
    const u = typeof Auth !== "undefined" ? Auth.current() : null;
    stateKey = KEY + (u ? u.key : "gast");
    let s = null;
    try {
      s = JSON.parse(localStorage.getItem(stateKey));
    } catch (e) {
      /* leer */
    }
    state = Object.assign(fresh(), s && s.v === 1 ? s : {});
  }

  function save() {
    try {
      localStorage.setItem(stateKey, JSON.stringify(state));
    } catch (e) {
      /* Privatmodus o.ä. - egal */
    }
  }

  const doneCount = () => Object.keys(state.done).length;

  // Rang: wächst mit der Wurzel der XP. Rang n beginnt bei 60 · (n-1)² XP.
  function rankInfo() {
    const rank = 1 + Math.floor(Math.sqrt(state.xp / 60));
    const lo = 60 * (rank - 1) * (rank - 1);
    const hi = 60 * rank * rank;
    return { rank, lo, hi, frac: (state.xp - lo) / (hi - lo) };
  }

  /* ---------------- Anzeigen: XP und Stationsenergie ---------------- */

  function meter(kind, label, valueText, frac) {
    const fill = h("span", { class: "kg-fill", style: { width: clamp(frac, 0, 1) * 100 + "%" } });
    const val = h("span", { class: "kg-m-val", text: valueText });
    const lab = h("span", { class: "kg-m-lab", text: label });
    const el = h("div", { class: "kg-meter kg-m-" + kind }, h("div", { class: "kg-m-row" }, lab, val), h("div", { class: "kg-bar" }, fill));
    return { el, fill, val, lab };
  }

  function meters() {
    const xp = meter("xp", "", "", 0);
    const en = meter("en", "Stationsenergie", "", 0);
    const box = h("div", { class: "kg-meters" }, xp.el, en.el);
    const r = { box, xp, en };
    refs.push(r);
    paintMeters(r);
    return box;
  }

  // fresh: eine neue Anzeige, die noch nicht im DOM steht
  function paintMeters(fresh) {
    refs = refs.filter((r) => r === fresh || r.box.isConnected);
    const r = rankInfo();
    const energy = clamp((doneCount() + live) / LEVELS.length, 0, 1);
    refs.forEach((x) => {
      x.xp.lab.textContent = "Rang " + r.rank;
      x.xp.val.textContent = state.xp + " XP";
      x.xp.fill.style.width = clamp(r.frac, 0, 1) * 100 + "%";
      x.en.val.textContent = Math.round(energy * 100) + " %";
      x.en.fill.style.width = energy * 100 + "%";
    });
  }

  function addXp(n) {
    if (!n) return;
    const before = rankInfo().rank;
    state.xp += n;
    save();
    paintMeters();
    const t = h("div", { class: "kg-float", text: "+" + n + " XP" });
    root.append(t);
    setTimeout(() => t.remove(), 1400);
    if (rankInfo().rank > before) toast("Rang " + rankInfo().rank + " erreicht");
  }

  function toast(text) {
    const t = h("div", { class: "kg-toast", role: "status", text });
    root.append(t);
    setTimeout(() => t.remove(), 2600);
  }

  /* ---------------- Fragen ---------------- */

  // Fragen sind einfache Daten, damit sie in der Wiederholungsliste landen können:
  //   { t: "mc", q, opts: [...], a: Index, why }
  //   { t: "num", q, a: Zahl, tol: Toleranz, unit: "N", why }
  const qid = (q) => q.q;

  function addReview(q) {
    if (!q.q) return;
    const id = qid(q);
    const have = state.review.find((r) => qid(r.item) === id);
    const item = { t: q.t, q: q.q, opts: q.opts, a: q.a, tol: q.tol, unit: q.unit, why: q.why, alts: q.alts };
    if (have) {
      have.box = 0;
      have.due = state.counter + 4;
    } else {
      state.review.push({ item, box: 0, due: state.counter + 4 });
    }
    save();
  }

  function promote(q, ok) {
    const r = state.review.find((x) => qid(x.item) === qid(q));
    if (!r) return;
    if (ok) {
      r.box += 1;
      if (r.box >= 3) state.review.splice(state.review.indexOf(r), 1);
      else r.due = state.counter + 6 * r.box;
    } else {
      r.box = 0;
      r.due = state.counter + 4;
    }
    save();
  }

  const dueItems = () => state.review.filter((r) => r.due <= state.counter);

  // Begriffe vergleichen: Gross-/Kleinschreibung, Umlaute (ä = ae), Leerzeichen und Bindestriche egal.
  const norm = (s) =>
    String(s)
      .toLowerCase()
      .replace(/ß/g, "ss")
      .replace(/ä/g, "a")
      .replace(/ö/g, "o")
      .replace(/ü/g, "u")
      .replace(/(a)e|(o)e|(u)e/g, "$1$2$3")
      .replace(/[^a-z0-9]/g, "");

  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i].concat(Array(b.length).fill(0)));
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }

  // 0 = falsch, 1 = richtig, 2 = fast richtig (ein Tippfehler)
  function matchText(input, q) {
    const x = norm(input);
    if (!x) return 0;
    const all = [q.a].concat(q.alts || []).map(norm);
    if (all.includes(x)) return 1;
    return all.some((t) => t.length >= 6 && lev(x, t) <= (t.length >= 12 ? 2 : 1)) ? 2 : 0;
  }

  function parseNum(s) {
    const m = String(s).replace(",", ".").match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : NaN;
  }

  // Eine Frage stellen. Gibt { ok, ms } zurück, sobald man auf "Weiter" tippt.
  // opt: { attempt, tag, extra (Element über den Antworten), timer (Sekunden), review }
  function ask(ctx, q, opt) {
    opt = opt || {};
    return new Promise((resolve) => {
      const started = performance.now();
      const isNum = q.t === "num";
      const isText = q.t === "text";
      const card = h("div", { class: "kg-card kg-ask" });
      card.__q = q; // für automatische Tests
      if (opt.tag || opt.attempt) card.append(h("p", { class: "kg-tag", text: opt.tag || "Nochmal" }));
      const qEl = h("p", { class: "kg-q" });
      qEl.innerHTML = q.q;
      card.append(qEl);
      if (opt.extra) card.append(opt.extra);

      const fb = h("div", { class: "kg-fb hidden", role: "status" });
      let timerBar = null;
      let raf = 0;
      let finished = false;

      function finish(ok, timedOut, typo) {
        if (finished) return;
        finished = true;
        cancelAnimationFrame(raf);
        if (timerBar) timerBar.classList.add("hidden");
        state.counter += 1;
        if (opt.review) promote(q, ok);
        else if (!ok) addReview(q);
        else if (state.review.length) promote(q, true);
        save();
        if (ok) addXp(opt.xp != null ? opt.xp : opt.attempt ? 3 : isNum ? 15 : isText ? 12 : 10);

        fb.classList.remove("hidden");
        fb.classList.add(ok ? "ok" : "bad");
        const answer = isNum ? fmt(q.a, 3) + (q.unit ? " " + q.unit : "") : isText ? q.a : q.opts[q.a];
        fb.append(h("p", { class: "kg-fb-h", text: ok ? "Richtig" : timedOut ? "Zeit abgelaufen" : "Nicht ganz" }));
        if (!ok) fb.append(h("p", { class: "kg-fb-a", html: "Richtig ist: <b>" + answer + "</b>" }));
        if (ok && typo) fb.append(h("p", { class: "kg-fb-a", html: "Fast: richtig geschrieben heisst es <b>" + typo + "</b>." }));
        if (q.why) fb.append(h("p", { class: "kg-fb-w", html: q.why }));
        const go = h("button", { class: "kg-go", type: "button", text: "Weiter" });
        go.addEventListener("click", () => resolve({ ok, ms: performance.now() - started }));
        fb.append(go);
        go.focus({ preventScroll: true });
        fb.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }

      if (isNum || isText) {
        const input = h("input", { class: "kg-input", type: "text", inputmode: isNum ? "decimal" : "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", placeholder: isText ? "Begriff eintippen" : "Deine Antwort", "aria-label": "Deine Antwort" });
        const unit = q.unit ? h("span", { class: "kg-unit", text: q.unit }) : null;
        const submit = h("button", { class: "kg-go", type: "submit", text: "Prüfen" });
        const form = h("form", { class: "kg-numform" }, h("div", { class: "kg-numrow" }, input, unit), submit);
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          if (isText) {
            if (!norm(input.value)) {
              input.classList.add("shake");
              setTimeout(() => input.classList.remove("shake"), 400);
              return;
            }
            input.disabled = true;
            submit.remove();
            const m = matchText(input.value, q);
            finish(m > 0, false, m === 2 ? q.a : "");
            return;
          }
          const x = parseNum(input.value);
          if (isNaN(x)) {
            input.classList.add("shake");
            setTimeout(() => input.classList.remove("shake"), 400);
            return;
          }
          input.disabled = true;
          submit.remove();
          finish(Math.abs(x - q.a) <= q.tol, false);
        });
        card.append(form);
        setTimeout(() => input.focus({ preventScroll: true }), 50);
      } else {
        const order = shuffle(q.opts.map((_, i) => i));
        const list = h("div", { class: "kg-opts" });
        order.forEach((i) => {
          const b = h("button", { class: "kg-opt", type: "button" });
          b.innerHTML = q.opts[i];
          b.addEventListener("click", () => {
            list.querySelectorAll("button").forEach((x) => (x.disabled = true));
            b.classList.add(i === q.a ? "right" : "wrong");
            if (i !== q.a) list.querySelectorAll("button").forEach((x, k) => order[k] === q.a && x.classList.add("right"));
            finish(i === q.a, false);
          });
          list.append(b);
        });
        card.append(list);
      }
      card.append(fb);

      if (opt.timer) {
        const fill = h("span", { class: "kg-fill" });
        timerBar = h("div", { class: "kg-timer", "aria-hidden": "true" }, fill);
        card.prepend(timerBar);
        const t0 = performance.now();
        const tick = () => {
          if (finished || !ctx.alive()) return;
          const left = 1 - (performance.now() - t0) / (opt.timer * 1000);
          fill.style.width = clamp(left, 0, 1) * 100 + "%";
          fill.classList.toggle("low", left < 0.3);
          if (left <= 0) {
            card.querySelectorAll("button.kg-opt, input").forEach((x) => (x.disabled = true));
            const sub = card.querySelector("button[type=submit]");
            if (sub) sub.remove();
            finish(false, true);
            return;
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }
      ctx.show(card, opt.keep);
    });
  }

  // Mehrere Fragen. Falsche kommen am Ende der Reihe noch einmal (höchstens zweimal).
  async function quiz(ctx, list, opt) {
    opt = opt || {};
    const queue = list.slice();
    const tries = new Map();
    let solved = 0;
    const total = list.length;
    while (queue.length) {
      const q = queue.shift();
      const attempt = tries.get(q) || 0;
      const r = await ask(ctx, q, { attempt, tag: opt.tag, review: opt.review });
      if (!r.ok && attempt < 2) {
        tries.set(q, attempt + 1);
        queue.push(q);
      } else solved += 1;
      if (opt.progress) ctx.progress(opt.progress(solved / total));
    }
  }

  // Wiederholung: bis zu max fällige Fragen aus der Liste.
  async function reviewDue(ctx, max, force) {
    let items = force ? state.review.slice() : dueItems();
    items = items.slice(0, max);
    if (!items.length) return 0;
    ctx.show(
      h("div", { class: "kg-card" }, h("p", { class: "kg-tag", text: "Wiederholung" }), h("h2", { class: "kg-h", text: "Das kam schon einmal dran" }),
        h("p", { text: "Diese " + (items.length === 1 ? "Frage hast du" : items.length + " Fragen hast du") + " letztes Mal verpasst. Kurz nochmal, dann geht es weiter." }))
    );
    await cont(ctx, "Los");
    for (const r of items) {
      if (!ctx.alive()) return 0;
      await ask(ctx, r.item, { tag: "Wiederholung", review: true });
    }
    return items.length;
  }

  function cont(ctx, label, host) {
    return new Promise((resolve) => {
      const b = h("button", { class: "kg-go", type: "button", text: label || "Weiter" });
      b.addEventListener("click", () => {
        b.remove();
        resolve();
      });
      (host || ctx.stage).append(b);
      b.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }

  /* ---------------- Ziehen und Tippen ---------------- */

  // Eine Karte, die man auf eine Zone ziehen oder (Tippen: Karte wählen, dann Zone tippen) legen kann.
  function dragCard(card, zones, onDrop) {
    card.style.touchAction = "none";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    const zoneAt = (x, y) => {
      const hit = document.elementsFromPoint(x, y);
      return zones.find((z) => hit.includes(z)) || null;
    };
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.classList.toggle("picked");
      }
    });
    card.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      const r = card.getBoundingClientRect();
      const sx = e.clientX;
      const sy = e.clientY;
      let moved = false;
      let over = null;
      const ghost = card.cloneNode(true);
      ghost.classList.add("kg-ghost");
      Object.assign(ghost.style, { position: "fixed", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", margin: "0", zIndex: "1000", pointerEvents: "none" });
      const move = (ev) => {
        if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) {
          moved = true;
          document.body.append(ghost);
          card.classList.add("lifted");
        }
        if (!moved) return;
        ghost.style.transform = "translate(" + (ev.clientX - sx) + "px," + (ev.clientY - sy) + "px) scale(1.05) rotate(2deg)";
        const z = zoneAt(ev.clientX, ev.clientY);
        if (z !== over) {
          if (over) over.classList.remove("over");
          if (z) z.classList.add("over");
          over = z;
        }
      };
      const end = (ev) => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", end);
        window.removeEventListener("pointercancel", end);
        ghost.remove();
        card.classList.remove("lifted");
        if (over) over.classList.remove("over");
        if (ev.type === "pointercancel") return;
        if (moved) {
          const z = zoneAt(ev.clientX, ev.clientY);
          if (z) onDrop(z);
        } else card.classList.toggle("picked");
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", end);
      window.addEventListener("pointercancel", end);
    });
    zones.forEach((z) =>
      z.addEventListener("click", () => {
        if (!card.classList.contains("picked")) return;
        card.classList.remove("picked");
        onDrop(z);
      })
    );
  }

  // Zuordnen: eine Karte nach der anderen auf die richtige Zone legen.
  //   items: [{ face: Element, label, zone: Zonen-id, why }]
  //   zones: [{ id, name, sub }]
  async function sort(ctx, opt) {
    const { items, zones } = opt;
    const queue = shuffle(items);
    const wrongOnce = new Set();
    let placed = 0;
    const total = items.length;

    const count = h("p", { class: "kg-count" });
    const deck = h("div", { class: "kg-sortdeck" });
    const msg = h("div", { class: "kg-fb hidden", role: "status" });
    const zoneEls = zones.map((z) => {
      const b = h("button", { class: "kg-zone", type: "button", "data-zone": z.id }, h("b", { text: z.name }), z.sub ? h("small", { text: z.sub }) : null);
      return b;
    });
    const zoneBox = h("div", { class: "kg-zones" + (zones.length > 3 ? " five" : "") }, zoneEls);
    const wrap = h("div", { class: "kg-card" }, opt.lead ? h("p", { class: "kg-lead", html: opt.lead }) : null, count, deck, msg, h("p", { class: "kg-hint", text: "Ziehe die Karte auf die richtige Zone oder tippe die Karte und dann die Zone an." }), zoneBox);
    ctx.show(wrap);

    return new Promise((resolve) => {
      function next() {
        msg.classList.add("hidden");
        msg.className = "kg-fb hidden";
        msg.replaceChildren();
        deck.replaceChildren();
        if (!queue.length) return resolve();
        const it = queue[0];
        count.textContent = placed + 1 + " von " + total;
        const card = h("div", { class: "kg-sortcard" }, it.face.cloneNode(true));
        card.__item = it; // für automatische Tests
        deck.append(card);
        calm(card);
        dragCard(card, zoneEls, (z) => {
          const id = z.getAttribute("data-zone");
          if (id === it.zone) {
            queue.shift();
            placed += 1;
            ctx.progress(placed / total);
            addXp(wrongOnce.has(it) ? 3 : 8);
            z.classList.add("hit");
            setTimeout(() => z.classList.remove("hit"), 500);
            card.classList.add("gone");
            setTimeout(next, 380);
          } else {
            if (!wrongOnce.has(it)) {
              wrongOnce.add(it);
              addReview({ t: "mc", q: "Welche Art ist das? „" + it.label + "“", opts: zones.map((x) => x.name), a: zones.findIndex((x) => x.id === it.zone), why: it.why });
            }
            const zn = zones.find((x) => x.id === id).name;
            card.classList.add("shake");
            setTimeout(() => card.classList.remove("shake"), 450);
            msg.className = "kg-fb bad";
            msg.replaceChildren(h("p", { class: "kg-fb-h", text: "Das ist nicht „" + zn + "“" }), h("p", { class: "kg-fb-w", html: it.why }));
            queue.push(queue.shift()); // kommt später nochmal
            const again = h("button", { class: "kg-go", type: "button", text: "Weiter" });
            again.addEventListener("click", next);
            msg.append(again);
            again.focus({ preventScroll: true });
          }
        });
      }
      next();
    });
  }

  /* ---------------- Federn und Zahlen ---------------- */

  // Bewegt einen Wert gedämpft schwingend zum Ziel, wie eine echte Feder. set(wert) zeichnet.
  function springTo(from, to, set, alive) {
    const t0 = performance.now();
    const w = 14; // Eigenfrequenz
    const z = 0.38; // Dämpfung (<1: schwingt nach)
    const wd = w * Math.sqrt(1 - z * z);
    const d = from - to;
    const step = () => {
      if (alive && !alive()) return;
      const t = (performance.now() - t0) / 1000;
      const k = Math.exp(-z * w * t);
      const x = to + d * k * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
      set(x);
      if (t < 1.6) requestAnimationFrame(step);
      else set(to);
    };
    requestAnimationFrame(step);
  }

  /* ---------------- Level-Gerüst ---------------- */

  function level(def) {
    LEVELS.push(def);
    LEVELS.sort((a, b) => a.n - b.n);
  }

  function makeCtx(def, stage) {
    const id = runId;
    const ctx = {
      def,
      stage,
      earned: 0,
      alive: () => id === runId && stage.isConnected,
      show(node, keep) {
        if (!ctx.alive()) return;
        if (keep) stage.append(node);
        else stage.replaceChildren(node);
        if (!keep) window.scrollTo(0, 0);
      },
      progress(f) {
        live = clamp(f, 0, 1);
        paintMeters();
      },
      // Fragen in einem Teil der Seite stellen, ohne das Labor darüber zu ersetzen.
      sub(host) {
        const s = Object.create(ctx);
        s.show = (node) => {
          if (ctx.alive()) host.replaceChildren(node);
        };
        s.ask = (q, o) => ask(s, q, o);
        s.quiz = (l, o) => quiz(s, l, o);
        s.sort = (o) => sort(s, o);
        s.cont = (label) => cont(s, label, host);
        return s;
      },
      ask: (q, o) => ask(ctx, q, o),
      quiz: (list, o) => quiz(ctx, list, o),
      sort: (o) => sort(ctx, o),
      cont: (label, host) => cont(ctx, label, host),
      reviewDue: (max) => reviewDue(ctx, max),
      async intro(title, lines, button) {
        ctx.show(h("div", { class: "kg-card kg-intro" }, h("h2", { class: "kg-h", text: title }), lines.map((l) => h("p", { html: l }))));
        await cont(ctx, button || "Los geht’s");
      },
      async finish(note) {
        live = 0;
        const first = !state.done[def.n];
        state.done[def.n] = true;
        state.misc.justDone = def.n;
        if (first) addXp(50);
        save();
        paintMeters();
        ctx.show(finishCard(def, first, note));
      },
    };
    return ctx;
  }

  function finishCard(def, first, note) {
    const next = LEVELS.find((l) => l.n === def.n + 1);
    const all = doneCount() === LEVELS.length;
    const card = h("div", { class: "kg-card kg-finish" }, h("div", { class: "kg-lit", html: moduleSvg(def.n, true) }), h("p", { class: "kg-tag", text: first ? "Modul repariert" : "Modul geschafft" }),
      h("h2", { class: "kg-h", text: def.name + ": Licht an" }),
      h("p", { text: all ? "Alle zehn Module laufen. Die Station ist wieder am Netz." : "Die Stationsenergie liegt jetzt bei " + Math.round((doneCount() / LEVELS.length) * 100) + " %." }),
      note ? h("p", { class: "kg-note", html: note }) : null,
      h("div", { class: "kg-actions" },
        next && !all ? h("button", { class: "kg-go", type: "button", text: "Weiter zu " + next.name, onclick: () => openLevel(next.n) }) : null,
        h("button", { class: "kg-go ghost", type: "button", text: "Zur Station", onclick: showStation })));
    return card;
  }

  async function openLevel(n) {
    const def = LEVELS.find((l) => l.n === n);
    if (!def) return;
    runId += 1;
    live = 0;
    const stage = h("div", { class: "kg-stage" });
    root.replaceChildren(
      h("header", { class: "kg-top" },
        h("button", { class: "kg-pill back", type: "button", text: "Station", onclick: showStation }),
        h("div", { class: "kg-ttl" }, h("small", { text: "Modul " + n + " von " + LEVELS.length }), h("b", { text: def.name }), h("span", { text: def.topic })),
        meters()),
      stage
    );
    window.scrollTo(0, 0);
    const ctx = makeCtx(def, stage);
    try {
      await ctx.reviewDue(2);
      if (ctx.alive()) await def.run(ctx);
    } catch (e) {
      console.error(e);
      if (ctx.alive()) ctx.show(h("div", { class: "kg-card" }, h("h2", { class: "kg-h", text: "Hier hakt etwas" }), h("p", { text: "Das Modul ist abgestürzt. Zurück zur Station und nochmal versuchen." }), h("button", { class: "kg-go", type: "button", text: "Zur Station", onclick: showStation })));
    }
  }

  /* ---------------- Station: Übersicht ---------------- */

  // Ein Modul der Station. Erledigt: Fenster leuchten.
  function moduleSvg(n, big) {
    const def = LEVELS.find((l) => l.n === n);
    return (
      '<svg viewBox="0 0 140 90" class="kg-mod-svg' + (big ? " big" : "") + '" aria-hidden="true">' +
      '<rect x="6" y="10" width="128" height="70" rx="14" class="m-body"/>' +
      [0, 1, 2].map((i) => '<rect x="' + (24 + i * 34) + '" y="24" width="22" height="14" rx="4" class="m-win" style="--i:' + i + '"/>').join("") +
      '<text x="70" y="64" text-anchor="middle" class="m-num">' + n + "</text>" +
      "</svg>"
    );
  }

  function stationSvg() {
    const W = 108;
    const H = 62;
    let s = '<svg viewBox="0 0 632 222" class="kg-map" role="group" aria-label="Die Raumstation mit zehn Modulen">';
    s += '<rect x="0" y="104" width="632" height="14" rx="7" class="m-pipe"/>';
    LEVELS.forEach((l, i) => {
      const row = i < 5 ? 0 : 1;
      const col = i % 5;
      const x = 14 + col * 124;
      const y = row ? 138 : 22;
      const done = !!state.done[l.n];
      const just = state.misc.justDone === l.n;
      s += '<line x1="' + (x + W / 2) + '" x2="' + (x + W / 2) + '" y1="' + (row ? 118 : y + H) + '" y2="' + (row ? y : 104) + '" class="m-link' + (done ? " lit" : "") + '"/>';
      s += '<g class="mod' + (done ? " is-done" : "") + (just ? " just" : "") + '" data-n="' + l.n + '" tabindex="0" role="button" aria-label="Modul ' + l.n + ", " + l.name + (done ? ", erledigt" : "") + '">';
      s += '<rect x="' + x + '" y="' + y + '" width="' + W + '" height="' + H + '" rx="12" class="m-body"/>';
      for (let k = 0; k < 3; k++) s += '<rect x="' + (x + W - 38 + k * 0) + '" y="' + (y + 10 + k * 14) + '" width="26" height="8" rx="3" class="m-win" style="--i:' + k + '"/>';
      s += '<text x="' + (x + 12) + '" y="' + (y + 34) + '" class="m-num">' + l.n + "</text>";
      s += '<text x="' + (x + 12) + '" y="' + (y + 52) + '" class="m-nm">' + l.name + "</text>";
      s += "</g>";
    });
    return s + "</svg>";
  }

  function showStation() {
    runId += 1;
    live = 0;
    const r = rankInfo();
    const due = dueItems().length;
    const all = doneCount() === LEVELS.length;
    const next = LEVELS.find((l) => !state.done[l.n]) || LEVELS[0];

    const map = h("div", { class: "kg-mapwrap", html: stationSvg() });
    map.querySelectorAll(".mod").forEach((g) => {
      const open = () => openLevel(+g.getAttribute("data-n"));
      g.addEventListener("click", open);
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });

    const rows = LEVELS.map((l) => {
      const done = !!state.done[l.n];
      return h("li", { class: "kg-goal" + (done ? " is-done" : "") },
        h("span", { class: "kg-check", role: "img", "aria-label": done ? "erledigt" : "noch offen", html: done ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>' : "" }),
        h("div", { class: "kg-goal-t" }, h("b", { text: l.n + ". " + l.name }), h("small", { text: l.topic }), h("p", { text: l.goal })),
        h("button", { class: "kg-pill", type: "button", text: done ? "Nochmal" : l.n === next.n ? "Start" : "Öffnen", onclick: () => openLevel(l.n) }));
    });

    root.replaceChildren(
      h("header", { class: "kg-top" },
        h("button", { class: "kg-pill back", type: "button", text: "Natur und Technik", onclick: () => exitFn() }),
        h("div", { class: "kg-ttl" }, h("small", { text: "Natur und Technik" }), h("b", { text: "Kräfte" }), h("span", { text: "Die Raumstation reparieren" })),
        meters()),
      h("div", { class: "kg-stage" },
        h("div", { class: "kg-card kg-hero" },
          h("h1", { class: "kg-h1", text: all ? "Die Station läuft wieder." : "Die Station ist ausgefallen." }),
          h("p", { text: all ? "Alle zehn Module sind repariert. Du kannst jedes Modul nochmal üben, bis alles sitzt." : "Du bist die Ingenieurin oder der Ingenieur an Bord. Jedes Modul ist ein Level zum Thema Kräfte. Repariere es, dann geht dort das Licht wieder an." }),
          map,
          h("div", { class: "kg-actions" },
            h("button", { class: "kg-go", type: "button", text: all ? "Modul wählen" : (doneCount() ? "Weiter mit " : "Start mit ") + next.name, onclick: () => (all ? document.querySelector(".kg-goals").scrollIntoView({ behavior: "smooth" }) : openLevel(next.n)) }),
            state.review.length ? h("button", { class: "kg-go ghost", type: "button", text: due ? "Wiederholen (" + due + " fällig)" : "Wiederholen (" + state.review.length + ")", onclick: () => reviewScreen() }) : null)),
        h("div", { class: "kg-card" },
          h("h2", { class: "kg-h", text: "Meine Lernziele" }),
          h("p", { class: "kg-lead", text: "Ein Haken erscheint, sobald du das Modul geschafft hast." }),
          h("ol", { class: "kg-goals" }, rows)),
        h("div", { class: "kg-reset" },
          h("button", { class: "kg-link", type: "button", text: "Spielstand löschen", onclick: resetAsk }),
          h("span", { class: "kg-reset-ask hidden" }))
      )
    );
    state.misc.justDone = null;
    save();
    window.scrollTo(0, 0);
  }

  function resetAsk(e) {
    const box = e.target.parentElement.querySelector(".kg-reset-ask");
    e.target.classList.add("hidden");
    box.classList.remove("hidden");
    box.replaceChildren(
      "Alle Level, XP und die Wiederholungsliste löschen? ",
      h("button", { class: "kg-link danger", type: "button", text: "Ja, löschen", onclick: () => { state = fresh(); save(); showStation(); } }),
      " ",
      h("button", { class: "kg-link", type: "button", text: "Abbrechen", onclick: showStation })
    );
  }

  async function reviewScreen() {
    runId += 1;
    const stage = h("div", { class: "kg-stage" });
    root.replaceChildren(
      h("header", { class: "kg-top" }, h("button", { class: "kg-pill back", type: "button", text: "Station", onclick: showStation }), h("div", { class: "kg-ttl" }, h("small", { text: "Wiederholung" }), h("b", { text: "Verpasste Fragen" })), meters()),
      stage
    );
    const ctx = makeCtx({ n: 0, name: "Wiederholung" }, stage);
    const list = state.review.slice();
    for (const r of list) {
      if (!ctx.alive()) return;
      await ask(ctx, r.item, { tag: "Wiederholung", review: true });
    }
    ctx.show(h("div", { class: "kg-card" }, h("h2", { class: "kg-h", text: "Fertig" }), h("p", { text: state.review.length ? state.review.length + " Fragen bleiben auf der Liste und kommen später wieder." : "Die Liste ist leer. Nichts mehr offen." }), h("button", { class: "kg-go", type: "button", text: "Zur Station", onclick: showStation })));
  }

  /* ---------------- Von außen ---------------- */

  function open(rootEl, exit) {
    root = rootEl;
    exitFn = exit;
    load();
    root.classList.add("kg");
    showStation();
  }

  function close() {
    runId += 1;
    refs = [];
  }

  // Pfeilspitzen für die Zeichnungen (eine pro Farbe, damit es überall gleich aussieht)
  const arrowDefs =
    "<defs>" +
    [["b", "#4fd8e8"], ["r", "#ff6b7a"], ["a", "#ffbe55"], ["g", "#4fe3a1"], ["w", "#e6eefc"]]
      .map((c) => '<marker id="kg-ah-' + c[0] + '" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="' + c[1] + '"/></marker>')
      .join("") +
    "</defs>";

  const calm = (el) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) el.querySelectorAll("svg").forEach((s) => s.pauseAnimations && s.pauseAnimations());
  };

  return { level, open, close, norm, matchText, openLevel, showStation, util: { ask, quiz, cont, arrowDefs, calm, h, svgEl, shuffle, pick, rnd, clamp, fmt, dragCard, springTo, addXp, addReview, get state() { return state; }, save }, get levels() { return LEVELS; } };
})();
