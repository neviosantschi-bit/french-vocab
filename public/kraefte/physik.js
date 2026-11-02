"use strict";

// Kräfte-Spiel: die Physik. Nur Rechnen, nichts Sichtbares (wird auch in Node getestet).
//
// Einheiten: Masse in kg, Kraft in N, Länge in m (wo nicht anders steht), Winkel in Grad.

const Phys = (() => {
  // Ortsfaktor g in N/kg
  const PLANETEN = [
    { id: "erde", name: "Erde", g: 9.81 },
    { id: "mond", name: "Mond", g: 1.62 },
    { id: "mars", name: "Mars", g: 3.71 },
  ];
  const planet = (id) => PLANETEN.find((p) => p.id === id);

  // Gewichtskraft F_G = m · g
  const gewichtskraft = (m, g) => m * g;
  const masse = (F, g) => F / g;

  // Federkraftmesser: Dehnung proportional zur Kraft (Hooke), solange die Feder elastisch bleibt.
  // D = Federhärte in N/cm
  const dehnung = (F, D) => F / D;

  // Reibung: F_R = μ · F_N. Auf waagrechtem Boden ist F_N = F_G.
  const REIBUNG = {
    boden: { name: "Holzboden", haft: 0.5, gleit: 0.4 },
    rollen: { name: "Rollen", roll: 0.02 },
  };

  // Eine Kiste (Masse m), die mit der Kraft F geschoben wird.
  // zustand: { v } Geschwindigkeit in m/s. Gibt neuen Zustand und die Reibungskraft zurück.
  function kiste(zustand, F, m, art, dt, g) {
    const FN = m * (g || 9.81);
    const k = REIBUNG[art];
    let v = zustand.v;
    if (art === "rollen") {
      const FR = k.roll * FN;
      const a = (F - FR) / m;
      // Rollreibung wirkt immer, aber ohne Haftschwelle: schon eine kleine Kraft bewegt die Kiste.
      v = Math.max(0, v + a * dt);
      if (v === 0 && F <= FR) return { v: 0, reibung: Math.min(F, FR), art: "Rollreibung" };
      return { v: v, reibung: FR, art: "Rollreibung" };
    }
    const FH = k.haft * FN;
    const FG = k.gleit * FN;
    if (v === 0) {
      // Ruhe: Haftreibung hält dagegen, bis die Kraft ihr Maximum überschreitet.
      if (F <= FH) return { v: 0, reibung: F, art: "Haftreibung" };
      v = Math.max(0, ((F - FG) / m) * dt);
      return { v: v, reibung: FG, art: "Gleitreibung" };
    }
    v = Math.max(0, v + ((F - FG) / m) * dt);
    if (v === 0) return { v: 0, reibung: Math.min(F, FH), art: "Haftreibung" };
    return { v: v, reibung: FG, art: "Gleitreibung" };
  }

  // Kräfte addieren: Vektoren [x, y]
  const summe = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const betrag = (v) => Math.hypot(v[0], v[1]);

  // Hebelgesetz: F1 · a1 = F2 · a2
  const hebelF2 = (F1, a1, a2) => (F1 * a1) / a2;
  const hebelMoment = (F, a) => F * a;
  // Waagebalken: positiver Wert = linke Seite sinkt
  const hebelDrehmoment = (links, rechts) => {
    const sum = (l) => l.reduce((s, x) => s + x.F * x.a, 0);
    return sum(links) - sum(rechts);
  };

  // Flaschenzug (ohne Reibung, ohne Gewicht der Rollen): n tragende Seilstücke
  const flaschenzugKraft = (Flast, n) => Flast / n;
  const flaschenzugWeg = (h, n) => h * n;

  // Schiefe Ebene (ohne Reibung): Kraft entlang der Rampe F = F_G · h / l = F_G · sin α
  const schiefeEbeneKraft = (FG, h, l) => (FG * h) / l;
  const rampeWinkel = (h, l) => (Math.asin(h / l) * 180) / Math.PI;
  const rampeLaenge = (h, alphaGrad) => h / Math.sin((alphaGrad * Math.PI) / 180);

  // Gleichgewicht am Hang (Auto parkt): F_N = F_G cos α, F_Haft = F_G sin α
  const hangKraefte = (FG, alphaGrad) => {
    const a = (alphaGrad * Math.PI) / 180;
    return { normal: FG * Math.cos(a), haft: FG * Math.sin(a) };
  };

  return {
    PLANETEN, planet, gewichtskraft, masse, dehnung, REIBUNG, kiste, summe, betrag,
    hebelF2, hebelMoment, hebelDrehmoment, flaschenzugKraft, flaschenzugWeg,
    schiefeEbeneKraft, rampeWinkel, rampeLaenge, hangKraefte,
  };
})();

if (typeof module !== "undefined") module.exports = Phys;
