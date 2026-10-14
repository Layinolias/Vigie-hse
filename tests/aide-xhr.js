// Aide du harnais (tests/harnais-serveur.js) : la requête HTTP d'un XMLHttpRequest synchrone de page, faite
// dans un processus à part pour que la page puisse l'attendre. Le XMLHttpRequest synchrone de jsdom mêle les
// cookies des fenêtres ouvertes (toutes les écritures arrivaient au nom du dernier connecté) : ici, chaque
// requête porte les cookies du pot de sa page, et rien d'autre.
// Entrée (stdin) : { methode, url, entetes, corps } ; sortie (stdout) : { statut, entetes, corps }.
'use strict';
const http = require('http');
let entree = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => { entree += d; });
process.stdin.on('end', () => {
  const q = JSON.parse(entree), u = new URL(q.url);
  const r = http.request({ host: '127.0.0.1', port: u.port, method: q.methode, path: u.pathname + u.search, headers: Object.assign({ Host: u.host }, q.entetes) }, rep => {
    const m = [];
    rep.on('data', d => m.push(d));
    rep.on('end', () => process.stdout.write(JSON.stringify({ statut: rep.statusCode, entetes: rep.headers, corps: Buffer.concat(m).toString('utf8') })));
  });
  r.on('error', () => process.stdout.write(JSON.stringify({ statut: 0, entetes: {}, corps: '' })));
  if (q.corps != null) r.write(q.corps);
  r.end();
});
