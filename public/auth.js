"use strict";

// Konten. Mit Datenbank (src/config.js ausgefuellt): gemeinsame Konten ueber window.Cloud.
// Ohne Datenbank: Konto nur auf diesem Geraet (localStorage), Passwort mit Salz gehasht
// (Bequemlichkeit fuer Freunde, kein echter Schutz).
//
// current() ist absichtlich synchron: die Datenbank-Sitzung liegt in localStorage ("lb-auth"),
// so muss beim Start der Seite niemand auf das Netz warten.

const Auth = (() => {
  const USERS = "lb-users";
  const SESSION = "lb-session";
  const CLOUD_SESSION = "lb-auth";
  const CLOUD_FLAG = "lb-cloud";

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  async function hash(salt, password) {
    const bytes = new TextEncoder().encode(salt + ":" + password);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  }

  const key = (name) => name.trim().toLowerCase();

  /* ---------------- Datenbank ---------------- */

  const cloudReady = () =>
    window.Cloud
      ? Promise.resolve(window.Cloud)
      : new Promise((resolve) => window.addEventListener("cloud:ready", () => resolve(window.Cloud), { once: true }));

  const cloudOn = () => Boolean(window.Cloud && window.Cloud.enabled);

  function cloudSession() {
    const s = read(CLOUD_SESSION, null);
    if (s && s.user && s.user.id) {
      return { key: s.user.id, name: (s.user.user_metadata && s.user.user_metadata.username) || "Konto", cloud: true };
    }
    return null;
  }

  // Nach dem Anmelden: alte Staende dieses Geraets uebernehmen und mit der Datenbank abgleichen.
  async function afterCloudLogin(name) {
    if (typeof Progress === "undefined") return;
    Progress.adoptLocal(name);
    await Progress.sync();
  }

  /* ---------------- Nur dieses Geraet ---------------- */

  async function localSignUp(name, password) {
    const k = key(name);
    if (!k) return { ok: false, error: "Gib einen Benutzernamen ein." };
    if (!password) return { ok: false, error: "Gib ein Passwort ein." };
    const users = read(USERS, {});
    if (users[k]) return { ok: false, error: "Diesen Namen gibt es schon. Melde dich an oder nimm einen anderen." };
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, "0")).join("");
    users[k] = { name: name.trim(), salt: salt, hash: await hash(salt, password) };
    if (!write(USERS, users) || !write(SESSION, k)) {
      return { ok: false, error: "Dein Browser lässt das Speichern nicht zu. Schalte den privaten Modus aus." };
    }
    return { ok: true };
  }

  async function localLogIn(name, password) {
    const k = key(name);
    if (!k || !password) return { ok: false, error: "Gib Benutzername und Passwort ein." };
    const user = read(USERS, {})[k];
    if (!user) return { ok: false, error: "Diesen Benutzer gibt es auf diesem Gerät nicht. Erstelle ein Konto." };
    if ((await hash(user.salt, password)) !== user.hash) return { ok: false, error: "Das Passwort stimmt nicht." };
    write(SESSION, k);
    return { ok: true };
  }

  function localCurrent() {
    const k = read(SESSION, null);
    const user = k && read(USERS, {})[k];
    return user ? { key: k, name: user.name } : null;
  }

  /* ---------------- Oeffentlich ---------------- */

  // Alle Funktionen geben { ok: true } oder { ok: false, error: "…" } zurueck.
  async function signUp(name, password) {
    const cloud = await cloudReady();
    if (!cloud.enabled) return localSignUp(name, password);
    const res = await cloud.signUp(name, password);
    if (res.ok) await afterCloudLogin(name);
    return res;
  }

  async function logIn(name, password) {
    const cloud = await cloudReady();
    if (!cloud.enabled) return localLogIn(name, password);
    const res = await cloud.signIn(name, password);
    if (res.ok) await afterCloudLogin(name);
    return res;
  }

  function logOut() {
    try {
      localStorage.removeItem(SESSION);
      localStorage.removeItem(CLOUD_SESSION);
    } catch (e) {
      /* egal */
    }
    if (window.Cloud && window.Cloud.enabled) window.Cloud.signOut().catch(() => {});
  }

  // { key, name, cloud? } des angemeldeten Benutzers oder null.
  function current() {
    const cloud = cloudSession();
    if (cloud) return cloud;
    // Sobald die Datenbank an ist, gelten alte Geraete-Konten nicht mehr.
    let cloudMode = false;
    try {
      cloudMode = localStorage.getItem(CLOUD_FLAG) === "1";
    } catch (e) {
      /* egal */
    }
    return cloudMode ? null : localCurrent();
  }

  return { signUp, logIn, logOut, current, cloudOn, cloudReady };
})();
