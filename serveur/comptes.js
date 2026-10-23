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
const VigieDroits = require('../assets/droits.js');   // profils et catalogue des modules : le même fichier que les pages

const CLE_COMPTES = 'vigie_hse_users';
const CLE_PROFILS = 'vigie_hse_profils';
const DUREE_SESSION = 8 * 3600 * 1000;       // sans activité pendant 8 h, il faut se reconnecter
// 5 échecs de suite sur un identifiant depuis une adresse : 5 min de pause pour cette adresse seule (un tiers ne peut
// plus bloquer un compte qu'il connaît en se trompant exprès) ; une adresse du réseau : 30 échecs au plus en 15 min,
// tous identifiants confondus (essais en série sur beaucoup de comptes)
const ESSAIS_MAX = 5, PAUSE = 5 * 60 * 1000;
const ESSAIS_ADRESSE = 30, FENETRE = 15 * 60 * 1000;
// le calcul d'une empreinte est volontairement coûteux : à la connexion, il tourne hors de la boucle du serveur
// (crypto.scrypt), deux à la fois au plus — les autres attendent leur tour, au-delà de 50 en attente : « occupé »
const CALCULS_MAX = 2, ATTENTE_MAX = 50;
const SCRYPT = { N: 16384, r: 8, p: 1 };
const MDP_MIN = 12;   // longueur minimale d'un mot de passe choisi (création, changement) — même seuil dans login.html et administration.html
// les comptes de démonstration (mots de passe publiés dans le dépôt)
const DEMO = [['admin@verchamps.fr', 'admin1234'], ['manager@verchamps.fr', 'manager1234'], ['RH1', '1234'], ['RH2', '1234'], ['AG1', '1234'], ['AG2', '1234'], ['PREV1', '1234']];
const estDemo = u => DEMO.some(([id, mdp]) => u.password === mdp && [u.username, u.email].some(x => String(x || '').toLowerCase() === id.toLowerCase()));

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
// la même vérification, sans bloquer le serveur pendant le calcul
function verifierAsync(motDePasse, empreinte){
  const [algo, N, r, p, sel, h] = String(empreinte || '').split('$');
  if (algo !== 'scrypt' || !sel || !h) return Promise.resolve(false);
  const attendu = Buffer.from(h, 'base64');
  return new Promise(ok => crypto.scrypt(String(motDePasse), Buffer.from(sel, 'base64'), attendu.length, { N: +N, r: +r, p: +p },
    (err, calcule) => ok(!err && crypto.timingSafeEqual(calcule, attendu))));
}
const BOUCLE = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];   // ce poste : tous ses utilisateurs ont la même adresse
const EMPREINTE_LEURRE = hacher(crypto.randomBytes(12).toString('hex'));   // même durée de calcul pour un identifiant inconnu
const empreinteJeton = jeton => crypto.createHash('sha256').update(String(jeton)).digest('hex');

// la session telle que les pages la lisent dans sessionStorage (login.html) : les droits du compte sont résolus ici,
// à partir de ses profils (assets/droits.js) — « role » et « modulePermissions » ne servent plus qu'aux comptes qui n'ont pas
// encore de profils (ancien format, converti à la prochaine ouverture d'Administration)
function sessionDePage(u, profils){
  const r = VigieDroits.resoudre(u, profils);
  return { user: u.username || u.email, role: u.role || VigieDroits.roleDepuis(r.droits), email: u.email, services: u.services || ['*'],
    modulePermissions: u.modulePermissions || {}, anonymise: u.anonymise === true,
    profils: r.profils, droits: r.droits, compte: { libelle: r.libelle, pastille: r.pastille } };
}

// options.demo : serveur de démonstration (VIGIE_DEMO) — les comptes de démonstration y gardent leur mot de passe court
function creer(base, options = {}){
  const echecs = new Map();      // « adresse|identifiant » → { n, jusqua }
  const parAdresse = new Map();  // adresse du réseau → { debut, n }
  let calculs = 0; const file = [];
  // f() en limitant les calculs simultanés ; null si la file d'attente est pleine
  function calculer(f){
    const lancer = () => f().finally(() => { const suivant = file.shift(); if (suivant) suivant(); else calculs--; });
    if (calculs < CALCULS_MAX){ calculs++; return lancer(); }
    if (file.length >= ATTENTE_MAX) return Promise.resolve(null);
    return new Promise(ok => file.push(ok)).then(lancer);
  }

  function comptes(){
    try { const l = JSON.parse(base.lire(CLE_COMPTES) || '[]'); return Array.isArray(l) ? l : []; }
    catch(e){ return []; }
  }
  // les profils enregistrés (vigie_hse_profils) ; VigieDroits.fusionnerProfils y ajoute les préréglages
  function profils(){
    try { const l = JSON.parse(base.lire(CLE_PROFILS) || '[]'); return Array.isArray(l) ? l : []; }
    catch(e){ return []; }
  }

  // Garde anti-verrouillage : une écriture des comptes ou des profils ne doit pas laisser l'application sans compte
  // actif, non anonymisé, qui puisse administrer (sauf si elle n'en avait déjà aucun : on ne bloque pas une réparation).
  function gardeAdmin(cle, valeur){
    if (cle !== CLE_COMPTES && cle !== CLE_PROFILS) return true;
    const avant = VigieDroits.administrateurs(comptes(), profils());
    let apres;
    if (cle === CLE_COMPTES){
      if (valeur === null) return avant === 0;
      let l; try { l = JSON.parse(valeur); } catch(e){ return true; }
      if (!Array.isArray(l)) return true;
      apres = VigieDroits.administrateurs(l, profils());
    } else {
      let l = []; if (valeur !== null){ try { l = JSON.parse(valeur); } catch(e){ return true; } }
      apres = VigieDroits.administrateurs(comptes(), Array.isArray(l) ? l : []);
    }
    return apres > 0 || avant === 0;
  }

  // Liste de comptes écrite par une page → { valeur à stocker (sans mot de passe), mots : [[id, mdp, compte de démonstration]] }.
  // Rien n'est rangé ici : l'empreinte ne l'est qu'une fois l'écriture acceptée (voir apresEcriture).
  function epurer(valeur){
    let l;
    try { l = JSON.parse(valeur); } catch(e){ return { valeur, mots: [] }; }
    if (!Array.isArray(l)) return { valeur, mots: [] };
    const mots = [];
    for (const u of l){
      if (!u || typeof u !== 'object') continue;
      if (typeof u.password === 'string' && u.password !== '' && u.id != null) mots.push([String(u.id), u.password, estDemo(u)]);
      delete u.password;
    }
    return { valeur: JSON.stringify(l), mots };
  }
  // Les mots de passe que l'écriture pose vraiment : compte nouveau, ou autre mot de passe que le sien (la page
  // Administration renvoie la liste avec ceux qu'elle a posés plus tôt : ceux-là ne changent rien).
  const nouveaux = mots => mots.filter(([id, mdp]) => { const e = base.empreinte(id); return !e || !verifier(mdp, e); });
  // identifiants des comptes dont le mot de passe a moins de MDP_MIN caractères ; un serveur de démonstration accepte
  // ceux des comptes de démonstration, que son premier lancement inscrit
  const tropCourts = mots => mots.filter(([, mdp, demo]) => mdp.length < MDP_MIN && !(demo && options.demo)).map(([id]) => id);
  // Écriture acceptée : l'empreinte de chaque mot de passe. Un mot de passe changé ferme les autres sessions du compte
  // (qui connaissait l'ancien n'y est plus), mais pas celle qui fait le changement (jetonAuteur).
  function apresEcriture(mots, jetonAuteur){
    for (const [id, mdp] of mots){
      const avant = base.empreinte(id);
      base.poserEmpreinte(id, hacher(mdp));
      if (avant) base.fermerSessionsCompte(id, jetonAuteur ? empreinteJeton(jetonAuteur) : null);
    }
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

  // une pause en cours pour cette adresse et cet identifiant, ou pour cette adresse : la fin de l'attente, sinon 0
  function enPause(paire, adresse, maintenant){
    const e = echecs.get(paire), a = BOUCLE.includes(adresse) ? null : parAdresse.get(adresse);
    if (e && e.jusqua > maintenant) return e.jusqua;
    if (a && maintenant - a.debut < FENETRE && a.n >= ESSAIS_ADRESSE) return a.debut + FENETRE;
    return 0;
  }
  // adresse : celle de la requête (req.socket.remoteAddress)
  async function connecter(identifiant, motDePasse, adresse){
    const cle = String(identifiant || '').trim().toLowerCase(), ad = String(adresse || ''), paire = ad + '|' + cle;
    const attente = fin => ({ ok: false, erreur: 'attente', secondes: Math.ceil((fin - Date.now()) / 1000) });
    let fin = enPause(paire, ad, Date.now());
    if (fin) return attente(fin);
    const u = trouver(cle);
    const empreinte = u && u.id != null ? base.empreinte(String(u.id)) : null;
    const v = await calculer(() => verifierAsync(motDePasse, empreinte || EMPREINTE_LEURRE));
    if (v === null) return { ok: false, erreur: 'occupe' };
    // des essais lancés ensemble : ceux qui finissent après la pause n'apprennent rien, même le bon
    const maintenant = Date.now();
    fin = enPause(paire, ad, maintenant);
    if (fin) return attente(fin);
    if (!(v && !!empreinte)){
      const e = echecs.get(paire), n = (e && !e.jusqua ? e.n : 0) + 1;   // une pause écoulée repart de zéro
      if (echecs.size > 10000) echecs.clear();      // des identifiants inventés en masse ne remplissent pas la mémoire
      echecs.set(paire, n >= ESSAIS_MAX ? { n: 0, jusqua: maintenant + PAUSE } : { n, jusqua: 0 });
      if (!BOUCLE.includes(ad)){
        if (parAdresse.size > 10000) parAdresse.clear();
        const a = parAdresse.get(ad);
        parAdresse.set(ad, a && maintenant - a.debut < FENETRE ? { debut: a.debut, n: a.n + 1 } : { debut: maintenant, n: 1 });
      }
      return { ok: false, erreur: 'invalide' };
    }
    echecs.delete(paire);
    if (u.active === false) return { ok: false, erreur: 'desactive' };   // dit seulement à qui a le bon mot de passe
    const jeton = crypto.randomBytes(32).toString('base64url');
    base.purgerSessions(maintenant);
    base.ouvrirSession(empreinteJeton(jeton), String(u.id), maintenant + DUREE_SESSION);
    return { ok: true, jeton, session: sessionDePage(u, profils()) };
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
    return { compte: u, page: sessionDePage(u, profils()) };
  }

  function deconnecter(jeton){ if (jeton) base.fermerSession(empreinteJeton(jeton)); }

  // les comptes de démonstration encore actifs avec leur mot de passe publié
  function demoActifs(){
    return DEMO.filter(([id, mdp]) => {
      const u = trouver(id);
      const e = u && u.active !== false && base.empreinte(String(u.id));
      return !!e && verifier(mdp, e);
    }).map(([id]) => id);
  }
  const demoActive = () => demoActifs().length > 0;

  return { CLE_COMPTES, CLE_PROFILS, MDP_MIN, gardeAdmin, aucun: () => comptes().length === 0, epurer, nouveaux, tropCourts, apresEcriture, reprendreAncienneBase, connecter, session, deconnecter, demoActive, demoActifs };
}

module.exports = { creer, hacher, verifier, verifierAsync, ESSAIS_MAX, ESSAIS_ADRESSE };
