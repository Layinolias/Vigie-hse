// Petit serveur statique pour prévisualiser l'application sur http://localhost:8765 (tests uniquement).
// Utile au panneau navigateur de Claude Code : un fichier .html ouvert directement y est rendu sans
// stockage, donc sans session possible ; servi en http, il se comporte comme le site en ligne.
// Lancé par .claude/launch.json (configuration « vigie-local »), ou à la main :
//   node Documentation/outils/serveur-local.js
const http = require('http'), fs = require('fs'), path = require('path');
const RACINE = path.resolve(__dirname, '..', '..');
const PORT = Number(process.env.PORT) || 8765;
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.ico':'image/x-icon',
  '.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.md':'text/plain; charset=utf-8' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(RACINE, path.normalize(p).replace(/^([\\/])+/, ''));
  if (!f.startsWith(RACINE)) { res.writeHead(403); return res.end(); }   // pas de sortie du dossier du projet
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => console.log('VIGIE HSE en local : http://localhost:' + PORT));
