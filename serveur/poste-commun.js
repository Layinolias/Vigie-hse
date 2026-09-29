// Ce que partagent les outils du poste d'un utilisateur (serveur/lancer-poste.js, serveur/restaurer.js) et le
// serveur : version de Node, avertissement « expérimental » tu, emplacement des données, et le repère « base
// en service » — un fichier écrit par le serveur à son démarrage, retiré à son arrêt, qui dit à l'outil de
// restauration que la base est ouverte, quel que soit le protocole (HTTP, HTTPS), l'adresse ou le port.
'use strict';
const path = require('path'), os = require('os'), fs = require('fs'), http = require('http');

function verifierNode(){
  const [maj, min] = process.versions.node.split('.').map(Number);
  if (maj < 22 || (maj === 22 && min < 5)){
    console.error('\nVIGIE HSE a besoin de Node.js 22.5 ou plus récent (installé ici : ' + process.versions.node + ').');
    console.error('Installer la version « LTS » depuis https://nodejs.org, puis relancer.\n');
    process.exit(1);
  }
}
// SQLite est encore marqué « expérimental » par Node : l'avertissement n'apprendrait rien à l'utilisateur
function tairesExperimental(){
  const emettre = process.emitWarning;
  process.emitWarning = function(w, ...r){
    const type = typeof r[0] === 'string' ? r[0] : (r[0] && r[0].type) || (w && w.name);
    if (type === 'ExperimentalWarning') return;
    return emettre.call(process, w, ...r);
  };
}

const PORT = () => Number(process.env.PORT) || 8780;
const DOSSIER = () => process.env.VIGIE_DOSSIER || path.join(os.homedir(), 'VIGIE HSE');
const BASE = () => process.env.VIGIE_BASE || path.join(DOSSIER(), 'vigie.db');
const SAUVEGARDES = () => process.env.VIGIE_SAUVEGARDES || path.join(DOSSIER(), 'sauvegardes');

// VIGIE HSE répond-il sur ce poste, en HTTP ? (lanceur : ne pas démarrer un second serveur)
function repond(){
  return new Promise(ok => {
    const q = http.get({ host: '127.0.0.1', port: PORT(), path: '/login.html', headers: { Host: 'localhost:' + PORT() } }, res => { res.resume(); ok(res.statusCode === 200); });
    q.on('error', () => ok(false)); q.setTimeout(1500, () => { q.destroy(); ok(false); });
  });
}

// ---- repère « base en service » : <base>.en-service, contenant le numéro du processus serveur ----
const repere = base => base + '.en-service';
function poserRepere(base){
  const f = repere(base);
  try { fs.writeFileSync(f, String(process.pid)); } catch(e){ return () => {}; }
  let retire = false;
  const retirer = () => { if (retire) return; retire = true; try { if (fs.readFileSync(f, 'utf8').trim() === String(process.pid)) fs.rmSync(f, { force: true }); } catch(e){} };
  process.on('exit', retirer);
  return retirer;
}
// numéro du processus qui a la base ouverte, ou null (pas de repère, ou processus disparu : arrêt brutal)
function baseEnService(base){
  let pid;
  try { pid = Number(fs.readFileSync(repere(base), 'utf8').trim()); } catch(e){ return null; }
  if (!Number.isInteger(pid) || pid <= 0 || pid === process.pid) return null;
  try { process.kill(pid, 0); return pid; } catch(e){ return e.code === 'EPERM' ? pid : null; }
}

module.exports = { verifierNode, tairesExperimental, PORT, DOSSIER, BASE, SAUVEGARDES, repond, poserRepere, baseEnService, repere };
