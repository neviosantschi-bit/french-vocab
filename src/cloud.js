// Verbindung zur Datenbank. Wird als Modul geladen und stellt window.Cloud bereit.
// Die uebrigen Skripte der Seite sind klassisch und warten bei Bedarf auf das Ereignis "cloud:ready".
//
// Konten sind Benutzername + Passwort. Supabase will eine E-Mail, also wird der Benutzername
// in eine erfundene Adresse verpackt (es wird nie eine Mail verschickt). Das Passwort bekommt
// einen festen Zusatz, damit auch ein Zeichen reicht (Supabase verlangt mindestens 6).

import { createClient } from "@supabase/supabase-js";
import { CONFIG } from "./config.js";

const enabled = Boolean(CONFIG.url && CONFIG.anonKey);
const client = enabled
  ? createClient(CONFIG.url, CONFIG.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "lb-auth" },
    })
  : null;

const hex = (s) => Array.from(new TextEncoder().encode(s), (b) => b.toString(16).padStart(2, "0")).join("");
const emailFor = (name) => "u" + hex(name.trim().toLowerCase()) + "@lernblatt.app";
const passFor = (pw) => pw + "~lernblatt";

const NAME_MAX = 24;

// Fehlermeldungen auf Deutsch, mit dem, was man tun kann.
function authError(err) {
  const m = (err && err.message ? err.message : "").toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Diesen Namen gibt es schon. Melde dich an oder nimm einen anderen.";
  }
  if (m.includes("invalid login")) return "Benutzername oder Passwort stimmt nicht.";
  if (m.includes("rate limit") || m.includes("too many")) return "Zu viele Versuche. Warte kurz und probiere es nochmal.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Keine Verbindung. Prüfe dein Internet und probiere es nochmal.";
  return "Das hat nicht geklappt. Probiere es nochmal.";
}

async function signUp(name, password) {
  const n = name.trim();
  if (!n) return { ok: false, error: "Gib einen Benutzernamen ein." };
  if (n.length > NAME_MAX) return { ok: false, error: "Der Benutzername darf höchstens " + NAME_MAX + " Zeichen haben." };
  if (!password) return { ok: false, error: "Gib ein Passwort ein." };
  const { data, error } = await client.auth.signUp({
    email: emailFor(n),
    password: passFor(password),
    options: { data: { username: n } },
  });
  if (error) return { ok: false, error: authError(error) };
  if (!data.session) {
    return { ok: false, error: "Die Datenbank verlangt noch eine E-Mail-Bestätigung. Schalte sie im Supabase-Projekt aus (Authentication, Email)." };
  }
  return { ok: true, user: data.user };
}

async function signIn(name, password) {
  const n = name.trim();
  if (!n || !password) return { ok: false, error: "Gib Benutzername und Passwort ein." };
  const { data, error } = await client.auth.signInWithPassword({ email: emailFor(n), password: passFor(password) });
  if (error) return { ok: false, error: authError(error) };
  return { ok: true, user: data.user };
}

async function signOut() {
  await client.auth.signOut();
}

/* ---------------- Tests ---------------- */

const testCols = "id, subject_id, title, test_date, unit_ids, note, created_by, created_at, profiles(username)";

const tests = {
  async list() {
    const { data, error } = await client.from("tests").select(testCols).order("test_date", { ascending: true }).order("created_at", { ascending: true });
    if (error) throw error;
    return data.map((t) => ({ ...t, author: t.profiles ? t.profiles.username : null }));
  },
  async add(t) {
    const { error } = await client.from("tests").insert(t);
    if (error) throw error;
  },
  async update(id, t) {
    const { error } = await client.from("tests").update(t).eq("id", id);
    if (error) throw error;
  },
  async remove(id) {
    const { error } = await client.from("tests").delete().eq("id", id);
    if (error) throw error;
  },
};

/* ---------------- Lernstand ---------------- */

const progress = {
  async pull() {
    const { data, error } = await client.from("progress").select("data").maybeSingle();
    if (error) throw error;
    return data ? data.data : null;
  },
  async push(userId, doc) {
    const { error } = await client.from("progress").upsert({ user_id: userId, data: doc, updated_at: new Date().toISOString() });
    if (error) throw error;
  },
};

// Merkt sich fuer die klassischen Skripte, dass Konten ab jetzt aus der Datenbank kommen.
try {
  if (enabled) localStorage.setItem("lb-cloud", "1");
} catch (e) {
  /* Privatmodus o.ae. - egal */
}

window.Cloud = { enabled, NAME_MAX, emailFor, signUp, signIn, signOut, tests, progress };
window.dispatchEvent(new Event("cloud:ready"));
