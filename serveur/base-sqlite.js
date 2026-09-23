// Stockage du serveur VIGIE HSE dans une base SQLite (module node:sqlite, intégré à Node 22.5 et plus :
// rien à installer). C'est le SEUL fichier qui connaît la base : le passage à PostgreSQL (étape P1
// complète, Documentation/PLAN-MISE-EN-PRODUCTION.md) remplacera ce fichier, ni le serveur ni les pages.
//
// Contrat (les valeurs sont les chaînes JSON que les pages écrivent aujourd'hui dans le navigateur) :
//   lireTout()                         → { cle: { valeur, revision } } (valeur null : clé supprimée)
//   lire(cle)                          → la valeur seule (null si absente)
//   ecrire(cle, valeur, revisionVue)   → { ok:true, revision } ou, si quelqu'un a écrit entre-temps,
//                                        { ok:false, revision, valeur } (la version actuelle)
//   supprimer(cle, revisionVue)        → idem
//   effacerTout()                      → chemin de la copie de sauvegarde prise juste avant
// Comptes (étape P1b) — les mots de passe ne sont jamais dans les données, seulement leur empreinte ici :
//   empreinte(idCompte) / poserEmpreinte(idCompte, empreinte) / retirerEmpreintes(idsGardes)
//   ouvrirSession(empreinteJeton, idCompte, expire) / lireSession(empreinteJeton) / prolongerSession(…, expire)
//   fermerSession(empreinteJeton) / purgerSessions(maintenant)
// La révision d'une clé jamais écrite vaut 0 ; une clé supprimée reste en base, vide, et sa révision
// continue de croître — sans quoi une page restée ouverte sur une ancienne version pourrait écraser la
// suivante. Chaque écriture garde l'ancienne valeur dans « historique » (les HISTORIQUE dernières par
// clé) : une erreur de saisie reste rattrapable à la main.
'use strict';
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs'), path = require('path');
const HISTORIQUE = 20;

function ouvrir(fichier){
  fs.mkdirSync(path.dirname(fichier), { recursive: true });
  const db = new DatabaseSync(fichier);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS donnees (
      cle TEXT PRIMARY KEY, valeur TEXT, revision INTEGER NOT NULL, maj TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS historique (
      cle TEXT NOT NULL, valeur TEXT, revision INTEGER NOT NULL, maj TEXT NOT NULL, motif TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS historique_cle ON historique (cle, revision);
    CREATE TABLE IF NOT EXISTS empreintes (compte TEXT PRIMARY KEY, empreinte TEXT NOT NULL, maj TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (jeton TEXT PRIMARY KEY, compte TEXT NOT NULL, creee TEXT NOT NULL, expire INTEGER NOT NULL);`);

  const q = {
    tout:      db.prepare('SELECT cle, valeur, revision FROM donnees'),
    une:       db.prepare('SELECT valeur, revision FROM donnees WHERE cle = ?'),
    poser:     db.prepare('INSERT INTO donnees (cle, valeur, revision, maj) VALUES (?, ?, ?, ?) ' +
                          'ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur, revision = excluded.revision, maj = excluded.maj'),
    garder:    db.prepare('INSERT INTO historique (cle, valeur, revision, maj, motif) VALUES (?, ?, ?, ?, ?)'),
    elaguer:   db.prepare('DELETE FROM historique WHERE cle = ? AND rowid NOT IN ' +
                          '(SELECT rowid FROM historique WHERE cle = ? ORDER BY rowid DESC LIMIT ' + HISTORIQUE + ')'),
    compte:    db.prepare('SELECT COUNT(*) AS n FROM donnees WHERE valeur IS NOT NULL'),
    viderTout: db.prepare('UPDATE donnees SET valeur = NULL, revision = revision + 1, maj = ? WHERE valeur IS NOT NULL'),
    empreinte: db.prepare('SELECT empreinte FROM empreintes WHERE compte = ?'),
    poserEmpreinte: db.prepare('INSERT INTO empreintes (compte, empreinte, maj) VALUES (?, ?, ?) ON CONFLICT (compte) DO UPDATE SET empreinte = excluded.empreinte, maj = excluded.maj'),
    comptesEmpreintes: db.prepare('SELECT compte FROM empreintes'),
    retirerEmpreinte: db.prepare('DELETE FROM empreintes WHERE compte = ?'),
    ouvrirSession: db.prepare('INSERT INTO sessions (jeton, compte, creee, expire) VALUES (?, ?, ?, ?)'),
    lireSession: db.prepare('SELECT compte, expire FROM sessions WHERE jeton = ?'),
    prolongerSession: db.prepare('UPDATE sessions SET expire = ? WHERE jeton = ?'),
    fermerSession: db.prepare('DELETE FROM sessions WHERE jeton = ?'),
    fermerSessionsCompte: db.prepare('DELETE FROM sessions WHERE compte = ?'),
    purgerSessions: db.prepare('DELETE FROM sessions WHERE expire < ?'),
    purgerHistorique: db.prepare('DELETE FROM historique WHERE cle = ?'),
  };
  const maintenant = () => new Date().toISOString();

  // Node n'exécute qu'une requête à la fois et ces appels sont synchrones : lecture de la révision et
  // écriture ne peuvent pas être entrelacées avec une autre requête. La transaction garantit en plus
  // que donnée et historique sont écrits ensemble ou pas du tout (coupure de courant comprise).
  function transaction(f){
    db.exec('BEGIN IMMEDIATE');
    try { const r = f(); db.exec('COMMIT'); return r; }
    catch(e){ db.exec('ROLLBACK'); throw e; }
  }

  function changer(cle, valeur, revisionVue, motif){
    return transaction(() => {
      const actuelle = q.une.get(cle);
      const revision = actuelle ? actuelle.revision : 0;
      const ancienne = actuelle ? actuelle.valeur : null;
      if (revision !== revisionVue) return { ok: false, revision, valeur: ancienne };
      if (ancienne === valeur) return { ok: true, revision };
      const quand = maintenant();
      if (ancienne !== null){ q.garder.run(cle, ancienne, revision, quand, motif); q.elaguer.run(cle, cle); }
      q.poser.run(cle, valeur, revision + 1, quand);
      return { ok: true, revision: revision + 1 };
    });
  }

  return {
    fichier,
    lireTout(){
      const r = {};
      for (const l of q.tout.all()) r[l.cle] = { valeur: l.valeur, revision: l.revision };
      return r;
    },
    ecrire: (cle, valeur, revisionVue) => changer(cle, String(valeur), revisionVue, 'remplacée'),
    supprimer: (cle, revisionVue) => changer(cle, null, revisionVue, 'supprimée'),
    // « Réinitialiser les données » : une copie complète de la base est prise avant d'effacer
    effacerTout(){
      const copie = path.join(path.dirname(fichier), 'sauvegarde-avant-effacement-' + maintenant().replace(/[:.]/g, '-') + '.db');
      db.exec("VACUUM INTO '" + copie.replace(/'/g, "''") + "'");
      transaction(() => {
        const quand = maintenant();
        for (const l of q.tout.all()) if (l.valeur !== null) q.garder.run(l.cle, l.valeur, l.revision, quand, 'effacement général');
        q.viderTout.run(quand);
      });
      return copie;
    },
    nombre: () => q.compte.get().n,
    lire: cle => { const l = q.une.get(cle); return l && l.valeur !== null ? l.valeur : null; },
    // écriture interne du serveur (reprise d'une ancienne base), hors contrôle de révision
    remplacer(cle, valeur, motif){ const a = q.une.get(cle); return changer(cle, valeur, a ? a.revision : 0, motif || 'remplacée'); },
    oublierHistorique: cle => { q.purgerHistorique.run(cle); },
    empreinte: compte => { const l = q.empreinte.get(compte); return l ? l.empreinte : null; },
    poserEmpreinte: (compte, e) => { q.poserEmpreinte.run(compte, e, maintenant()); },
    // un compte supprimé perd son mot de passe et ses sessions
    retirerEmpreintes(idsGardes){
      const garder = new Set(idsGardes);
      for (const l of q.comptesEmpreintes.all()) if (!garder.has(l.compte)){ q.retirerEmpreinte.run(l.compte); q.fermerSessionsCompte.run(l.compte); }
    },
    ouvrirSession: (jeton, compte, expire) => { q.ouvrirSession.run(jeton, compte, maintenant(), expire); },
    lireSession: jeton => q.lireSession.get(jeton) || null,
    prolongerSession: (jeton, expire) => { q.prolongerSession.run(expire, jeton); },
    fermerSession: jeton => { q.fermerSession.run(jeton); },
    fermerSessionsCompte: compte => { q.fermerSessionsCompte.run(compte); },
    purgerSessions: t => { q.purgerSessions.run(t); },
    fermer: () => db.close(),
  };
}

module.exports = { ouvrir };
