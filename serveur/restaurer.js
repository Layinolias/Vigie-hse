// Revenir à une sauvegarde, sur le poste d'un utilisateur — appelé par « Restaurer une sauvegarde.bat »
// (double-clic). Documentation/LIVRAISON-POSTE.md, LISEZ-MOI.txt §9.
//
// Remplace la manipulation à la main (renommer vigie.db, supprimer vigie.db-wal et vigie.db-shm, copier et
// renommer une sauvegarde), facile à rater : un vigie.db-wal oublié, venu de la base actuelle, peut abîmer
// la base remise en place. Ici :
//   1. refus si VIGIE HSE tourne (la base est ouverte) ;
//   2. liste des copies, de la plus récente à la plus ancienne, avec leur date et ce qu'elles contiennent ;
//   3. la copie choisie est vérifiée (intégrité SQLite, base VIGIE HSE) avant de toucher à quoi que ce soit ;
//   4. confirmation en toutes lettres (OUI) ;
//   5. les données actuelles sont d'abord mises de côté (sauvegardes\vigie-avant-restauration-….db, les
//      5 dernières gardées) : une restauration se défait avec ce même outil ;
//   6. la copie remplace vigie.db, sans fichier -wal ni -shm résiduel, puis la base remise en place est
//      vérifiée à son tour.
//
// Mêmes variables que serveur/lancer-poste.js : VIGIE_DOSSIER, VIGIE_BASE, VIGIE_SAUVEGARDES, PORT.
'use strict';
const path = require('path'), os = require('os'), fs = require('fs'), http = require('http');

const [maj, min] = process.versions.node.split('.').map(Number);
if (maj < 22 || (maj === 22 && min < 5)){
  console.error('\nVIGIE HSE a besoin de Node.js 22.5 ou plus récent (installé ici : ' + process.versions.node + ').\n');
  process.exit(1);
}
const emettre = process.emitWarning;
process.emitWarning = function(w, ...r){
  const type = typeof r[0] === 'string' ? r[0] : (r[0] && r[0].type) || (w && w.name);
  if (type === 'ExperimentalWarning') return;
  return emettre.call(process, w, ...r);
};
const { ouvrir, examiner } = require('./base-sqlite.js');

const PORT = Number(process.env.PORT) || 8780;
const DOSSIER = process.env.VIGIE_DOSSIER || path.join(os.homedir(), 'VIGIE HSE');
const BASE = process.env.VIGIE_BASE || path.join(DOSSIER, 'vigie.db');
const SAUVEGARDES = process.env.VIGIE_SAUVEGARDES || path.join(DOSSIER, 'sauvegardes');
const GARDER_AVANT_RESTAURATION = 5;

const SORTES = [
  { dossier: SAUVEGARDES, motif: /^vigie-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.db$/, libelle: 'copie quotidienne' },
  { dossier: SAUVEGARDES, motif: /^vigie-avant-mise-a-jour-.+\.db$/, libelle: 'avant une nouvelle version' },
  { dossier: SAUVEGARDES, motif: /^vigie-avant-restauration-.+\.db$/, libelle: 'vos données juste avant une restauration' },
  { dossier: path.dirname(BASE), motif: /^sauvegarde-avant-effacement-.+\.db$/, libelle: 'avant « Réinitialiser les données »' },
];
const NOMS = { vigie_hse_dataset: 'accident(s)', vigie_hse_visites: 'suivi(s) médical(aux)', vigie_hse_actions: 'action(s)',
  vigie_hse_duerp_dataset: 'ligne(s) du document unique', vigie_hse_users: 'compte(s)' };

const deux = n => String(n).padStart(2, '0');
const date = d => deux(d.getDate()) + '/' + deux(d.getMonth() + 1) + '/' + d.getFullYear() + ' à ' + deux(d.getHours()) + 'h' + deux(d.getMinutes());
const horodatage = d => d.getFullYear() + '-' + deux(d.getMonth() + 1) + '-' + deux(d.getDate()) + '_' + deux(d.getHours()) + '-' + deux(d.getMinutes()) + '-' + deux(d.getSeconds());
function contenu(e){
  if (!e.ok) return 'ILLISIBLE — ' + e.raison;
  const n = Object.keys(NOMS).filter(k => e.nombres[k]).map(k => e.nombres[k] + ' ' + NOMS[k]);
  return (e.maj ? 'dernière saisie le ' + date(new Date(e.maj)) : 'aucune saisie') + (n.length ? ' — ' + n.join(', ') : '');
}

function repond(){
  return new Promise(ok => {
    const q = http.get({ host: '127.0.0.1', port: PORT, path: '/login.html', headers: { Host: 'localhost:' + PORT } }, res => { res.resume(); ok(true); });
    q.on('error', () => ok(false)); q.setTimeout(1500, () => { q.destroy(); ok(false); });
  });
}

// lecture ligne à ligne de l'entrée (clavier, ou texte envoyé par un test) ; fin de l'entrée : ''
const lignes = [], attentes = [];
let finie = false;
require('readline').createInterface({ input: process.stdin }).on('line', l => { attentes.length ? attentes.shift()(l) : lignes.push(l); })
  .on('close', () => { finie = true; while (attentes.length) attentes.shift()(''); });
function demander(question){
  process.stdout.write(question);
  return new Promise(ok => { if (lignes.length) ok(lignes.shift()); else if (finie) ok(''); else attentes.push(ok); })
    .then(r => { r = String(r).trim(); if (!process.stdin.isTTY) process.stdout.write(r + '\n'); return r; });
}
const fin = (code, message) => { if (message) console.log('\n' + message + '\n'); process.exit(code); };

function copies(){
  const l = [];
  for (const s of SORTES){
    let fichiers = [];
    try { fichiers = fs.readdirSync(s.dossier).filter(f => s.motif.test(f)); } catch(e){}
    for (const f of fichiers){ const chemin = path.join(s.dossier, f); l.push({ chemin, nom: f, libelle: s.libelle, quand: fs.statSync(chemin).mtime }); }
  }
  return l.sort((a, b) => b.quand - a.quand);
}

// les données actuelles, mises de côté avant d'être remplacées
function mettreDeCote(){
  if (!fs.existsSync(BASE)) return null;
  fs.mkdirSync(SAUVEGARDES, { recursive: true });
  const dest = path.join(SAUVEGARDES, 'vigie-avant-restauration-' + horodatage(new Date()) + '.db');
  try {
    const b = ouvrir(BASE); try { b.copier(dest); } finally { b.fermer(); }
  } catch(e){
    // base actuelle illisible : on garde ses fichiers tels quels, pour ne rien perdre
    for (const suffixe of ['', '-wal', '-shm']) if (fs.existsSync(BASE + suffixe)) fs.copyFileSync(BASE + suffixe, dest + suffixe);
  }
  const anciennes = fs.readdirSync(SAUVEGARDES).filter(f => /^vigie-avant-restauration-.+\.db$/.test(f)).sort();
  for (const f of anciennes.slice(0, Math.max(0, anciennes.length - GARDER_AVANT_RESTAURATION)))
    for (const suffixe of ['', '-wal', '-shm']) fs.rmSync(path.join(SAUVEGARDES, f + suffixe), { force: true });
  return dest;
}

(async () => {
  console.log('\n  VIGIE HSE — revenir à une sauvegarde\n  Vos données : ' + DOSSIER + '\n');
  if (await repond()) fin(1, 'VIGIE HSE est en cours d\'utilisation : fermez d\'abord sa fenêtre noire, puis relancez cet outil.\nRien n\'a été modifié.');

  const liste = copies();
  if (!liste.length) fin(1, 'Aucune sauvegarde trouvée dans ' + SAUVEGARDES + '.\nRien n\'a été modifié.');

  console.log('  Vos données actuelles : ' + (fs.existsSync(BASE) ? contenu(examiner(BASE)) : 'aucune (vigie.db absent)') + '\n');
  console.log('  Sauvegardes disponibles, de la plus récente à la plus ancienne :\n');
  liste.forEach((c, i) => {
    c.examen = examiner(c.chemin);
    console.log('  ' + String(i + 1).padStart(2) + '. ' + date(c.quand) + ' — ' + c.libelle + '\n      ' + contenu(c.examen));
  });

  const r = await demander('\n  Numéro de la sauvegarde à remettre en place (Entrée seule : annuler) : ');
  if (!r) fin(0, 'Annulé. Rien n\'a été modifié.');
  const n = Number(r);
  if (!Number.isInteger(n) || n < 1 || n > liste.length) fin(1, '« ' + r + ' » ne correspond à aucune sauvegarde de la liste. Rien n\'a été modifié.');
  const choisie = liste[n - 1];
  if (!choisie.examen.ok) fin(1, 'Cette sauvegarde ne peut pas être utilisée : ' + choisie.examen.raison + '.\nChoisissez-en une autre. Rien n\'a été modifié.');

  console.log('\n  Vos données actuelles seront remplacées par celles du ' + date(choisie.quand) + '.');
  console.log('  Tout ce qui a été saisi depuis disparaîtra de VIGIE HSE ; les comptes et les mots de passe');
  console.log('  reviennent eux aussi à cette date. Vos données actuelles sont d\'abord mises de côté :');
  console.log('  ce même outil permet d\'y revenir.');
  const ok = await demander('\n  Pour confirmer, tapez OUI : ');
  if (ok.toLowerCase() !== 'oui') fin(0, 'Annulé. Rien n\'a été modifié.');

  const deCote = mettreDeCote();
  const temporaire = BASE + '.restauration-en-cours';
  fs.copyFileSync(choisie.chemin, temporaire);
  for (const suffixe of ['-wal', '-shm']) fs.rmSync(BASE + suffixe, { force: true });
  fs.renameSync(temporaire, BASE);
  const apres = examiner(BASE);
  if (!apres.ok) fin(1, 'La base remise en place ne se lit pas (' + apres.raison + ').' + (deCote ? '\nVos données d\'avant sont dans : ' + deCote : ''));

  fin(0, '  C\'est fait : vos données sont revenues au ' + date(choisie.quand) + ' (' + contenu(apres) + ').' +
    (deCote ? '\n  Celles d\'avant sont gardées dans : ' + deCote : '') +
    '\n  Relancez VIGIE HSE (« Lancer VIGIE HSE.bat »).');
})();
