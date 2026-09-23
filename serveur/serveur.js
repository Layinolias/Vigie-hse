// Serveur VIGIE HSE — étape P1a (Documentation/PLAN-MISE-EN-PRODUCTION.md) : les données ne vivent plus
// dans chaque navigateur mais dans une base partagée, sur ce poste. Les pages sont les mêmes que sur le
// site en ligne : en les servant, le serveur glisse avant assets/stockage.js l'état de la base
// (window.__VIGIE_SERVEUR__), et VigieStore bascule tout seul — lecture dans cet état, écriture par l'API.
// Ouverte sans ce serveur (fichier local, GitHub Pages), une page garde son stockage navigateur habituel.
//
// Lancement, depuis la racine du dépôt (Node 22.5 ou plus récent, rien à installer) :
//   node serveur/serveur.js            → http://localhost:8780
// Variables : PORT (8780 par défaut), VIGIE_BASE (fichier de la base, serveur/donnees/vigie.db par défaut).
//
// Limites assumées de P1a : pas encore d'authentification ni de droits appliqués côté serveur (les rôles
// restent vérifiés par les pages, comme aujourd'hui) — c'est pourquoi le serveur n'écoute QUE sur ce
// poste (127.0.0.1) : aucun autre ordinateur du réseau ne peut s'y connecter. L'ouvrir au réseau
// attendra l'authentification (P1b).
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { ouvrir } = require('./base-sqlite.js');

const RACINE = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 8780;
const BASE = process.env.VIGIE_BASE || path.join(__dirname, 'donnees', 'vigie.db');
const TAILLE_MAX = 50 * 1024 * 1024;          // une clé = un registre entier ; l'historique complet d'un client tient large
const CLE_VALIDE = /^vigie_hse_[a-z0-9_]{1,80}$/;
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.ico':'image/x-icon',
  '.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.md':'text/plain; charset=utf-8' };
// Noms sous lesquels le serveur accepte d'être appelé : refuser les autres bloque qu'un site piégé,
// ouvert dans le navigateur de ce poste, fasse passer son propre nom de domaine pour celui-ci.
const HOTES = new Set(['localhost:' + PORT, '127.0.0.1:' + PORT, '[::1]:' + PORT]);

const base = ouvrir(BASE);
const journal = (...m) => console.log(new Date().toLocaleString('fr-FR') + ' ' + m.join(' '));

function repondre(res, statut, corps, type){
  res.writeHead(statut, { 'Content-Type': type || 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(type ? corps : JSON.stringify(corps));
}

// État de la base glissé dans chaque page. « < » est encodé : une valeur contenant « </script> » ne peut
// pas refermer la balise ; U+2028/2029 le sont aussi (fins de ligne pour les anciens moteurs JavaScript).
function injection(){
  const donnees = {};
  for (const [cle, d] of Object.entries(base.lireTout())) donnees[cle] = { v: d.valeur, r: d.revision };
  const json = JSON.stringify({ api: '/api/', donnees })
    .replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return '<script>window.__VIGIE_SERVEUR__ = ' + json + ';</script>\n';
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

  if (chemin === '/api/donnees' && req.method === 'GET') return repondre(res, 200, base.lireTout());

  if (chemin === '/api/effacer' && req.method === 'POST'){
    const copie = base.effacerTout();
    journal('EFFACEMENT GÉNÉRAL — copie prise avant :', path.relative(RACINE, copie));
    return repondre(res, 200, { ok: true });
  }

  const m = /^\/api\/donnees\/([^/]+)$/.exec(chemin);
  if (m){
    const cle = m[1];   // chemin déjà décodé
    if (!CLE_VALIDE.test(cle)) return repondre(res, 400, { erreur: 'clé inconnue' });
    const revisionVue = Number(req.headers['x-vigie-revision']);
    if (!Number.isInteger(revisionVue) || revisionVue < 0) return repondre(res, 400, { erreur: 'en-tête X-Vigie-Revision manquant' });
    let r;
    if (req.method === 'PUT') r = base.ecrire(cle, await lireCorps(req), revisionVue);
    else if (req.method === 'DELETE') r = base.supprimer(cle, revisionVue);
    else return repondre(res, 405, { erreur: 'méthode' });
    if (!r.ok){ journal('conflit', cle, '(vue', revisionVue, '/ actuelle', r.revision + ')'); return repondre(res, 409, r); }
    journal(req.method === 'PUT' ? 'écrit' : 'supprimé', cle, '→ révision', r.revision);
    return repondre(res, 200, r);
  }
  return repondre(res, 404, { erreur: 'inconnu' });
}

function fichier(req, res, chemin){
  if (req.method !== 'GET' && req.method !== 'HEAD') return repondre(res, 405, 'méthode', 'text/plain; charset=utf-8');
  if (chemin === '/') chemin = '/index.html';
  const relatif = path.normalize(chemin).replace(/^[\\/]+/, '');
  const f = path.join(RACINE, relatif);
  // ni hors du dépôt, ni ses fichiers cachés (.git contient le jeton du dépôt distant), ni ce dossier (la base)
  const segments = relatif.split(/[\\/]/);
  if (!f.startsWith(RACINE + path.sep) || segments.some(s => s.startsWith('.')) || segments[0] === 'serveur')
    return repondre(res, 404, '404', 'text/plain; charset=utf-8');
  fs.readFile(f, (err, data) => {
    if (err) return repondre(res, 404, '404', 'text/plain; charset=utf-8');
    const type = TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream';
    if (path.extname(f).toLowerCase() === '.html'){
      const html = data.toString('utf8'), balise = '<script src="assets/stockage.js"></script>';
      // lue à chaque page : on voit toujours la dernière version enregistrée par quiconque
      return repondre(res, 200, html.includes(balise) ? html.replace(balise, injection() + balise) : html, type);
    }
    repondre(res, 200, data, type);
  });
}

const serveur = http.createServer(async (req, res) => {
  try {
    if (!HOTES.has(String(req.headers.host))) return repondre(res, 421, 'hôte refusé', 'text/plain; charset=utf-8');
    const chemin = decodeURIComponent(req.url.split('?')[0]);
    if (chemin.startsWith('/api/')) return await api(req, res, chemin);
    return fichier(req, res, chemin);
  } catch(e){
    journal('erreur', e.message);
    if (!res.headersSent) repondre(res, e.statut || 500, { erreur: e.statut === 413 ? 'trop gros' : 'erreur du serveur' });
  }
});

serveur.listen(PORT, '127.0.0.1', () => {
  journal('VIGIE HSE — serveur local : http://localhost:' + PORT);
  journal('Base :', BASE, '(' + base.nombre() + ' registre(s) enregistré(s))');
});
const arreter = () => { serveur.close(); base.fermer(); process.exit(0); };
process.on('SIGINT', arreter); process.on('SIGTERM', arreter);
