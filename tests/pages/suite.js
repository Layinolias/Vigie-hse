// Tests des pages (jsdom) : lance chaque tests/pages/test-*.js et en donne le bilan, une ligne par test.
//   node tests/pages/suite.js                    tous les tests
//   node tests/pages/suite.js contexte menu      ceux dont le nom contient « contexte » ou « menu »
//   node tests/pages/suite.js --parallele 1      un à la fois (3 par défaut)
// Prérequis : npm install dans tests/ (jsdom). Les pages sont celles du dépôt (ou de RACINE=<dossier>).
// Code de sortie 0 si tous les tests passent, 1 sinon (un test qui plante sans bilan compte comme un échec).
'use strict';
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');

const ICI = __dirname;
try { require.resolve('jsdom', { paths: [ICI] }); }
catch (e) { console.error('jsdom est absent : lancer « npm install » dans le dossier tests/ (tests/LISEZ-MOI.md).'); process.exit(2); }

const args = process.argv.slice(2);
let parallele = 3;
const i = args.indexOf('--parallele');
if (i >= 0) { parallele = Math.max(1, Number(args[i + 1]) || 1); args.splice(i, 2); }
const tous = fs.readdirSync(ICI).filter(f => /^test-.*\.js$/.test(f)).sort();
const choisis = args.length ? tous.filter(f => args.some(a => f.includes(a))) : tous;
if (!choisis.length) { console.error('Aucun test ne correspond à : ' + args.join(', ')); process.exit(2); }

const DUREE_MAX = 10 * 60 * 1000;
function lancer(f) {
  return new Promise(resolve => {
    const debut = Date.now();
    const p = spawn(process.execPath, [path.join(ICI, f)], { cwd: path.resolve(ICI, '../..'), env: process.env });
    let sortie = '';
    p.stdout.on('data', d => { sortie += d; });
    p.stderr.on('data', d => { sortie += d; });
    const minuterie = setTimeout(() => { sortie += '\n(arrêté : plus de 10 minutes)'; p.kill(); }, DUREE_MAX);
    p.on('close', code => {
      clearTimeout(minuterie);
      const b = /(\d+) OK, (\d+) KO\s*$/m.exec(sortie.split('\n').filter(l => /\d+ OK, \d+ KO/.test(l)).pop() || '');
      resolve({ f, code, ok: b ? Number(b[1]) : 0, ko: b ? Number(b[2]) : 0, bilan: !!b, sortie, s: Math.round((Date.now() - debut) / 1000) });
    });
  });
}

(async () => {
  console.log(`Tests des pages : ${choisis.length} test${choisis.length > 1 ? 's' : ''}, ${parallele} à la fois\n`);
  const resultats = new Array(choisis.length);
  let suivant = 0, affiche = 0;
  const afficher = () => {
    while (affiche < resultats.length && resultats[affiche]) {
      const r = resultats[affiche++], echec = !r.bilan || r.ko || r.code;
      console.log(`${echec ? 'KO ' : 'OK '} ${r.f.replace(/\.js$/, '')} : ${r.bilan ? `${r.ok} OK, ${r.ko} KO` : 'pas de bilan (planté)'} (${r.s} s)`);
      if (echec) {
        const lignes = r.sortie.split('\n');
        const kos = lignes.filter(l => /^KO /.test(l)).slice(0, 10);
        (kos.length ? kos : lignes.filter(Boolean).slice(-15)).forEach(l => console.log('      ' + l.slice(0, 400)));
      }
    }
  };
  const travailleur = async () => {
    while (suivant < choisis.length) {
      const k = suivant++;
      resultats[k] = await lancer(choisis[k]);
      afficher();
    }
  };
  await Promise.all(Array.from({ length: Math.min(parallele, choisis.length) }, travailleur));
  const echecs = resultats.filter(r => !r.bilan || r.ko || r.code);
  const ok = resultats.reduce((n, r) => n + r.ok, 0), ko = resultats.reduce((n, r) => n + r.ko, 0);
  console.log(`\nBilan : ${ok} contrôles OK, ${ko} KO — ${resultats.length - echecs.length} / ${resultats.length} tests passés${echecs.length ? ' ; en échec : ' + echecs.map(r => r.f.replace(/\.js$/, '')).join(', ') : ''}.`);
  process.exit(echecs.length ? 1 : 0);
})();
