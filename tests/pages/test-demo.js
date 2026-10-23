// Données de démonstration des modules sans fichier Excel (assets/demo.js, DATATEST/13-DEMO-modules.json) :
// chargées à la connexion sur le site de démonstration, sans rien remplacer, dates relatives au jour ; puis chaque
// page de l'histoire de démonstration s'ouvre sans erreur et montre ses données.
const H = require('./harnais.js');
const fs = require('fs');
const { check, fin } = H.bilan();
const ADMIN = { user:'admin@verchamps.fr', role:'admin', email:'admin@verchamps.fr', services:['*'], modulePermissions:{} };
const AG1 = { user:'AG1', role:'ag', email:'ag1@verchamps.fr', services:['*'], modulePermissions:{} };
const FICHIERS = { fichiers: true };
const JEU = JSON.parse(fs.readFileSync(H.ROOT + 'DATATEST/13-DEMO-modules.json', 'utf8'));
const CLES = Object.keys(JEU).filter(k => k.startsWith('vigie_hse_'));
const tout = w => { const s = {}; for (let i = 0; i < w.localStorage.length; i++){ const k = w.localStorage.key(i); s[k] = w.localStorage.getItem(k); } return s; };

(async () => {
  // ---------- 1. le fichier : chaque clé est un registre connu, identifiants uniques et stables ----------
  const p0 = await H.page('login.html', null, {}, '', FICHIERS);
  const w0 = p0.w;
  check('chaque clé du fichier est un registre « données » de VigieStore.CLES', CLES.length >= 14 && CLES.every(k => w0.VigieStore.CLES[k] && w0.VigieStore.CLES[k].nature === 'donnees'), CLES.filter(k => !w0.VigieStore.CLES[k]));
  const ids = CLES.flatMap(k => JEU[k].map(r => k + '/' + r.id));
  check('chaque enregistrement a un identifiant, unique dans son registre', JEU[CLES[0]].length && CLES.every(k => JEU[k].every(r => r.id)) && new Set(ids).size === ids.length);

  // ---------- 2. le chargement ----------
  w0.localStorage.setItem('vigie_hse_signalements', JSON.stringify([{ id: 'sig-demo-1', lieu: 'Saisi par la personne', date: '2026-01-01' }, { id: 'perso-1', lieu: 'Le sien' }]));
  const n1 = await w0.VigieDemo.charger();
  const sig = JSON.parse(w0.localStorage.getItem('vigie_hse_signalements'));
  const total = CLES.reduce((s, k) => s + JEU[k].length, 0);
  check('chargé : tout ce qui manquait est ajouté', n1 === total - 1, { n1, total });
  check('un enregistrement déjà présent (même identifiant) n\'est pas remplacé, le reste est gardé',
    sig.find(s => s.id === 'sig-demo-1').lieu === 'Saisi par la personne' && sig.some(s => s.id === 'perso-1') && sig.filter(s => s.id === 'sig-demo-1').length === 1);
  const n2 = await w0.VigieDemo.charger();
  check('rechargé : rien n\'est ajouté deux fois', n2 === 0 && JSON.parse(w0.localStorage.getItem('vigie_hse_signalements')).length === JEU.vigie_hse_signalements.length + 1, n2);
  const ajd = new Date(), il = n => { const d = new Date(ajd); d.setDate(d.getDate() + n); return w0.VigieDates.iso(d); };
  const s2 = sig.find(s => s.id === 'sig-demo-2'), pol = JSON.parse(w0.localStorage.getItem('vigie_hse_politiques'))[0];
  const rd = JSON.parse(w0.localStorage.getItem('vigie_hse_revues_direction'))[0];
  check('dates relatives : « J-2 » est l\'avant-veille à l\'heure locale, « J+300 » dans 300 jours, l\'horodatage un vrai horodatage',
    s2.date === il(-2) && pol.prochaineRevue === il(300) && !isNaN(new Date(s2.dateCreation)) && /Z$/.test(s2.dateCreation), { date: s2.date, attendu: il(-2), creation: s2.dateCreation });
  check('années relatives : « {A-1} » est l\'année passée, « {A} » dans un texte remplacé aussi',
    rd.periodeDebut === (ajd.getFullYear() - 1) + '-01-01' && rd.dateRevue === ajd.getFullYear() + '-02-10'
    && JSON.parse(w0.localStorage.getItem('vigie_hse_actions')).find(a => a.id === 'pa-rd-rd-demo-1-d1').titre === 'Revue de direction du 10/02/' + ajd.getFullYear());
  const brut = JSON.stringify(tout(w0));
  check('plus aucun jeton de date ni d\'année dans ce qui est enregistré', !/"J([+-]\d+)?(T\d\d:\d\d)?"|\{A([+-]\d+)?\}/.test(brut));

  // registre d'une autre forme (pas un tableau) : laissé tel quel ; fichier absent : la connexion continue
  const w1 = (await H.page('login.html', null, { vigie_hse_news: '{"x":1}' }, '', FICHIERS)).w;
  await w1.VigieDemo.charger();
  check('un registre qui n\'est pas une liste n\'est pas touché', w1.localStorage.getItem('vigie_hse_news') === '{"x":1}');
  const w2 = (await H.page('login.html', null, {}, '')).w;   // sans fichiers servis
  check('fichier introuvable : la promesse se résout à 0, rien n\'est écrit', (await w2.VigieDemo.charger()) === 0 && !w2.localStorage.getItem('vigie_hse_signalements'));
  const w3 = (await H.page('login.html', null, {}, '', FICHIERS)).w;
  w3.VigieStore.mode = () => 'serveur';
  check('mode serveur : rien n\'est chargé', (await w3.VigieDemo.charger()) === 0 && !w3.localStorage.getItem('vigie_hse_signalements'));

  // ---------- 3. la connexion de démonstration charge les données avant d'ouvrir le tableau de bord ----------
  const p4 = await H.page('login.html', null, {}, '', FICHIERS);
  p4.$('username').value = 'admin@verchamps.fr'; p4.$('password').value = 'admin1234';
  p4.ev(p4.$('loginForm'), 'submit');
  for (let i = 0; i < 40 && !p4.w.localStorage.getItem('vigie_hse_objectifs'); i++) await H.sleep(50);
  check('connexion de démonstration : données chargées, session ouverte, sans erreur',
    JSON.parse(p4.w.localStorage.getItem('vigie_hse_objectifs') || '[]').length === JEU.vigie_hse_objectifs.length && p4.w.sessionStorage.getItem('vigie_hse_session') && !p4.erreurs.length, p4.erreurs);

  // ---------- 4. les pages de l'histoire, avec les fichiers Excel de démonstration chargés avant ----------
  let stock = tout(w0);
  for (const pre of ['registre-at-mp.html', 'document-unique.html']){
    const p = await H.page(pre, ADMIN, stock, '', FICHIERS); await H.sleep(1500); stock = tout(p.w);
  }
  const PAGES = [
    ['signalements.html', 'Rue Pasteur, tranchée'], ['plan-actions.html', 'Débroussailleuses à batterie'], ['accident-analyse.html', 'Girard Camille 2026-01-22 Accident de travail Propreté de la Ville Arbre des causes Faite'],
    ['objectifs.html', 'Faire remonter au moins 20 presque-accidents'], ['politique-sante-securite.html', 'Claire Vasseur'],
    ['revue-direction.html', 'Revue de direction'], ['conformite.html', 'R4224-15'], ['audit-interne.html', 'Maîtrise des risques dans les services techniques'],
    ['roles-prevention.html', 'Julien Morel'], ['contexte.html', 'Fusion des deux équipes de propreté'], ['communication.html', "Courrier de l'assureur"],
    ['engagement-direction.html', '12 000 €'], ['preparation-iso.html', 'Préparation'], ['reporting.html', 'Presque'],
  ];
  for (const [pg, texte] of PAGES){
    const p = await H.page(pg, ADMIN, stock, '', FICHIERS); await H.sleep(300);
    check(pg + ' : s\'ouvre sans erreur et montre les données de démonstration', !p.erreurs.length && p.d.body.textContent.replace(/\s+/g, ' ').includes(texte), { erreurs: p.erreurs, texte });
    if (pg === 'plan-actions.html'){
      const a = JSON.parse(p.w.localStorage.getItem('vigie_hse_actions'));
      const de = id => a.find(x => x.id === id) || {};
      check('Plan d\'actions : les actions des modules arrivent, et la version enregistrée (faite, efficace) l\'emporte sur celle qu\'il en tire',
        de('pa-sig-sig-demo-4-a1').statut === 'En cours' && de('pa-analyse-ana-dtst-atmp-22-a1').efficacite === 'Efficace' && de('pa-rd-rd-demo-1-d1').statut === 'Fait'
        && a.some(x => x.origine === 'Conformité') && a.some(x => x.origine === 'Audit interne') && a.some(x => x.origine === 'Objectif') && a.some(x => x.origine === 'Risques et opportunités'),
        a.filter(x => /demo/.test(x.id)).map(x => x.id + ':' + x.statut));
      stock = tout(p.w);
    }
  }
  const pa = await H.page('dashboard.html', ADMIN, stock, '', FICHIERS); await H.sleep(300);
  check('tableau de bord de l\'administrateur : rappel de la politique à lire, Flash Info de démonstration, sans erreur',
    H.visible(pa.$('politiqueRappel')) && pa.d.body.textContent.includes('merci pour vos signalements') && !pa.erreurs.length, pa.erreurs);
  const pg = await H.page('signalements.html', AG1, stock, '', FICHIERS); await H.sleep(300);
  check('un agent voit ses propres signalements de démonstration, pas ceux des autres', !pg.erreurs.length && pg.d.body.textContent.includes('Cuisine centrale, plonge') && !pg.d.body.textContent.includes('Rue Pasteur'), pg.erreurs);
  fin();
})();
