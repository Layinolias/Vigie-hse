// Avant de remettre un paquet (Documentation/LIVRAISON-POSTE.md) : les quatre tests, dans l'ordre, et leur bilan.
//   node tests/avant-livraison.js [--brouillon] [<commit>…]
// Sans commit donné, la mise à jour est essayée depuis chaque paquet du tableau de LIVRAISON-POSTE.md qui n'a pas
// été remplacé (remis, ou à remettre) : aucun utilisateur ne doit perdre ses données, quel que soit son paquet.
'use strict';
const fs = require('fs'), path = require('path');
const { spawnSync } = require('child_process');
const DEPOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const brouillon = args.includes('--brouillon');
let commits = args.filter(a => !a.startsWith('--'));
if (!commits.length){
  const doc = fs.readFileSync(path.join(DEPOT, 'Documentation', 'LIVRAISON-POSTE.md'), 'utf8');
  for (const l of doc.split(/\r?\n/)){
    const m = /^\| \d{4}-\d{2}-\d{2} \| `([0-9a-f]{7,40})` \| ([^|]*)\|/.exec(l);
    if (m && !/^\s*remplacé/i.test(m[2]) && !commits.includes(m[1])) commits.push(m[1]);
  }
}
const etapes = [
  ['Mise à jour depuis ' + (commits.join(', ') || '(aucun paquet)'), ['test-mise-a-jour.js'].concat(commits)],
  ['Paquet', ['test-paquet.js'].concat(brouillon ? ['--brouillon'] : [])],
  ['Restauration', ['test-restauration.js']],
  ['Copie des sauvegardes hors du disque', ['test-copie-sauvegardes.js']],
  ['Sécurité des comptes', ['test-securite.js']],
].filter(e => e[1].length > 1 || e[1][0] !== 'test-mise-a-jour.js');

const bilan = [];
for (const [nom, a] of etapes){
  console.log('\n######## ' + nom + '\n');
  const debut = Date.now();
  const r = spawnSync(process.execPath, [path.join(__dirname, a[0])].concat(a.slice(1)), { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8', cwd: DEPOT, maxBuffer: 64 * 1024 * 1024 });
  process.stdout.write(r.stdout || '');
  const ligne = ((r.stdout || '').match(/: \d+ OK, \d+ KO\s*$/m) || ['(pas de bilan)'])[0].replace(/^: /, '').trim();
  bilan.push({ nom, code: r.status, ligne, secondes: Math.round((Date.now() - debut) / 1000) });
}
console.log('\n######## Bilan\n');
for (const b of bilan) console.log((b.code === 0 ? 'OK  ' : 'KO  ') + b.nom + ' : ' + b.ligne + ' (' + b.secondes + ' s)');
const echec = bilan.some(b => b.code !== 0);
console.log(echec ? '\nNe pas remettre ce paquet.' : '\nTout est passé : le paquet peut être remis (noter sa version dans LIVRAISON-POSTE.md).');
process.exit(echec ? 1 : 0);
