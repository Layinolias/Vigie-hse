// Harnais jsdom partagé : ouvrir une page du dépôt avec une session et un stockage donnés.
//   const H = require('./harnais.js'); const p = await H.page('objectifs.html', SESSION, stock, '?ouvrir=x');
process.env.TZ = process.env.TZ || 'Pacific/Auckland';
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const XLSX = require('../../assets/xlsx.full.min.js');
const ROOT = (process.env.RACINE || require('path').resolve(__dirname, '../..')).replace(/\\/g, '/').replace(/\/?$/, '/');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function page(fichier, session, stock, query, avant){
  const html = fs.readFileSync(ROOT + fichier, 'utf8');
  const vc = new VirtualConsole(); const erreurs = []; let navigation = false;
  vc.on('jsdomError', e => { const m = String(e && e.message || e); if (/navigation/.test(m)) navigation = true; if (!/Not implemented|Could not load/.test(m)) erreurs.push(m.split('\n')[0].slice(0, 160)); });
  const dom = new JSDOM(html, { runScripts:'outside-only', pretendToBeVisual:true, virtualConsole:vc, url:'https://layinolias.github.io/Vigie-hse/' + fichier + (query || '') });
  const w = dom.window;
  for (const [k, v] of Object.entries(stock || {})) w.localStorage.setItem(k, v);
  if (session) w.sessionStorage.setItem('vigie_hse_session', JSON.stringify(session));
  w.fetch = (process.env.FICHIERS || (avant && avant.fichiers)) ? (u) => { const r = String(u).replace(/^https?:\/\/[^/]+\/Vigie-hse\//, '').split('?')[0]; let b; try { b = fs.readFileSync(ROOT + decodeURIComponent(r)); } catch(e){ return Promise.resolve({ ok:false, status:404 }); } return Promise.resolve({ ok:true, status:200, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.length), text: async () => b.toString('utf8'), json: async () => JSON.parse(b.toString('utf8')) }); } : () => Promise.reject(new TypeError('hors réseau'));
  const ecrits = [], alertes = [];
  w.XLSX = Object.assign({}, XLSX, { writeFile: (wb, nom) => ecrits.push({ wb, nom }), writeFileXLSX: () => {} });
  w.alert = (m) => alertes.push(m); w.confirm = () => true; w.print = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {}; w.scrollTo = () => {}; w.setInterval = () => 0;
  if (typeof avant === "function") avant(w);
  for (const m of html.matchAll(/<script src="(assets\/(?!xlsx\.)[^"]+)"><\/script>/g)) w.eval(fs.readFileSync(ROOT + m[1], 'utf8'));
  for (const s of [...w.document.querySelectorAll('script')].filter(s => !s.src)){ try { w.eval(s.textContent); } catch(e){ erreurs.push('sync : ' + e.message); } }
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  await sleep(40);
  const d = w.document, $ = id => d.getElementById(id);
  const ev = (el, t) => el.dispatchEvent(new w.Event(t, { bubbles:true, cancelable:true }));
  const lire = k => JSON.parse(w.localStorage.getItem(k) || 'null');
  const stockage = () => { const o = {}; for (let i = 0; i < w.localStorage.length; i++){ const k = w.localStorage.key(i); o[k] = w.localStorage.getItem(k); } return o; };
  const choisir = (id, v) => { $(id).value = v; ev($(id), 'change'); };
  return { w, d, $, ev, lire, stockage, choisir, erreurs, ecrits, alertes, navigation: () => navigation };
}

function bilan(){
  const results = [];
  const check = (label, cond, info) => results.push({ label, ok: !!cond, info });
  const fin = () => {
    let ok = 0, ko = 0;
    for (const r of results){ console.log((r.ok ? 'OK  ' : 'KO  ') + r.label + (r.ok ? '' : '  → ' + JSON.stringify(r.info))); r.ok ? ok++ : ko++; }
    console.log(`\n${ok} OK, ${ko} KO`);
    process.exit(ko ? 1 : 0);
  };
  return { check, fin };
}

module.exports = { page, bilan, sleep, ROOT, XLSX, visible: el => !!el && el.style.display !== 'none' };
