"use strict";

// Oberflaeche fuer Tests: Kalender, Eintragen, Details und die Hinweise "Nächster Test".
// Die Daten kommen aus tests-data.js (Tests), Bildschirme und Konten aus app.js und auth.js.

(() => {
  let view = null; // { y, m } angezeigter Monat
  let selected = null; // gewaehlter Tag "YYYY-MM-DD" oder null

  const subjectOf = (id) => SUBJECTS.find((s) => s.id === id);
  const loggedIn = () => Boolean(Auth.current());

  function ensureView() {
    if (view) return;
    const d = new Date();
    view = { y: d.getFullYear(), m: d.getMonth() };
  }

  /* ---------------- Kalender ---------------- */

  window.showTests = function showTests() {
    current = { subject: null, unit: null, sets: [] };
    paint({ id: "tests" });
    ensureView();
    renderTests();
    showScreen("tests");
    Tests.load();
  };

  function renderLede() {
    const lede = $("tests-lede");
    const t = Tests.next();
    if (Tests.status === "off") {
      lede.textContent = "Die gemeinsame Datenbank ist noch nicht eingerichtet. Darum gibt es noch keine Tests.";
    } else if (Tests.status === "error" && !Tests.all().length) {
      lede.textContent = "Die Tests konnten nicht geladen werden. Prüfe dein Internet und öffne die Seite nochmal.";
    } else if (t) {
      lede.textContent = "Nächster Test: " + Tests.label(t) + " (" + Tests.countdown(t.test_date) + ")";
    } else {
      lede.textContent = "Noch kein Test eingetragen. Trag den nächsten ein, dann sehen ihn alle.";
    }
    $("btn-add-test").disabled = Tests.status === "off";
  }

  function pill(t) {
    const el = document.createElement("span");
    el.className = "cal-pill";
    el.dataset.subject = t.subject_id;
    el.dataset.id = t.id;
    el.textContent = t.title;
    el.title = Tests.subjectName(t) + ": " + t.title;
    return el;
  }

  function renderGrid() {
    $("cal-title").textContent = Tests.MONTHS[view.m] + " " + view.y;
    const grid = $("cal-grid");
    grid.innerHTML = "";
    Tests.monthGrid(view.y, view.m).forEach((cell) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cal-day" + (cell.inMonth ? "" : " out") + (cell.today ? " today" : "") + (cell.date === selected ? " sel" : "");
      b.dataset.date = cell.date;
      const day = Tests.onDay(cell.date);
      b.setAttribute(
        "aria-label",
        Tests.short(cell.date) + (day.length ? ", " + day.length + (day.length === 1 ? " Test" : " Tests") : "")
      );
      const num = document.createElement("span");
      num.className = "cal-num";
      num.textContent = cell.day;
      b.appendChild(num);
      day.slice(0, 2).forEach((t) => b.appendChild(pill(t)));
      if (day.length > 2) {
        const more = document.createElement("span");
        more.className = "cal-more";
        more.textContent = "+" + (day.length - 2);
        b.appendChild(more);
      }
      grid.appendChild(b);
    });
  }

  function renderList() {
    const box = $("cal-list");
    box.innerHTML = "";
    let tests;
    if (selected) {
      $("cal-list-title").textContent = "Am " + Tests.short(selected);
      tests = Tests.onDay(selected);
    } else {
      $("cal-list-title").textContent = "Im " + Tests.MONTHS[view.m];
      tests = Tests.inMonth(view.y, view.m);
    }
    if (!tests.length) {
      const p = document.createElement("p");
      p.className = "test-none";
      p.textContent = selected ? "An diesem Tag ist kein Test." : "In diesem Monat ist kein Test eingetragen.";
      box.appendChild(p);
      return;
    }
    tests.forEach((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "test-row";
      b.dataset.id = t.id;
      b.dataset.subject = t.subject_id;
      b.innerHTML = '<i class="test-dot"></i><span class="tr-main"><b></b><span></span></span><span class="tr-when"></span>';
      b.querySelector("b").textContent = t.title;
      const units = Tests.unitNames(t);
      b.querySelector(".tr-main span").textContent = Tests.subjectName(t) + (units.length ? ", " + units.join(", ") : "");
      b.querySelector(".tr-when").textContent = Tests.short(t.test_date) + ", " + Tests.countdown(t.test_date);
      box.appendChild(b);
    });
  }

  function renderTests() {
    renderLede();
    renderGrid();
    renderList();
  }

  function moveMonth(delta) {
    view.m += delta;
    if (view.m < 0) {
      view.m = 11;
      view.y--;
    } else if (view.m > 11) {
      view.m = 0;
      view.y++;
    }
    selected = null;
    renderTests();
  }

  $("cal-prev").addEventListener("click", () => moveMonth(-1));
  $("cal-next").addEventListener("click", () => moveMonth(1));
  $("cal-today").addEventListener("click", () => {
    const d = new Date();
    view = { y: d.getFullYear(), m: d.getMonth() };
    selected = Tests.today();
    renderTests();
  });

  $("cal-grid").addEventListener("click", (e) => {
    const p = e.target.closest(".cal-pill");
    if (p) return openDetail(p.dataset.id);
    const day = e.target.closest(".cal-day");
    if (!day) return;
    const date = day.dataset.date;
    selected = selected === date ? null : date;
    const d = Tests.parse(date);
    if (d.getMonth() !== view.m) view = { y: d.getFullYear(), m: d.getMonth() };
    renderTests();
  });

  $("cal-list").addEventListener("click", (e) => {
    const row = e.target.closest(".test-row");
    if (row) openDetail(row.dataset.id);
  });

  /* ---------------- Details ---------------- */

  let detailId = null;
  let confirmTimer = 0;

  function openDetail(id) {
    const t = Tests.get(id);
    if (!t) return;
    detailId = id;
    const dlg = $("test-detail");
    dlg.dataset.subject = t.subject_id;
    $("td-subject").textContent = Tests.subjectName(t);
    $("td-title").textContent = t.title;
    $("td-when").textContent = Tests.short(t.test_date) + ", " + Tests.countdown(t.test_date);
    $("td-note").textContent = t.note || "";
    $("td-note").hidden = !t.note;

    const box = $("td-units");
    box.innerHTML = "";
    const subject = subjectOf(t.subject_id);
    (t.unit_ids || []).forEach((uid) => {
      const unit = subject && subject.units.find((u) => u.id === uid);
      if (!unit) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "go ghost td-unit";
      b.textContent = unit.name + (unit.entries && unit.entries.length ? " üben" : " öffnen");
      b.addEventListener("click", () => {
        dlg.close();
        showUnits(subject);
        if (unit.entries && unit.entries.length) showSetup(unit);
        else showFiles(unit);
      });
      box.appendChild(b);
    });
    box.hidden = !box.children.length;

    const user = loggedIn();
    $("td-author").textContent = user
      ? t.author
        ? "Eingetragen von " + t.author + "."
        : ""
      : "Melde dich an, um Tests zu ändern oder zu löschen.";
    $("td-edit").hidden = !user;
    $("td-delete").hidden = !user;
    resetDeleteButton();
    if (!dlg.open) dlg.showModal();
    dlg.focus();
  }

  function resetDeleteButton() {
    clearTimeout(confirmTimer);
    $("td-delete").textContent = "Löschen";
    $("td-delete").dataset.sure = "";
  }

  $("td-close").addEventListener("click", () => $("test-detail").close());
  $("td-edit").addEventListener("click", () => {
    const t = Tests.get(detailId);
    $("test-detail").close();
    if (t) openForm(t);
  });

  // Loeschen mit Rueckfrage: erst "Wirklich löschen?", dann wirklich.
  $("td-delete").addEventListener("click", async () => {
    const btn = $("td-delete");
    if (!btn.dataset.sure) {
      btn.dataset.sure = "1";
      btn.textContent = "Wirklich löschen?";
      confirmTimer = setTimeout(resetDeleteButton, 3500);
      return;
    }
    btn.disabled = true;
    const res = await Tests.remove(detailId);
    btn.disabled = false;
    if (!res.ok) {
      $("td-author").textContent = res.error;
      resetDeleteButton();
      return;
    }
    $("test-detail").close();
    renderTests();
  });

  /* ---------------- Eintragen und Aendern ---------------- */

  let editing = null; // Test beim Aendern, sonst null

  function fillSubjects(selectedId) {
    const sel = $("tf-subject");
    sel.innerHTML = "";
    SUBJECTS.forEach((s) => {
      const o = document.createElement("option");
      o.value = s.id;
      o.textContent = s.name;
      sel.appendChild(o);
    });
    sel.value = selectedId || SUBJECTS[0].id;
  }

  // Stoff zum Anhaengen: die Units des gewaehlten Faches (gibt es keine, verschwindet das Feld).
  function fillUnits(subjectId, chosen) {
    const subject = subjectOf(subjectId);
    const box = $("tf-units");
    box.innerHTML = "";
    const units = subject ? subject.units : [];
    units.forEach((u) => {
      const label = chip("checkbox", "unit", u.id, u.name);
      if ((chosen || []).includes(u.id)) label.querySelector("input").checked = true;
      box.appendChild(label);
    });
    $("tf-units-group").hidden = !units.length;
  }

  function openForm(test, presetDate) {
    if (!loggedIn()) return showAuth("login", true);
    editing = test || null;
    $("tf-heading").textContent = test ? "Test ändern" : "Test hinzufügen";
    fillSubjects(test ? test.subject_id : null);
    $("tf-title").value = test ? test.title : "";
    $("tf-date").value = test ? test.test_date : presetDate || "";
    $("tf-note").value = test && test.note ? test.note : "";
    fillUnits($("tf-subject").value, test ? test.unit_ids : []);
    $("tf-error").textContent = "";
    $("tf-save").disabled = false;
    $("test-form").dataset.subject = $("tf-subject").value;
    $("test-form").showModal();
    $("tf-title").focus();
  }

  $("tf-subject").addEventListener("change", () => {
    fillUnits($("tf-subject").value, []);
    $("test-form").dataset.subject = $("tf-subject").value;
  });

  $("tf-cancel").addEventListener("click", () => $("test-form").close());

  $("tf").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = $("tf-title").value.trim();
    const date = $("tf-date").value;
    if (!title) return fail("Gib dem Test einen Namen, z. B. Wortschatztest.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("Wähle das Datum des Tests.");
    const payload = {
      subject_id: $("tf-subject").value,
      title: title,
      test_date: date,
      unit_ids: Array.from($("tf-units").querySelectorAll("input:checked")).map((i) => i.value),
      note: $("tf-note").value.trim() || null,
    };
    $("tf-save").disabled = true;
    const res = editing ? await Tests.update(editing.id, payload) : await Tests.add(payload);
    $("tf-save").disabled = false;
    if (!res.ok) return fail(res.error);
    $("test-form").close();
    const d = Tests.parse(date);
    view = { y: d.getFullYear(), m: d.getMonth() };
    selected = date;
    renderTests();
  });

  function fail(msg) {
    $("tf-error").textContent = msg;
  }

  $("btn-add-test").addEventListener("click", () => openForm(null, selected));

  /* ---------------- Hinweise "Nächster Test" ---------------- */

  function nextButton(t, text) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "next-test";
    b.dataset.subject = t.subject_id;
    b.textContent = text;
    b.addEventListener("click", () => openDetail(t.id));
    return b;
  }

  // Neben "Lernblatt" und auf jeder Fachseite.
  window.refreshTestHints = function refreshTestHints() {
    const note = $("masthead-note");
    if (note) {
      const t = Tests.next();
      note.classList.toggle("has-test", Boolean(t));
      note.textContent = "";
      if (t) {
        note.appendChild(nextButton(t, "Nächster Test: " + Tests.label(t) + " (" + Tests.countdown(t.test_date) + ")"));
      } else {
        note.textContent = "Welches Fach übst du heute?";
      }
    }
    const unitNext = $("unit-next");
    if (unitNext) {
      unitNext.innerHTML = "";
      const subject = current && current.subject;
      const t = subject ? Tests.next(subject.id) : null;
      if (t) {
        unitNext.appendChild(
          nextButton(t, "Nächster Test in " + subject.name + ": " + t.title + ", " + Tests.short(t.test_date) + " (" + Tests.countdown(t.test_date) + ")")
        );
      }
      unitNext.classList.toggle("hidden", !t);
    }
  };

  window.addEventListener("lb:tests", () => {
    refreshTestHints();
    const count = document.querySelector(".band-tests .band-count");
    if (count) count.textContent = Tests.countLabel();
    if (!$("screen-tests").classList.contains("hidden")) renderTests();
  });
})();
