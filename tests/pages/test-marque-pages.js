// Marque blanche sur les 26 pages (mode navigateur) : avec une marque réglée, chaque page montre le nom, la signature,
// le logo et les couleurs réglés — et plus un seul « VIGIE HSE » / « Soft Tech » dans son texte visible.
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const results = [];
const check = (label, cond, info) => { results.push({ label, ok: !!cond }); console.log((cond ? 'OK  ' : 'KO  ') + label + (cond ? '' : '  → ' + info)); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const RACINE = (process.env.RACINE || require('path').resolve(__dirname, '../..')) + '/';
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const MARQUE = { nom: 'Acme Sécurité', signature: 'Groupe Acme', logo: PNG, couleur: '#1a2b3c', couleur2: '#ffaa00' };
const mkX = () => ({ read:()=>({SheetNames:[],Sheets:{}}), utils:{ sheet_to_json:()=>[], json_to_sheet:(rows, o)=>({ rows, header: o && o.header }), book_new:()=>({ feuilles: [] }), book_append_sheet:()=>{}, aoa_to_sheet:()=>({}), decode_range:()=>({s:{r:0,c:0},e:{r:0,c:0}}) }, writeFile:()=>{}, write:()=>'' });
const SESSION = { user: 'admin@verchamps.fr', role: 'admin', email: 'admin@verchamps.fr', services: ['*'], modulePermissions: {} };
const SANS_SESSION = ['login.html', 'index.html'];

async function ouvrir(page, marque){
  const html = fs.readFileSync(RACINE + page, 'utf8');
  const erreurs = [];
  const vc = new VirtualConsole(); vc.on('jsdomError', e => erreurs.push(String(e.message || e)));
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc, url: 'https://layinolias.github.io/Vigie-hse/' + page });
  const w = dom.window;
  w.localStorage.setItem('vigie_hse_dataset', '[]');
  if (marque) w.localStorage.setItem('vigie_hse_referentials', JSON.stringify({ marque }));
  if (!SANS_SESSION.includes(page)) w.sessionStorage.setItem('vigie_hse_session', JSON.stringify(SESSION));
  w.claude = { use: () => Promise.resolve(null) }; w.fetch = () => Promise.reject(new Error('x')); w.XLSX = mkX();
  w.alert = () => {}; w.confirm = () => true; w.HTMLElement.prototype.scrollIntoView = () => {}; w.print = () => {};
  [...html.matchAll(/<script src="(assets\/(?!xlsx\.)[^"]+)"><\/script>/g)].forEach(m => { try { w.eval(fs.readFileSync(RACINE + m[1], 'utf8')); } catch(e){ erreurs.push(m[1] + ' : ' + e.message); } });
  for (const s of [...w.document.querySelectorAll('script')].filter(s => !s.src)){ try { w.eval(s.textContent); } catch(e){ erreurs.push(e.message); } }
  await sleep(60); w.__erreurs = erreurs; return w;
}
// texte visible : le corps sans scripts, styles ni commentaires
function texteVisible(d){
  const c = d.body.cloneNode(true);
  c.querySelectorAll('script,style,template,noscript').forEach(e => e.remove());
  return c.textContent.replace(/\s+/g, ' ');
}

(async () => {
  const pages = fs.readdirSync(RACINE).filter(x => x.endsWith('.html')).sort();
  check(pages.length + ' pages à vérifier', pages.length === 39, pages.length);
  let defauts = 0, avecMarque = 0;
  for (const page of pages){
    // marque d'origine : la page n'est pas touchée
    let w = await ouvrir(page, null);
    const d0 = w.document;
    const intacte = !d0.getElementById('vigie-marque-style') && !d0.getElementById('vigie-marque-masque') && !d0.querySelector('.brand-mark img');
    if (intacte) defauts++; else check(page + ' : marque d\'origine → page intacte', false, 'feuille ou logo ajoutés');
    w.close();

    // marque réglée
    w = await ouvrir(page, MARQUE);
    const d = w.document, problemes = [];
    d.querySelectorAll('.brand-name,.brand-title,.dash-brand,.print-brand,[data-marque="nom"]').forEach(e => { if (e.textContent !== MARQUE.nom) problemes.push('nom « ' + e.textContent + ' »'); });
    d.querySelectorAll('.brand-tag').forEach(e => { if (e.textContent !== MARQUE.signature) problemes.push('signature « ' + e.textContent + ' »'); });
    const marks = d.querySelectorAll('.brand-mark');
    marks.forEach(e => { const im = e.querySelector('img'); if (!im || im.src !== PNG) problemes.push('logo absent'); });
    const style = d.getElementById('vigie-marque-style');
    if (!style || !/--accent:#1a2b3c/.test(style.textContent) || !/--accent-violet:#ffaa00/.test(style.textContent)) problemes.push('feuille de couleurs absente ou incomplète');
    if (d.getElementById('vigie-marque-masque')) problemes.push('masque resté posé');
    const brut = texteVisible(d).replace(/Lancer VIGIE HSE\.bat/g, '');
    if (/VIGIE\s*HSE/i.test(brut)) problemes.push('« VIGIE HSE » encore dans le texte : …' + (brut.match(/.{0,40}VIGIE\s*HSE.{0,40}/i) || [''])[0]);
    if (/Soft Tech/.test(brut)) problemes.push('« Soft Tech » encore dans le texte');
    if (!/Acme Sécurité/.test(d.title)) problemes.push('titre d\'onglet « ' + d.title + ' »');
    if (w.__erreurs.length) problemes.push('erreurs : ' + w.__erreurs.slice(0, 2).join(' | '));
    if (!problemes.length) avecMarque++; else check(page + ' avec marque', false, problemes.join(' ; '));
    w.close();
  }
  check('marque d\'origine : les ' + pages.length + ' pages sont intactes (aucune feuille, aucun logo, aucun masque)', defauts === pages.length, defauts);
  check('marque réglée : les ' + pages.length + ' pages montrent le nom, la signature, le logo et les couleurs réglés, sans erreur de script ni nom d\'origine', avecMarque === pages.length, avecMarque);
  const ko = results.filter(r => !r.ok).length;
  console.log('\n' + (results.length - ko) + ' OK, ' + ko + ' KO');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
