// Menu latéral sur toutes les pages à menu, et droits avant / après une modification du catalogue.
//   node tests/pages/test-menu-pages.js [<commit de référence>]   (défaut : origin/main, sinon HEAD)
// 1. Chaque page à menu s'ouvre sans erreur pour le Préventeur, et son menu a les mêmes liens que celui du tableau de bord.
// 2. Pour chaque profil préréglé et chaque module × niveau, VigieDroits du commit de référence et de la copie de travail
//    donnent la même réponse — sauf pour les modules absents du commit de référence (les modules nouveaux).
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const fs = require('fs'), { execFileSync } = require('child_process');
const ROOT = H.ROOT;
const GIT = process.platform === 'win32' && fs.existsSync('C:\\Program Files\\Git\\cmd\\git.exe') ? 'C:\\Program Files\\Git\\cmd\\git.exe' : 'git';
const existe = (ref) => { try { execFileSync(GIT, ['-C', ROOT, 'rev-parse', '--verify', '--quiet', ref], { stdio: 'ignore' }); return true; } catch (e) { return false; } };
// la branche principale publiée : sur une branche de travail, ce qu'elle change ; sur main à jour, rien
const REF = process.argv[2] || (existe('origin/main') ? 'origin/main' : 'HEAD');
const PREV = { user:'PREV1', role:'ag', email:'PREV1', services:['*'], profils:['p-agent', 'p-preventeur'] };

(async () => {
  // ---------- 1. Menu sur chaque page ----------
  const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && /VigieMenu\.init\(/.test(fs.readFileSync(ROOT + f, 'utf8')));
  const d = await H.page('dashboard.html', PREV, {});
  const liens = (p) => [...p.d.querySelectorAll('nav a[href]')].map(a => a.getAttribute('href')).sort().join('|');
  const attendu = liens(d);
  check(`${pages.length} pages à menu (tableau de bord compris), menu du tableau de bord non vide`, pages.length >= 30 && attendu.split('|').length >= 20, { n: pages.length, attendu });
  const ecarts = [];
  for (const f of pages) {
    const p = await H.page(f, PREV, {});
    if (p.navigation()) continue;   // page fermée à ce compte : renvoyé au tableau de bord
    if (p.erreurs.length) ecarts.push(f + ' : ' + p.erreurs[0]);
    else if (liens(p) !== attendu) ecarts.push(f + ' : menu différent');
  }
  check('chaque page ouverte au Préventeur : sans erreur, même menu que le tableau de bord', !ecarts.length, ecarts);

  // ---------- 2. Droits avant / après ----------
  const avant = execFileSync(GIT, ['-C', ROOT, 'show', REF + ':assets/droits.js'], { encoding: 'utf8' });
  const charger = (src) => { const w = {}; new Function('window', src)(w); return w.VigieDroits; };
  const A = charger(avant), B = charger(fs.readFileSync(ROOT + 'assets/droits.js', 'utf8'));
  const nouveaux = B.MODULES.filter(m => !A.MODULES.some(x => x.id === m.id)).map(m => m.id);
  const profils = ['p-admin', 'p-rh', 'p-manager', 'p-agent', 'p-preventeur', 'p-representant'];
  const diffs = [];
  for (const pr of profils) {
    const sa = A.pour({ user:'x', profils:[pr], services:['*'] }), sb = B.pour({ user:'x', profils:[pr], services:['*'] });
    for (const m of A.MODULES) for (const n of m.niveaux) if (sa.peut(m.id, n) !== sb.peut(m.id, n)) diffs.push(`${pr} ${m.id} ${n} : ${sa.peut(m.id, n)} → ${sb.peut(m.id, n)}`);
  }
  check(`droits des modules existants inchangés depuis ${REF} pour les 6 profils préréglés (modules nouveaux : ${nouveaux.join(', ') || 'aucun'})`, !diffs.length, diffs);
  // anciens rôles (sans profils) : même résultat
  const anciens = ['admin', 'rh', 'manager', 'ag'].map(r => ({ user:'x', role:r, services:['*'], modulePermissions:{} }));
  const diffs2 = [];
  for (const s of anciens) { const sa = A.pour(s), sb = B.pour(s); for (const m of A.MODULES) for (const n of m.niveaux) if (sa.peut(m.id, n) !== sb.peut(m.id, n)) diffs2.push(`${s.role} ${m.id} ${n}`); }
  check('comptes à rôle (sans profils) : droits des modules existants inchangés', !diffs2.length, diffs2);
  fin();
})().catch(e => { console.error(e); process.exit(2); });
