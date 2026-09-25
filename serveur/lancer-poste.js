// Lancement de VIGIE HSE sur le poste d'un utilisateur, avec ses propres données — appelé par
// « Lancer VIGIE HSE.bat » (double-clic). Documentation/LIVRAISON-POSTE.md.
//
// - Les données vivent HORS du dossier de l'application : C:\Users\<nom>\VIGIE HSE\ (base, sauvegardes).
//   Remplacer ou supprimer le dossier de l'application pour installer une nouvelle version n'y touche pas.
//   Pas dans « Documents » : ce dossier est souvent synchronisé avec OneDrive, et des données de santé
//   n'ont pas à partir dans un nuage sans décision de la collectivité.
// - Pas de données de démonstration (VIGIE_DEMO=0) : les registres restent vides jusqu'à sa première saisie.
// - Si le serveur tourne déjà (seconde double-clic), on ouvre seulement le navigateur.
//
// Variables facultatives : VIGIE_DOSSIER (dossier des données), PORT (8780), VIGIE_NAVIGATEUR=0 (ne pas
// ouvrir le navigateur — tests).
'use strict';
const path = require('path'), os = require('os'), fs = require('fs'), http = require('http');
const { spawn } = require('child_process');

const [maj, min] = process.versions.node.split('.').map(Number);
if (maj < 22 || (maj === 22 && min < 5)){
  console.error('\nVIGIE HSE a besoin de Node.js 22.5 ou plus récent (installé ici : ' + process.versions.node + ').');
  console.error('Installer la version « LTS » depuis https://nodejs.org, puis relancer.\n');
  process.exit(1);
}

// SQLite est encore marqué « expérimental » par Node : l'avertissement n'apprendrait rien à l'utilisateur
const emettre = process.emitWarning;
process.emitWarning = function(w, ...r){
  const type = typeof r[0] === 'string' ? r[0] : (r[0] && r[0].type) || (w && w.name);
  if (type === 'ExperimentalWarning') return;
  return emettre.call(process, w, ...r);
};

const PORT = Number(process.env.PORT) || 8780;
const DOSSIER = process.env.VIGIE_DOSSIER || path.join(os.homedir(), 'VIGIE HSE');
const ADRESSE = 'http://localhost:' + PORT + '/login.html';

function repond(){
  return new Promise(ok => {
    const q = http.get({ host: '127.0.0.1', port: PORT, path: '/login.html', headers: { Host: 'localhost:' + PORT } }, res => { res.resume(); ok(res.statusCode === 200); });
    q.on('error', () => ok(false)); q.setTimeout(1500, () => { q.destroy(); ok(false); });
  });
}
function ouvrirNavigateur(){
  if (process.env.VIGIE_NAVIGATEUR === '0') return;
  if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', ADRESSE], { detached: true, stdio: 'ignore' }).unref();
  else spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [ADRESSE], { detached: true, stdio: 'ignore' }).unref();
}

(async () => {
  if (await repond()){
    console.log('VIGIE HSE est déjà lancé : ouverture du navigateur sur ' + ADRESSE);
    ouvrirNavigateur();
    return;
  }
  fs.mkdirSync(DOSSIER, { recursive: true });
  // ne pas écraser des réglages donnés à la main
  process.env.VIGIE_BASE = process.env.VIGIE_BASE || path.join(DOSSIER, 'vigie.db');
  process.env.VIGIE_SAUVEGARDES = process.env.VIGIE_SAUVEGARDES || path.join(DOSSIER, 'sauvegardes');
  if (process.env.VIGIE_DEMO === undefined) process.env.VIGIE_DEMO = '0';
  console.log('');
  console.log('  VIGIE HSE — vos données : ' + DOSSIER);
  console.log('  Laissez cette fenêtre ouverte pendant l\'utilisation ; la fermer arrête VIGIE HSE.');
  console.log('');
  require('./serveur.js');
  for (let i = 0; i < 40; i++){ if (await repond()){ ouvrirNavigateur(); return; } await new Promise(r => setTimeout(r, 250)); }
  console.error('VIGIE HSE ne répond pas : voir les messages ci-dessus.');
})();
