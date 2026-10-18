// Harnais des tests de livraison (tests/LISEZ-MOI.md, Documentation/LIVRAISON-POSTE.md) : un vrai serveur VIGIE HSE
// — celui du dépôt, celui d'un ancien commit ou celui d'un paquet décompressé —, ses vraies pages exécutées dans
// jsdom, des XMLHttpRequest synchrones réels (une vraie requête HTTP par appel, par aide-xhr.js) et un pot de
// cookies par personne. Les scripts d'une page sont demandés au serveur qui la sert : une ancienne version tourne
// avec ses propres composants, et la bibliothèque Excel s'exécute dans la page (un seul « realm »).
'use strict';
process.env.TZ = process.env.TZ || 'Europe/Paris';
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http');
const { spawn, spawnSync, execFileSync } = require('child_process');
let jsdom;
try { jsdom = require('jsdom'); }
catch (e) { console.error('\njsdom manque : lancer « npm install » dans le dossier tests/ (voir tests/LISEZ-MOI.md).\n'); process.exit(2); }
const { JSDOM, VirtualConsole, CookieJar } = jsdom;

const DEPOT = path.resolve(__dirname, '..');
const AIDE = path.join(__dirname, 'aide-xhr.js');
const GIT = process.platform === 'win32' && fs.existsSync('C:\\Program Files\\Git\\cmd\\git.exe') ? 'C:\\Program Files\\Git\\cmd\\git.exe' : 'git';
const TAR = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- bilan ----------
function bilan(titre){
  let ok = 0, ko = 0;
  const verif = (nom, cond, detail) => {
    cond ? ok++ : ko++;
    if (!cond) process.exitCode = 1;   // un échec se voit au code de sortie, même si le test s'arrête avant son bilan
    const d = cond || detail === undefined ? '' : ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 800);
    console.log((cond ? 'OK  ' : 'KO  ') + nom + d);
    return !!cond;
  };
  const fin = () => { console.log('\n' + titre + ' : ' + ok + ' OK, ' + ko + ' KO'); return ko; };
  return { verif, fin };
}

// ---------- fichiers ----------
const dossierTemporaire = prefixe => fs.mkdtempSync(path.join(os.tmpdir(), 'vigie-' + prefixe + '-'));
function effacer(d){ for (let i = 0; i < 10; i++){ try { fs.rmSync(d, { recursive: true, force: true }); return; } catch(e){ spawnSync(process.execPath, ['-e', 'setTimeout(()=>{},300)']); } } }
const git = (...a) => execFileSync(GIT, a, { cwd: DEPOT, encoding: 'utf8' }).trim();
// une version du dépôt (un commit), extraite dans un dossier
function extraireCommit(commit, dossier){
  fs.mkdirSync(dossier, { recursive: true });
  const tar = path.join(path.dirname(dossier), 'version-' + commit + '.tar');
  execFileSync(GIT, ['-C', DEPOT, 'archive', '--format=tar', '-o', tar, commit]);
  execFileSync(TAR, ['-x', '-f', tar, '-C', dossier]);
  fs.rmSync(tar, { force: true });
  return dossier;
}
function deballer(zip, dossier){ fs.mkdirSync(dossier, { recursive: true }); execFileSync(TAR, ['-x', '-f', zip, '-C', dossier]); return dossier; }
// les fichiers d'un dossier, chemins relatifs avec « / »
function lister(d, base = d){
  let l = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })){
    const p = path.join(d, e.name);
    if (e.isDirectory()) l = l.concat(lister(p, base)); else l.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return l;
}
const pages = racine => fs.readdirSync(racine).filter(f => f.endsWith('.html')).sort();

// ---------- serveur ----------
function repond(port){
  return new Promise(ok => {
    const q = http.get({ host: '127.0.0.1', port, path: '/login.html', headers: { Host: 'localhost:' + port } }, r => { r.resume(); ok(r.statusCode === 200); });
    q.on('error', () => ok(false)); q.setTimeout(1500, () => { q.destroy(); ok(false); });
  });
}
// tue un processus et ses enfants (Windows : un .bat lance node, qu'il faut arrêter aussi)
function tuer(p){
  if (!p || p.exitCode !== null) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(p.pid), '/T', '/F'], { stdio: 'ignore' });
  else p.kill('SIGKILL');
}
async function attendreFin(p, ms = 5000){ for (let t = 0; t < ms && p.exitCode === null && p.signalCode === null; t += 100) await sleep(100); }
// « node <racine>/<script> » (serveur/serveur.js, serveur/lancer-poste.js), arrêté brutalement par arreter() —
// comme la fenêtre noire qu'on ferme
async function demarrer({ racine = DEPOT, script = 'serveur/serveur.js', port, env = {} }){
  const p = spawn(process.execPath, [path.join(racine, script)], { cwd: racine, env: Object.assign({}, process.env, { PORT: String(port) }, env), stdio: ['ignore', 'pipe', 'pipe'] });
  let sortie = '';
  p.stdout.on('data', d => { sortie += d; }); p.stderr.on('data', d => { sortie += d; });
  for (let i = 0; i < 80 && p.exitCode === null; i++){ if (await repond(port)) break; await sleep(250); }
  const s = { proc: p, port, sortie: () => sortie, arreter: async () => { tuer(p); await attendreFin(p); await sleep(300); } };
  if (!(await repond(port))){ await s.arreter(); throw new Error('le serveur ne répond pas (port ' + port + ') :\n' + sortie.slice(-1500)); }
  return s;
}

// une requête au serveur, avec le pot de cookies d'une personne ; toute écriture porte X-Vigie
function requete(port, methode, chemin, { corps = null, entetes = {}, pot = null } = {}){
  const origine = 'http://localhost:' + port + '/';
  return new Promise((res, rej) => {
    const h = Object.assign({ Host: 'localhost:' + port }, entetes);
    if (methode !== 'GET' && !h['X-Vigie']) h['X-Vigie'] = '1';
    if (pot){ const c = pot.getCookieStringSync(origine); if (c) h.Cookie = c; }
    const r = http.request({ host: '127.0.0.1', port, method: methode, path: chemin, headers: h }, rep => {
      if (pot) [].concat(rep.headers['set-cookie'] || []).forEach(c => pot.setCookieSync(c, origine));
      const m = []; rep.on('data', d => m.push(d));
      rep.on('end', () => { const b = Buffer.concat(m); res({ statut: rep.statusCode, entetes: rep.headers, corps: b, texte: b.toString('utf8') }); });
    });
    r.on('error', rej);
    if (corps != null) r.write(corps);
    r.end();
  });
}
const nouveauPot = () => new CookieJar();
async function connecter(port, identifiant, motDePasse, pot){
  const r = await requete(port, 'POST', '/api/connexion', { pot, corps: JSON.stringify({ identifiant, motDePasse }), entetes: { 'Content-Type': 'application/json' } });
  let j = {}; try { j = JSON.parse(r.texte); } catch(e){}
  return { statut: r.statut, session: j.session || null, erreur: j.erreur };
}
// { cle: { valeur, revision } } tel que ce compte le reçoit
async function donnees(port, pot){ const r = await requete(port, 'GET', '/api/donnees', { pot }); return r.statut === 200 ? JSON.parse(r.texte) : null; }
async function ecrire(port, pot, cle, valeur, revision){
  const r = await requete(port, 'PUT', '/api/donnees/' + cle, { pot, corps: valeur, entetes: { 'X-Vigie-Revision': String(revision), 'Content-Type': 'text/plain;charset=UTF-8' } });
  return r.statut;
}

// ---------- pages ----------
// XMLHttpRequest synchrone (et asynchrone, rappels différés) : une vraie requête par appel, cookies du pot de la page
function classeXhr(w, pot, activite){
  return class XMLHttpRequest {
    constructor(){ this.readyState = 0; this.status = 0; this.responseText = ''; this.response = ''; this._h = {}; this._rh = {}; }
    open(methode, url, asynchrone){ this._m = String(methode).toUpperCase(); this._u = new w.URL(url, w.location.href).href; this._async = asynchrone !== false; this.readyState = 1; }
    setRequestHeader(k, v){ this._h[k] = String(v); }
    getResponseHeader(k){ const v = this._rh[String(k).toLowerCase()]; return v == null ? null : [].concat(v).join(', '); }
    getAllResponseHeaders(){ return Object.entries(this._rh).map(([k, v]) => k + ': ' + [].concat(v).join(', ')).join('\r\n'); }
    abort(){}
    addEventListener(t, f){ this['on' + t] = f; }
    send(corps){
      activite.dernier = Date.now(); activite.xhr++;
      const h = Object.assign({}, this._h);
      const c = pot.getCookieStringSync(this._u); if (c) h.Cookie = c;
      const r = spawnSync(process.execPath, [AIDE], { input: JSON.stringify({ methode: this._m, url: this._u, entetes: h, corps: corps == null ? null : String(corps) }), encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
      let rep = { statut: 0, entetes: {}, corps: '' };
      try { rep = JSON.parse(r.stdout); } catch(e){}
      [].concat((rep.entetes || {})['set-cookie'] || []).forEach(x => pot.setCookieSync(x, this._u));
      this.status = rep.statut; this.responseText = this.response = rep.corps; this._rh = rep.entetes || {}; this.readyState = 4;
      const prevenir = () => { for (const f of ['onreadystatechange', 'onload', 'onloadend']) if (typeof this[f] === 'function') this[f]({ target: this }); };
      if (this._async) setTimeout(prevenir, 0); else prevenir();
    }
  };
}
// Ouvre une page servie par le serveur (état injecté selon le cookie du pot), exécute ses scripts dans l'ordre du
// document, puis attend que la page ait fini d'écrire. → { statut, w, erreurs, alertes, externes, navigation(), fermer() }
async function ouvrirPage(port, page, { pot, calme = 600, maxi = 15000 } = {}){
  const rep = await requete(port, 'GET', '/' + page, { pot });
  if (rep.statut !== 200) return { statut: rep.statut, entetes: rep.entetes, erreurs: [], fermer: () => {} };
  const erreurs = [], alertes = [], externes = [];
  let navigation = false;
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => {
    const m = String(e && e.message || e);
    if (/navigation/i.test(m)){ navigation = true; return; }
    if (/Not implemented|Could not load/.test(m)) return;
    erreurs.push(m.split('\n')[0].slice(0, 300));
  });
  const origine = 'http://localhost:' + port + '/';
  const w = new JSDOM(rep.texte, { runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc, url: origine + page, cookieJar: pot }).window;
  const activite = { dernier: Date.now(), xhr: 0, fetch: 0 };
  w.XMLHttpRequest = classeXhr(w, pot, activite);
  w.fetch = async (u, o) => {
    const url = new w.URL(String(u && u.url || u), w.location.href);
    if (url.origin !== new w.URL(origine).origin){ externes.push(url.href); throw new w.TypeError('hors réseau'); }
    activite.dernier = Date.now(); activite.fetch++;
    const r = await requete(port, (o && o.method) || 'GET', url.pathname + url.search, { pot });
    activite.dernier = Date.now();
    const b = r.corps;
    return { ok: r.statut >= 200 && r.statut < 300, status: r.statut,
      headers: { get: k => { const v = r.entetes[String(k).toLowerCase()]; return v == null ? null : [].concat(v).join(', '); } },
      arrayBuffer: async () => { const ab = new w.ArrayBuffer(b.length); new w.Uint8Array(ab).set(b); return ab; },
      text: async () => b.toString('utf8'), json: async () => JSON.parse(b.toString('utf8')) };
  };
  w.alert = m => { alertes.push(String(m)); }; w.confirm = () => true; w.prompt = () => null; w.print = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {}; w.scrollTo = () => {}; w.setInterval = () => 0;
  w.matchMedia = () => ({ matches: false, media: '', addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
  if (!w.TextDecoder) w.TextDecoder = TextDecoder;
  if (!w.TextEncoder) w.TextEncoder = TextEncoder;
  for (const s of [...w.document.querySelectorAll('script')]){
    try {
      const src = s.getAttribute('src');
      if (src){
        const u = new w.URL(src, w.location.href);
        if (u.origin !== new w.URL(origine).origin){ externes.push(u.href); continue; }
        const r = await requete(port, 'GET', u.pathname, { pot });
        if (r.statut !== 200){ erreurs.push('script ' + u.pathname + ' : ' + r.statut); continue; }
        w.eval(r.texte);
      } else w.eval(s.textContent);
    } catch(e){ erreurs.push('script : ' + String(e && e.message || e).slice(0, 300)); }
  }
  try { w.document.dispatchEvent(new w.Event('DOMContentLoaded')); w.dispatchEvent(new w.Event('load')); }
  catch(e){ erreurs.push('chargement : ' + String(e && e.message || e).slice(0, 300)); }
  // la page a fini quand plus rien ne passe pendant « calme » ms
  const debut = Date.now();
  await sleep(100);
  while (Date.now() - activite.dernier < calme && Date.now() - debut < maxi) await sleep(100);
  return { statut: 200, w, erreurs, alertes, externes, activite, navigation: () => navigation, fermer: () => { try { w.close(); } catch(e){} } };
}
// se connecter par le vrai formulaire de login.html (la session arrive dans le pot et le sessionStorage)
async function seConnecterParLaPage(port, identifiant, motDePasse, pot){
  const P = await ouvrirPage(port, 'login.html', { pot });
  if (P.statut !== 200) return { session: null, erreurs: ['login.html : ' + P.statut] };
  const d = P.w.document;
  d.getElementById('username').value = identifiant;
  d.getElementById('password').value = motDePasse;
  d.getElementById('loginForm').dispatchEvent(new P.w.Event('submit', { bubbles: true, cancelable: true }));
  await sleep(200);
  let session = null;
  try { session = JSON.parse(P.w.sessionStorage.getItem('vigie_hse_session') || 'null'); } catch(e){}
  const r = { session, erreurs: P.erreurs.slice(), cookie: pot.getCookieStringSync('http://localhost:' + port + '/') };
  P.fermer();
  return r;
}

// Premier lancement d'un poste réel (VIGIE_DEMO=0) : le compte administrateur créé par l'écran de connexion
// → { session, erreurs, cookie, formulaire (affiché ?), message (erreur affichée) }
async function creerPremierCompteParLaPage(port, identifiant, motDePasse, pot, confirmation = motDePasse){
  const P = await ouvrirPage(port, 'login.html', { pot });
  if (P.statut !== 200) return { session: null, erreurs: ['login.html : ' + P.statut] };
  const d = P.w.document, f = d.getElementById('premierCompte');
  const formulaire = !!f && !f.hidden && d.getElementById('loginForm').hidden;
  if (f){
    d.getElementById('nouvelIdentifiant').value = identifiant;
    d.getElementById('nouveauMdp').value = motDePasse;
    d.getElementById('nouveauMdp2').value = confirmation;
    P.w.dispatchEvent(new P.w.KeyboardEvent('keydown'));   // une vraie action : un refus du serveur se signale
    f.dispatchEvent(new P.w.Event('submit', { bubbles: true, cancelable: true }));
    await sleep(200);
  }
  let session = null;
  try { session = JSON.parse(P.w.sessionStorage.getItem('vigie_hse_session') || 'null'); } catch(e){}
  const e = d.getElementById('premierErreur');
  const r = { session, erreurs: P.erreurs.slice(), cookie: pot.getCookieStringSync('http://localhost:' + port + '/'), formulaire, message: e && e.classList.contains('show') ? e.textContent : '' };
  P.fermer();
  return r;
}

// ---------- base ----------
// le contenu d'une base, lu sur une copie (base + -wal + -shm) pour ne toucher à rien : { cle: valeur } non vides
function contenuBase(fichier){
  const { DatabaseSync } = require('node:sqlite');
  const d = dossierTemporaire('lecture'), copie = path.join(d, 'copie.db');
  try {
    for (const s of ['', '-wal', '-shm']) if (fs.existsSync(fichier + s)) fs.copyFileSync(fichier + s, copie + s);
    const db = new DatabaseSync(copie);
    try { const o = {}; for (const l of db.prepare('SELECT cle, valeur FROM donnees WHERE valeur IS NOT NULL ORDER BY cle').all()) o[l.cle] = l.valeur; return o; }
    finally { db.close(); }
  } finally { effacer(d); }
}
// les identifiants d'un registre (liste d'objets « id »), ou null si ce n'en est pas un
function identifiants(valeur){
  let l; try { l = JSON.parse(valeur); } catch(e){ return null; }
  if (!Array.isArray(l) || !l.length || !l.every(x => x && typeof x === 'object' && x.id != null)) return null;
  return l.map(x => String(x.id));
}

// ---------- fichiers .bat ----------
// un .bat exécuté par cmd.exe comme un double-clic (chemin à espaces compris) ; « entree » : ce que l'on tape
function lancerBat(chemin, { env = {}, entree = '' } = {}){
  const p = spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', '""' + chemin + '""'], { cwd: path.dirname(chemin), env: Object.assign({}, process.env, env), windowsVerbatimArguments: true, stdio: ['pipe', 'pipe', 'pipe'] });
  let sortie = '';
  p.stdout.on('data', d => { sortie += d; }); p.stderr.on('data', d => { sortie += d; });
  p.stdin.end(entree);
  return { proc: p, sortie: () => sortie };
}
// messages qu'un utilisateur ne doit jamais voir dans la fenêtre noire
const MESSAGES_TECHNIQUES = /introuvable|n.est pas reconnu|not recognized|cannot find|syntax|ExperimentalWarning|DeprecationWarning|\(node:\d+\)|Error:|at .+\(.+:\d+:\d+\)/i;

module.exports = {
  DEPOT, GIT, TAR, sleep, bilan, dossierTemporaire, effacer, git, extraireCommit, deballer, lister, pages,
  repond, tuer, attendreFin, demarrer, requete, nouveauPot, connecter, donnees, ecrire, ouvrirPage, seConnecterParLaPage, creerPremierCompteParLaPage,
  contenuBase, identifiants, lancerBat, MESSAGES_TECHNIQUES,
};
