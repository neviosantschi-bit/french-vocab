// Verbindung zur Datenbank (Supabase). Beide Werte sind oeffentlich gedacht:
// der "anon"/"publishable" Schluessel darf im Browser stehen, geschuetzt wird alles
// durch die Zugriffsregeln in supabase/schema.sql.
// NIE hier eintragen: Datenbank-Passwort oder "service_role" Schluessel.
//
// Leer lassen = die Seite laeuft wie vorher mit Konten nur im Browser, ohne Tests.

export const CONFIG = {
  url: "https://kocbiuptvrsukquvzpyd.supabase.co",
  anonKey: "sb_publishable_CQ9Ee4dFz7UykJOaHcpNZQ_62spsKMX",
};
