// Comptes et sessions du serveur VIGIE HSE (étape P1b, Documentation/PLAN-MISE-EN-PRODUCTION.md §4 ter).
//
// Les comptes restent la liste « vigie_hse_users » que gère la page Administration — mêmes champs,
// mêmes écrans. Une seule différence : le mot de passe n'y est jamais conservé. Quand une page
// enregistre la liste avec un mot de passe (création, réinitialisation), le serveur en range
// l'empreinte (scrypt, salée) dans sa propre table et le retire de la liste avant de l'enregistrer.
// Ni la liste stockée, ni l'historique, ni ce que reçoivent les pages ne contiennent de mot de passe.
//
// Connexion : identifiant (nom d'utilisateur ou e-mail) + mot de passe vérifiés ici ; le navigateur
// reçoit un cookie de session illisible par les pages (HttpOnly), et la base n'en garde que
// l'empreinte : une copie volée de la base ne permet pas d'ouvrir une session.
'use strict';
const crypto = require('crypto');

const CLE_COMPTES = 'vigie_hse_users';
const DUREE_SESSION = 8 * 3600 * 1000;       // sans activité pendant 8 h, il faut se reconnecter
const ESSAIS_MAX = 5, PAUSE = 5 * 60 * 1000; // 5 échecs de suite sur un identifiant : 5 min de pause
const SCRYPT = { N: 16384, r: 8, p: 1 };

function hacher(motDePasse){
  const sel = crypto.randomBytes(16);
  const h = crypto.scryptSync(String(motDePasse), sel, 64, SCRYPT);
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, sel.toString('base64'), h.toString('base64')].join('$');
}
function verifier(motDePasse, empreinte){
  const [algo, N, r, p, sel, h] = String(empreinte || '').split('$');
  if (algo !== 'scrypt' || !sel || !h) return false;
  const attendu = Buffer.from(h, 'base64');
  const calcule = crypto.scryptSync(String(motDePasse), Buffer.from(sel, 'base64'), attendu.length, { N: +N, r: +r, p: +p });
  return crypto.timingSafeEqual(calcule, attendu);
}
const EMPREINTE_LEURRE = hacher(crypto.randomBytes(12).toString('hex'));   // même durée de calcul pour un identifiant inconnu
const empreinteJeton = jeton => crypto.createHash('sha256').update(String(jeton)).digest('hex');

// la session telle que les pages la lisent aujourd'hui dans sessionStorage (login.html)
function sessionDePage(u){
  return { user: u.username || u.email, role: u.role, email: u.email, services: u.services || ['*'], modulePermissions: u.modulePermissions || {} };
}

function creer(base){
  const echecs = new Map();   // identifiant → { n, jusqua }

  function comptes(){
    try { const l = JSON.parse(base.lire(CLE_COMPTES) || '[]'); return Array.isArray(l) ? l : []; }
    catch(e){ return []; }
  }

  // Liste de comptes écrite par une page → { valeur à stocker (sans mot de passe), mots : [[id, mdp]] }.
  // Rien n'est rangé ici : l'empreinte ne l'est qu'une fois l'écriture acceptée (voir apresEcriture).
  function epurer(valeur){
    let l;
    try { l = JSON.parse(valeur); } catch(e){ return { valeur, mots: [] }; }
    if (!Array.isArray(l)) return { valeur, mots: [] };
    const mots = [];
    for (const u of l){
      if (!u || typeof u !== 'object') continue;
      if (typeof u.password === 'string' && u.password !== '' && u.id != null) mots.push([String(u.id), u.password]);
      delete u.password;
    }
    return { valeur: JSON.stringify(l), mots };
  }
  function apresEcriture(mots){
    for (const [id, mdp] of mots) base.poserEmpreinte(id, hacher(mdp));
    base.retirerEmpreintes(comptes().filter(u => u && u.id != null).map(u => String(u.id)));
  }

  // Base écrite avant P1b : mots de passe en clair dans la liste et dans son historique.
  function reprendreAncienneBase(){
    const brut = base.lire(CLE_COMPTES);
    if (!brut || brut.indexOf('"password"') < 0) return 0;
    const { valeur, mots } = epurer(brut);
    base.remplacer(CLE_COMPTES, valeur, 'mots de passe retirés (P1b)');
    base.oublierHistorique(CLE_COMPTES);
    apresEcriture(mots);
    return mots.length;
  }

  function trouver(identifiant){
    const id = String(identifiant || '').trim().toLowerCase();
    return comptes().find(u => u && (String(u.username || '').toLowerCase() === id || String(u.email || '').toLowerCase() === id)) || null;
  }

  function connecter(identifiant, motDePasse){
    const cle = String(identifiant || '').trim().toLowerCase();
    const maintenant = Date.now(), e = echecs.get(cle);
    if (e && e.jusqua > maintenant) return { ok: false, erreur: 'attente', secondes: Math.ceil((e.jusqua - maintenant) / 1000) };
    const u = trouver(cle);
    const empreinte = u && u.id != null ? base.empreinte(String(u.id)) : null;
    const bon = verifier(motDePasse, empreinte || EMPREINTE_LEURRE) && !!empreinte;
    if (!bon){
      const n = (e && !e.jusqua ? e.n : 0) + 1;   // une pause écoulée repart de zéro
      if (echecs.size > 10000) echecs.clear();      // des identifiants inventés en masse ne remplissent pas la mémoire
      echecs.set(cle, n >= ESSAIS_MAX ? { n: 0, jusqua: maintenant + PAUSE } : { n, jusqua: 0 });
      return { ok: false, erreur: 'invalide' };
    }
    echecs.delete(cle);
    if (u.active === false) return { ok: false, erreur: 'desactive' };   // dit seulement à qui a le bon mot de passe
    const jeton = crypto.randomBytes(32).toString('base64url');
    base.purgerSessions(maintenant);
    base.ouvrirSession(empreinteJeton(jeton), String(u.id), maintenant + DUREE_SESSION);
    return { ok: true, jeton, session: sessionDePage(u) };
  }

  // session valide du jeton (prolongée à chaque usage), ou null
  function session(jeton){
    if (!jeton) return null;
    const e = empreinteJeton(jeton), l = base.lireSession(e), maintenant = Date.now();
    if (!l) return null;
    if (l.expire < maintenant){ base.fermerSession(e); return null; }
    const u = comptes().find(x => x && String(x.id) === l.compte);
    if (!u || u.active === false){ base.fermerSession(e); return null; }   // compte supprimé ou désactivé entre-temps
    if (l.expire - maintenant < DUREE_SESSION - 60000) base.prolongerSession(e, maintenant + DUREE_SESSION);
    return { compte: u, page: sessionDePage(u) };
  }

  function deconnecter(jeton){ if (jeton) base.fermerSession(empreinteJeton(jeton)); }

  // les comptes de démonstration (mots de passe publiés dans le dépôt) sont-ils encore actifs ?
  function demoActive(){
    const u = trouver('admin@verchamps.fr');
    const e = u && base.empreinte(String(u.id));
    return !!e && verifier('admin1234', e);
  }

  return { CLE_COMPTES, aucun: () => comptes().length === 0, epurer, apresEcriture, reprendreAncienneBase, connecter, session, deconnecter, demoActive };
}

module.exports = { creer, hacher, verifier };
