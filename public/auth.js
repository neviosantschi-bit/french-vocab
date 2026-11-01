"use strict";

// Konto nur auf diesem Geraet (localStorage). Kein Server.
// Das Passwort wird mit Salz gehasht, damit es nicht im Klartext liegt.
// Das ist Bequemlichkeit fuer Freunde, kein echter Schutz.

const Auth = (() => {
  const USERS = "lb-users";
  const SESSION = "lb-session";

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

  // Alle Funktionen geben { ok: true } oder { ok: false, error: "…" } zurueck.
  async function signUp(name, password) {
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

  async function logIn(name, password) {
    const k = key(name);
    if (!k || !password) return { ok: false, error: "Gib Benutzername und Passwort ein." };
    const user = read(USERS, {})[k];
    if (!user) return { ok: false, error: "Diesen Benutzer gibt es auf diesem Gerät nicht. Erstelle ein Konto." };
    if ((await hash(user.salt, password)) !== user.hash) return { ok: false, error: "Das Passwort stimmt nicht." };
    write(SESSION, k);
    return { ok: true };
  }

  function logOut() {
    try {
      localStorage.removeItem(SESSION);
    } catch (e) {
      /* egal */
    }
  }

  // { key, name } des angemeldeten Benutzers oder null.
  function current() {
    const k = read(SESSION, null);
    const user = k && read(USERS, {})[k];
    return user ? { key: k, name: user.name } : null;
  }

  return { signUp, logIn, logOut, current };
})();
