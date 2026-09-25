// Serveur VIGIE HSE — étapes P1a et P1b (Documentation/PLAN-MISE-EN-PRODUCTION.md §4 bis et §4 ter) :
// les données vivent dans une base partagée au lieu de chaque navigateur, et l'on s'y connecte.
// Les pages sont les mêmes que sur le site en ligne : en les servant, le serveur glisse avant
// assets/stockage.js l'état de la base et la session (window.__VIGIE_SERVEUR__), et VigieStore bascule
// tout seul — lecture dans cet état, écriture par l'API. Ouverte sans ce serveur (fichier local,
// GitHub Pages), une page garde son stockage navigateur habituel.
//
// Lancement, depuis la racine du dépôt (Node 22.5 ou plus récent, rien à installer) :
//   node serveur/serveur.js            → http://localhost:8780
// Variables : PORT (8780 par défaut), VIGIE_BASE (fichier de la base, serveur/donnees/vigie.db par défaut).
// Ouverture au réseau (P1c, Documentation/PLAN-MISE-EN-PRODUCTION.md §4 quater) :
//   VIGIE_CERT, VIGIE_CLE     certificat et clé (fichiers PEM) : le serveur parle HTTPS lui-même ;
//   VIGIE_HTTPS=1             ou bien : derrière un proxy HTTPS qui lui transmet les requêtes ;
//   VIGIE_ECOUTE              adresse d'écoute (127.0.0.1 par défaut : ce poste seul ; 0.0.0.0 : le réseau) ;
//   VIGIE_HOTES               noms sous lesquels on l'appelle, séparés par des virgules (vigie.mairie.local).
// Le serveur refuse de s'ouvrir au réseau sans HTTPS, sans compte, ou avec un compte de démonstration
// encore sur son mot de passe publié.
// Sauvegardes (serveur/sauvegardes.js) : VIGIE_SAUVEGARDES (dossier, serveur/donnees/sauvegardes par défaut),
// VIGIE_SAUVEGARDE_HEURES (24 ; 0 les désactive), VIGIE_SAUVEGARDES_GARDER (14).
//
// P1b : connexion vérifiée ici (serveur/comptes.js — mots de passe hachés, jamais conservés en clair),
// aucune page de l'application ni aucune donnée sans session, droits d'écriture appliqués par le serveur
// (serveur/droits.js).
// P1c : lectures filtrées au périmètre d'un compte limité à certains services (serveur/perimetre.js).
// Par défaut, le serveur n'écoute que ce poste (127.0.0.1) ; voir plus haut pour l'ouvrir au réseau.
'use strict';
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path');
const { ouvrir } = require('./base-sqlite.js');
const Comptes = require('./comptes.js');
const Anonymisation = require('./anonymisation.js');
const Perimetre = require('./perimetre.js');
const Sauvegardes = require('./sauvegardes.js');

const RACINE = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 8780;
const BASE = process.env.VIGIE_BASE || path.join(__dirname, 'donnees', 'vigie.db');
const CERT = process.env.VIGIE_CERT, CLE_TLS = process.env.VIGIE_CLE;
const HTTPS_NATIF = !!(CERT && CLE_TLS);
const HTTPS = HTTPS_NATIF || process.env.VIGIE_HTTPS === '1';
const ECOUTE = process.env.VIGIE_ECOUTE || '127.0.0.1';
const NOMS = String(process.env.VIGIE_HOTES || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
const BOUCLE = ['127.0.0.1', '::1', 'localhost'];
// joignable depuis un autre poste : adresse d'écoute du réseau, proxy devant le serveur, ou nom de réseau
const RESEAU = !BOUCLE.includes(ECOUTE) || process.env.VIGIE_HTTPS === '1' || NOMS.length > 0;
const TAILLE_MAX = 50 * 1024 * 1024;          // une clé = un registre entier ; l'historique complet d'un client tient large
const CLE_VALIDE = /^vigie_hse_[a-z0-9_]{1,80}$/;
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.ico':'image/x-icon',
  '.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.md':'text/plain; charset=utf-8' };
// Noms sous lesquels le serveur accepte d'être appelé : refuser les autres bloque qu'un site piégé,
// ouvert dans le navigateur de ce poste, fasse passer son propre nom de domaine pour celui-ci.
const HOTES_LOCAUX = new Set(['localhost:' + PORT, '127.0.0.1:' + PORT, '[::1]:' + PORT]);
// un nom de réseau est accepté avec ou sans port (derrière un proxy, le port est celui du proxy)
const HOTES = new Set([...HOTES_LOCAUX, ...NOMS, ...NOMS.map(n => n + ':' + PORT)]);
// pages accessibles sans être connecté : la vitrine et l'écran de connexion
const PUBLIQUES = new Set(['/index.html', '/login.html']);
const COOKIE = 'vigie_session';

const base = ouvrir(BASE);
const comptes = Comptes.creer(base);
const journal = (...m) => console.log(new Date().toLocaleString('fr-FR') + ' ' + m.join(' '));
const droits = require('./droits.js');   // droits d'écriture par registre, appliqués ici

function repondre(res, statut, corps, type, entetes){
  res.writeHead(statut, Object.assign({ 'Content-Type': type || 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    HTTPS ? { 'Strict-Transport-Security': 'max-age=31536000' } : {}, entetes || {}));
  res.end(type ? corps : JSON.stringify(corps));
}
const texte = (res, statut, t, entetes) => repondre(res, statut, t, 'text/plain; charset=utf-8', entetes);

function jetonDe(req){
  const c = String(req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(COOKIE + '='));
  if (!c) return null;
  try { return decodeURIComponent(c.slice(COOKIE.length + 1)); } catch(e){ return null; }
}
const poserCookie = jeton => COOKIE + '=' + encodeURIComponent(jeton) + '; HttpOnly; SameSite=Strict; Path=/' + (HTTPS ? '; Secure' : '');
const effacerCookie = COOKIE + '=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' + (HTTPS ? '; Secure' : '');
// depuis ce poste : adresse de boucle ET nom local (derrière un proxy du même poste, l'adresse seule ne suffit pas)
const depuisCePoste = req => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress) && HOTES_LOCAUX.has(String(req.headers.host));

// État glissé dans chaque page. Sans session : aucune donnée. « < » est encodé : une valeur contenant
// « </script> » ne peut pas refermer la balise ; U+2028/2029 le sont aussi (fins de ligne pour les
// anciens moteurs JavaScript).
// Ce que ce compte peut recevoir : rien de santé s'il est anonymisé, rien hors de ses services s'il y est limité.
function donneesPour(page){
  let d = base.lireTout();
  if (Anonymisation.estAnonyme(page)) d = Anonymisation.filtrer(d);
  if (Perimetre.limite(page)) d = Perimetre.filtrer(d, page.services);
  return d;
}
function valeurPour(page, cle, valeur){
  if (Anonymisation.estAnonyme(page)) valeur = Anonymisation.vue(cle, valeur);
  return Perimetre.limite(page) ? Perimetre.vue(valeur, page.services) : valeur;
}

function injection(session){
  const etat = { api: '/api/', donnees: {}, session: session ? session.page : null };
  if (session){
    for (const [cle, d] of Object.entries(donneesPour(session.page))) etat.donnees[cle] = { v: d.valeur, r: d.revision };
    etat.droits = droits.resume(session.page);
  }
  else etat.premierLancement = comptes.aucun();
  const json = JSON.stringify(etat).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return '<script>window.__VIGIE_SERVEUR__ = ' + json + ';</script>\n';
}

// Journal d'audit : le nom inscrit dans une ligne nouvelle est celui de la session, pas celui qu'envoie la
// page (un appel direct à l'API pourrait sinon en inventer un). Les lignes existantes ne changent pas.
const CLE_AUDIT = 'vigie_hse_audit_log';
function signerJournal(avant, valeur, utilisateur){
  let l, connus;
  try { l = JSON.parse(valeur); connus = new Set((JSON.parse(avant || '[]') || []).map(r => r && String(r.id))); } catch(e){ return valeur; }
  if (!Array.isArray(l)) return valeur;
  let change = false;
  for (const r of l) if (r && typeof r === 'object' && !connus.has(String(r.id)) && r.utilisateur !== utilisateur){ r.utilisateur = utilisateur; change = true; }
  return change ? JSON.stringify(l) : valeur;
}

function lireCorps(req){
  return new Promise((ok, echec) => {
    const morceaux = []; let taille = 0;
    req.on('data', m => { taille += m.length; if (taille > TAILLE_MAX){ echec(Object.assign(new Error('trop gros'), { statut: 413 })); req.destroy(); } else morceaux.push(m); });
    req.on('end', () => ok(Buffer.concat(morceaux).toString('utf8')));
    req.on('error', echec);
  });
}

async function api(req, res, chemin){
  // Toute écriture porte l'en-tête X-Vigie : un autre site ne peut pas l'ajouter à une requête vers
  // ce serveur sans son accord (contrôle CORS du navigateur, que ce serveur ne donne jamais).
  if (req.method !== 'GET' && req.headers['x-vigie'] !== '1') return repondre(res, 403, { erreur: 'en-tête X-Vigie manquant' });

  if (chemin === '/api/connexion' && req.method === 'POST'){
    let d = {}; try { d = JSON.parse(await lireCorps(req)) || {}; } catch(e){}
    const r = comptes.connecter(d.identifiant, d.motDePasse);
    if (!r.ok){
      journal('connexion refusée :', String(d.identifiant || '').slice(0, 60), '(' + r.erreur + ')');
      return repondre(res, r.erreur === 'attente' ? 429 : 401, { ok: false, erreur: r.erreur, secondes: r.secondes });
    }
    journal('connexion :', r.session.user);
    return repondre(res, 200, { ok: true, session: r.session }, null, { 'Set-Cookie': poserCookie(r.jeton) });
  }
  if (chemin === '/api/deconnexion' && req.method === 'POST'){
    comptes.deconnecter(jetonDe(req));
    return repondre(res, 200, { ok: true }, null, { 'Set-Cookie': effacerCookie });
  }

  const session = comptes.session(jetonDe(req));
  const m = /^\/api\/donnees\/([^/]+)$/.exec(chemin);
  const cle = m ? m[1] : null;   // chemin déjà décodé
  // Premier lancement, base sans aucun compte : l'écran de connexion y inscrit les comptes de
  // démonstration, comme il le fait dans un navigateur — depuis ce poste seulement.
  const amorce = !session && cle === comptes.CLE_COMPTES && req.method === 'PUT' && comptes.aucun() && depuisCePoste(req);
  if (!session && !amorce) return repondre(res, 401, { erreur: 'non connecté' });

  if (chemin === '/api/donnees' && req.method === 'GET') return repondre(res, 200, session ? donneesPour(session.page) : {});

  if (chemin === '/api/effacer' && req.method === 'POST'){
    if (!droits.peutEffacer(session.page)) return repondre(res, 403, { erreur: 'réservé à un administrateur' });
    const copie = base.effacerTout();
    journal('EFFACEMENT GÉNÉRAL par', session.page.user, '— copie prise avant :', path.relative(RACINE, copie));
    return repondre(res, 200, { ok: true });
  }

  if (cle){
    if (!CLE_VALIDE.test(cle)) return repondre(res, 400, { erreur: 'clé inconnue' });
    const revisionVue = Number(req.headers['x-vigie-revision']);
    if (!Number.isInteger(revisionVue) || revisionVue < 0) return repondre(res, 400, { erreur: 'en-tête X-Vigie-Revision manquant' });
    if (req.method !== 'PUT' && req.method !== 'DELETE') return repondre(res, 405, { erreur: 'méthode' });
    let valeur = req.method === 'PUT' ? await lireCorps(req) : null;
    const anonyme = session && Anonymisation.estAnonyme(session.page);
    // compte anonymisé sur un registre réduit : ses seuls ajouts, greffés sur le registre complet
    if (anonyme && Anonymisation.PROJETEES[cle] && valeur !== null) valeur = Anonymisation.grefferAjouts(base.lire(cle), valeur);
    // compte limité à certains services : sa part, greffée sur le registre complet
    if (session && Perimetre.limite(session.page)) valeur = Perimetre.greffer(base.lire(cle), valeur, session.page.services);
    if (session && !droits.peutEcrire(session.page, cle, valeur, base.lire(cle))){
      journal('écriture refusée :', cle, 'par', session.page.user);
      return repondre(res, 403, { erreur: 'droits insuffisants' });
    }
    if (session && cle === CLE_AUDIT && valeur !== null) valeur = signerJournal(base.lire(cle), valeur, session.page.user);
    let mots = [];
    if (cle === comptes.CLE_COMPTES && valeur !== null) ({ valeur, mots } = comptes.epurer(valeur));
    const r = valeur === null ? base.supprimer(cle, revisionVue) : base.ecrire(cle, valeur, revisionVue);
    if (!r.ok){
      journal('conflit', cle, '(vue', revisionVue, '/ actuelle', r.revision + ')');
      return repondre(res, 409, session ? Object.assign({}, r, { valeur: valeurPour(session.page, cle, r.valeur) }) : r);
    }
    if (cle === comptes.CLE_COMPTES) comptes.apresEcriture(mots);
    journal(req.method === 'PUT' ? 'écrit' : 'supprimé', cle, '→ révision', r.revision, 'par', session ? session.page.user : '(premier lancement)');
    return repondre(res, 200, r);
  }
  return repondre(res, 404, { erreur: 'inconnu' });
}

function fichier(req, res, chemin){
  if (req.method !== 'GET' && req.method !== 'HEAD') return texte(res, 405, 'méthode');
  if (chemin === '/') chemin = '/index.html';
  const relatif = path.normalize(chemin).replace(/^[\\/]+/, '');
  const f = path.join(RACINE, relatif);
  // ni hors du dépôt, ni ses fichiers cachés (.git), ni ce dossier (la base)
  const segments = relatif.split(/[\\/]/);
  if (!f.startsWith(RACINE + path.sep) || segments.some(s => s.startsWith('.')) || segments[0] === 'serveur')
    return texte(res, 404, '404');
  // seuls les types de l'application : une clé de certificat, une copie de base… posées dans le dossier ne sortent pas
  const type = TYPES[path.extname(f).toLowerCase()];
  if (!type) return texte(res, 404, '404');
  const html = path.extname(f).toLowerCase() === '.html';
  let session = null;
  const entetes = {};
  if (html){
    const jeton = jetonDe(req);
    if (chemin === '/login.html'){
      // toutes les pages s'y rendent pour se déconnecter : la session prend fin ici aussi
      if (jeton){ comptes.deconnecter(jeton); entetes['Set-Cookie'] = effacerCookie; }
    } else {
      session = comptes.session(jeton);
      if (!session && !PUBLIQUES.has(chemin)) return texte(res, 302, 'connexion requise', { Location: '/login.html' });
    }
  }
  fs.readFile(f, (err, data) => {
    if (err) return texte(res, 404, '404');
    if (html){
      const page = data.toString('utf8'), balise = '<script src="assets/stockage.js"></script>';
      // lue à chaque page : on voit toujours la dernière version enregistrée par quiconque
      return repondre(res, 200, page.includes(balise) ? page.replace(balise, injection(session) + balise) : page, type, entetes);
    }
    repondre(res, 200, data, type);
  });
}

const traiter = async (req, res) => {
  try {
    if (!HOTES.has(String(req.headers.host))) return texte(res, 421, 'hôte refusé');
    const chemin = decodeURIComponent(req.url.split('?')[0]);
    if (chemin.startsWith('/api/')) return await api(req, res, chemin);
    return fichier(req, res, chemin);
  } catch(e){
    journal('erreur', e.message);
    if (!res.headersSent) repondre(res, e.statut || 500, { erreur: e.statut === 413 ? 'trop gros' : 'erreur du serveur' });
  }
};

// Ouvrir au réseau n'est permis qu'une fois la connexion chiffrée et les comptes réels en place.
function refusReseau(){
  if (!RESEAU) return null;
  if (!HTTPS) return 'pas de HTTPS : les mots de passe circuleraient en clair. Donner VIGIE_CERT et VIGIE_CLE, ou placer le serveur derrière un proxy HTTPS (VIGIE_HTTPS=1).';
  if (comptes.aucun()) return "aucun compte. Lancer d'abord le serveur sur ce poste seul (sans VIGIE_ECOUTE, VIGIE_HOTES ni VIGIE_HTTPS), s'y connecter pour créer les comptes, puis changer leurs mots de passe.";
  const demo = comptes.demoActifs();
  if (demo.length) return 'compte(s) de démonstration encore sur leur mot de passe publié : ' + demo.join(', ') + '. Changer ces mots de passe (ou désactiver ces comptes) dans Administration, sur ce poste seul, puis relancer.';
  return null;
}
let serveur;
try { serveur = HTTPS_NATIF ? https.createServer({ cert: fs.readFileSync(CERT), key: fs.readFileSync(CLE_TLS) }, traiter) : http.createServer(traiter); }
catch(e){ console.error('VIGIE HSE — certificat illisible (' + e.message + ').'); process.exit(1); }

const repris = comptes.reprendreAncienneBase();
const refus = refusReseau();
if (refus){ console.error('VIGIE HSE — ouverture au réseau refusée : ' + refus); base.fermer(); process.exit(1); }
const arreterSauvegardes = Sauvegardes.planifier(base, {
  dossier: process.env.VIGIE_SAUVEGARDES || path.join(path.dirname(BASE), 'sauvegardes'),
  heures: process.env.VIGIE_SAUVEGARDE_HEURES === undefined ? 24 : Number(process.env.VIGIE_SAUVEGARDE_HEURES),
  garder: Number(process.env.VIGIE_SAUVEGARDES_GARDER) || 14,
  journal });
serveur.listen(PORT, ECOUTE, () => {
  // derrière un proxy, l'adresse à donner aux utilisateurs est celle du proxy (port HTTPS habituel)
  const adresse = HTTPS && !HTTPS_NATIF ? 'https://' + (NOMS[0] || 'nom-du-proxy') : (HTTPS_NATIF ? 'https' : 'http') + '://' + (NOMS[0] || 'localhost') + ':' + PORT;
  journal('VIGIE HSE — serveur ' + (RESEAU ? 'ouvert au réseau (écoute ' + ECOUTE + (HTTPS_NATIF ? ', HTTPS' : ', derrière un proxy HTTPS') + ')' : 'local') + ' : ' + adresse);
  journal('Base : ' + BASE + ' (' + base.nombre() + ' registre(s) enregistré(s))');
  if (repris) journal('Base antérieure à P1b : ' + repris + ' mot(s) de passe retiré(s) des données et haché(s).');
  if (comptes.aucun()) journal('Aucun compte : le premier passage sur l\'écran de connexion, depuis ce poste, crée les comptes de démonstration.');
  else if (comptes.demoActive()) journal('ATTENTION : les comptes de démonstration (mots de passe publiés dans le dépôt) sont actifs — à changer avant tout usage réel.');
});
const arreter = () => { arreterSauvegardes(); serveur.close(); base.fermer(); process.exit(0); };
process.on('SIGINT', arreter); process.on('SIGTERM', arreter);
