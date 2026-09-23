// Génère le kit de reprise des données (KIT-REPRISE/) : un modèle Excel par module importable, dans
// l'ordre où un nouveau client doit les charger, et Documentation/KIT-REPRISE-DONNEES.md.
//
// Chaque modèle est l'EXPORT RÉEL du module (mêmes feuilles, mêmes colonnes : un aller-retour
// export → import a été vérifié sans perte), avec :
//   - la ou les feuilles de données VIDES en premier (c'est elle que l'import lit) ;
//   - une feuille « Exemple » par feuille de données (quelques lignes fictives, jamais importées) ;
//   - une feuille « Consignes » : pour chaque colonne, obligatoire ou non, format, valeurs.
// Les consignes ne sont pas écrites à la main : elles sont MESURÉES en important dans la vraie page
// (jsdom) — colonne vidée : les lignes sont-elles refusées ? valeur inconnue : gardée, remplacée ou
// refusée ? — pour qu'elles ne puissent pas diverger du code.
//
// Usage (depuis la racine du dépôt) : npm install jsdom xlsx (hors dépôt, ou NODE_PATH), puis
//   node Documentation/outils/generer-kit-reprise.js
process.env.TZ = 'Europe/Paris';
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const XLSX = require('xlsx');
const ROOT = path.join(__dirname, '..', '..') + path.sep;
const SORTIE = path.join(ROOT, 'KIT-REPRISE');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{ 'atmp-admin':'write','atmp-declare':'write','accident-analyse':'write','urgences':'write' } };
const EXEMPLES = 3;          // lignes d'exemple par feuille
const INCONNUE = 'ZZ-valeur-inconnue';

let courantes = [];
process.on('unhandledRejection', r => courantes.push('promesse : ' + (r && r.message || r)));
process.on('uncaughtException', e => courantes.push('exception : ' + (e && e.message || e)));
function fetchDisque(url){
  const u = String(url).split('?')[0];
  if (/^DATATEST\//.test(u) && fs.existsSync(ROOT + u)){
    const b = fs.readFileSync(ROOT + u);
    return Promise.resolve({ ok:true, arrayBuffer: () => Promise.resolve(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)) });
  }
  return Promise.reject(new TypeError('hors réseau'));
}
async function charger(page, { datatest = true, stockage = null, attente = 700 } = {}){
  const errs = []; courantes = errs;
  const html = fs.readFileSync(ROOT + page, 'utf8');
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String(e && e.message || e); if (!/Not implemented|Could not load/.test(m)) errs.push(m.split('\n')[0]); });
  const w = new JSDOM(html, { runScripts:'outside-only', pretendToBeVisual:true, virtualConsole:vc, url:'https://layinolias.github.io/Vigie-hse/' + page }).window;
  w.sessionStorage.setItem('vigie_hse_session', JSON.stringify(RH));
  if (stockage) for (const [k, v] of Object.entries(stockage)) w.localStorage.setItem(k, v);
  w.fetch = datatest ? fetchDisque : () => Promise.reject(new TypeError('hors réseau'));
  w.captures = []; w.messages = [];
  // SheetJS tourne dans Node, la page dans jsdom : ArrayBuffer et Date doivent changer de « realm »
  // (dans un navigateur, tout est dans le même — ce n'est qu'une contrainte du générateur)
  const lireXlsx = (d, o) => (d && typeof d === 'object' && typeof d.byteLength === 'number' && !(d instanceof ArrayBuffer))
    ? XLSX.read(Buffer.from(Array.from(new w.Uint8Array(d))), Object.assign({}, o, { type:'buffer' })) : XLSX.read(d, o);
  const versPage = v => (v instanceof Date) ? new w.Date(v.getTime()) : v;
  const utils = Object.assign({}, XLSX.utils, { sheet_to_json: (ws, o) => XLSX.utils.sheet_to_json(ws, o).map(r => Array.isArray(r) ? r.map(versPage) : Object.fromEntries(Object.entries(r).map(([k, v]) => [k, versPage(v)]))) });
  w.XLSX = Object.assign({}, XLSX, { read: lireXlsx, utils, writeFile: wb => w.captures.push(wb) });
  w.claude = { use: () => Promise.resolve(null) };
  w.alert = m => w.messages.push(String(m)); w.confirm = () => true; w.print = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {}; w.scrollTo = () => {}; w.setInterval = () => 0;
  for (const m of html.matchAll(/<script src="(assets\/[^"]+)"><\/script>/g)) w.eval(fs.readFileSync(ROOT + m[1], 'utf8'));
  for (const s of [...w.document.querySelectorAll('script')].filter(s => !s.src)){ try { w.eval(s.textContent); } catch(e){ errs.push('sync : ' + e.message); } }
  await sleep(attente);
  return { w, errs };
}
const lireStock = (w, k) => { try { return JSON.parse(w.localStorage.getItem(k) || '[]'); } catch(e){ return []; } };
const somme = (liste, champ) => liste.reduce((n, r) => n + ((r[champ] || []).length), 0);

// ---------------------------------------------------------------- les modules, dans l'ordre de chargement
// source : comment obtenir le classeur d'exemple ; compter : combien d'éléments l'import a créés, par feuille ;
// prerequis : ce que la page d'import doit déjà contenir (données chargées avant, dans le même ordre).
const EVT = 'vigie_hse_dataset';
const MODULES = [
  { fichier:'01-agents', nom:'Agents (Gestion RH)', page:'gestion-rh.html', exp:'btnExportAgents', imp:'importAgentsFile', ou:'Gestion RH → onglet Agents → Importer .xlsx',
    source:{ stock:{ vigie_hse_agents: [
      { id:'ag-1', nom:'Leroy', prenom:'Anne', collectivite:'Ville', service:'Voirie & Réseaux', managerId:'', dateEntree:'2012-01-09', actif:true },
      { id:'ag-2', nom:'Durand', prenom:'Paul', collectivite:'Ville', service:'Voirie & Réseaux', managerId:'ag-1', dateEntree:'2019-09-02', actif:true },
      { id:'ag-3', nom:'Petit', prenom:'Luc', collectivite:'Agglomération', service:'Collecte & Propreté', managerId:'', dateEntree:'2021-04-12', actif:false } ] } },
    compter:{ Agents: w => lireStock(w, 'vigie_hse_agents').length },
    note:"À charger en premier : les autres modules peuvent ensuite proposer ces agents dans leurs formulaires. Le responsable se désigne par son « Nom Prénom » ; il peut figurer plus bas dans le fichier." },
  { fichier:'02-heures-travaillees', nom:'Heures travaillées (Gestion RH)', page:'gestion-rh.html', exp:'btnExportHeures', imp:'importHeuresFile', ou:'Gestion RH → onglet Heures travaillées → Importer .xlsx',
    source:{ stock:{ vigie_hse_heures_travaillees: [
      { id:'h1', periode:'2026-01', collectivite:'Ville', service:'Voirie & Réseaux', heures:12450 },
      { id:'h2', periode:'2026-02', collectivite:'Ville', service:'Voirie & Réseaux', heures:11980 },
      { id:'h3', periode:'2026-01', collectivite:'Agglomération', service:'Collecte & Propreté', heures:8200 } ] } },
    compter:{ Heures: w => lireStock(w, 'vigie_hse_heures_travaillees').length },
    note:"Un total par mois, collectivité et service (pas un pointage individuel). Alimente le taux de fréquence et de gravité « réels ». Une ligne déjà présente pour le même mois, la même collectivité et le même service est ignorée." },
  { fichier:'03-registre-at-mp', nom:'Registre AT/MP', page:'registre-at-mp.html', exp:'btnExport', imp:'importFile', ou:'Registre AT/MP → Importer .xlsx',
    source:{ datatest:true }, compter:{ 'Registre AT-MP': w => lireStock(w, EVT).length },
    note:"L'historique des accidents du travail et maladies professionnelles. À charger avant les dossiers et les analyses d'accident, qui s'y rattachent." },
  { fichier:'04-dossiers-atmp-citis', nom:'Dossiers AT/MP & CITIS', page:'dossiers-atmp-citis.html', exp:'btnExport', imp:'importFile', ou:'Dossiers AT/MP & CITIS → Importer .xlsx',
    prerequis:[EVT], source:{ atmp:true, stock: ev => ({ vigie_hse_atmp_dossiers: [
      { id:'dos-' + ev[0].id, atmpId: ev[0].id, cmi:{ recu:true, date:'2026-03-02', ref:'CMI-0142' }, prolongations:[{ date:'2026-03-20', ref:'PR-1' }],
        certificatFinal:{ type:'Consolidation', recu:true, date:'2026-04-10', ref:'CF-77' }, ipp:{ applicable:true, taux:'5', date:'2026-05-01', ref:'IPP-3' },
        enquete:{ realisee:true, date:'2026-03-04', conclusions:'Défaut de balisage' }, coutTotal:1200, coutDetail:'Soins 800 + arrêt 400' } ],
      vigie_hse_atmp_arretes: [{ id:'arr-1', atmpId: ev[0].id, type:'Imputabilité', statut:'Signé & Notifié', dateCreation:'2026-03-05', dateTransmission:'2026-03-10', dateSignature:'2026-03-15', autorite:'Maire' }] }) },
    exemplesUtiles:{ Dossiers: r => String(r['CMI reçu']) === 'Oui' },
    compter:{ Dossiers: w => lireStock(w, 'vigie_hse_atmp_dossiers').length, Prolongations: w => somme(lireStock(w, 'vigie_hse_atmp_dossiers'), 'prolongations'), Arretes: w => lireStock(w, 'vigie_hse_atmp_arretes').length },
    note:"Chaque ligne se rattache à un accident déjà présent dans le Registre AT/MP, par sa colonne « ID AT/MP » ou, à défaut, par « Nom » + « Date AT »." },
  { fichier:'05-analyses-accident', nom:'Analyses d\'accident', page:'accident-analyse.html', exp:'btnExport', imp:'importFile', ou:'Analyse d\'accident → Importer .xlsx',
    prerequis:[EVT], source:{ atmp:true, stock: ev => ({ vigie_hse_analyses_accident: [
      { atmpId: ev[0].id, methode:'5 Pourquoi', faits:[], pourquoi:[], ishikawa:{ materiel:[], methode:[], mainOeuvre:[], milieu:[], matiere:[] },
        conclusion:'Fuite de toiture non signalée au service Patrimoine', actions:[{ id:'act-1', description:'Poser un tapis antidérapant à l\'entrée', responsable:'Chef d\'équipe', echeance:'2026-10-15', statut:'En cours' }], dateAnalyse:'2026-09-10', auteur:'RH1' } ] }) },
    exemplesUtiles:{ Analyses: r => r['Statut'] === 'Faite' },
    compter:{ Analyses: w => lireStock(w, 'vigie_hse_analyses_accident').length, Actions: w => somme(lireStock(w, 'vigie_hse_analyses_accident'), 'actions') },
    note:"La méthode, la conclusion et les actions correctives se reprennent ; l'arbre des causes lui-même (faits, « pourquoi », diagramme d'Ishikawa) se ressaisit à l'écran — la page le signale à l'import." },
  { fichier:'06-document-unique', nom:'Document Unique (DUERP)', page:'document-unique.html', exp:'btnExport', imp:'importFile', ou:'Document Unique → Importer .xlsx',
    source:{ datatest:true }, compter:{ EVR: w => lireStock(w, 'vigie_hse_duerp_dataset').length },
    note:"Une ligne par unité de travail et par risque." },
  { fichier:'07-plan-actions', nom:'Plan d\'actions', page:'plan-actions.html', exp:'btnExport', imp:'importFile', ou:'Plan d\'actions → Importer .xlsx',
    source:{ stock:{ vigie_hse_actions: [
      { id:'pa-1', titre:'Remplacer l\'éclairage du parking', description:'Deux lampadaires hors service', collectivite:'Ville', service:'Voirie & Réseaux', risqueLie:'Chute de plain-pied', origine:'Manuel', responsable:'Chef de service', echeance:'2026-11-30', priorite:'Haute', statut:'En cours', dateCreation:'2026-09-01' },
      { id:'pa-2', titre:'Former deux sauveteurs secouristes', description:'', collectivite:'Agglomération', service:'Collecte & Propreté', risqueLie:'', origine:'Manuel', responsable:'RH', echeance:'2027-01-31', priorite:'Moyenne', statut:'À faire', dateCreation:'2026-09-01' } ] } },
    compter:{ "Plan d'Actions": w => lireStock(w, 'vigie_hse_actions').length },
    note:"Les actions saisies à la main. Celles qui découlent du Document Unique, des inspections, des analyses d'accident ou des exercices se créent toutes seules depuis ces modules : inutile de les importer ici." },
  { fichier:'08-registre-sst', nom:'Registre santé et sécurité au travail', page:'registre-sst.html', exp:'btnExport', imp:'importFile', ou:'Registre SST → Importer .xlsx',
    source:{ datatest:true }, compter:{ RSST: w => lireStock(w, 'vigie_hse_rsst').length } },
  { fichier:'09-sante-visites', nom:'Santé & visites médicales', page:'sante-visites.html', exp:'btnExport', imp:'importFile', ou:'Santé & Visites → onglet Suivi → Importer .xlsx',
    source:{ datatest:true }, compter:{ 'Santé & Visites': w => lireStock(w, 'vigie_hse_visites').length },
    note:"Le suivi des visites (dernière visite, périodicité). Les rendez-vous se saisissent dans l'agenda." },
  { fichier:'10-verifications-periodiques', nom:'Vérifications périodiques', page:'verifications-periodiques.html', exp:'btnExport', imp:'importFile', ou:'Vérifications périodiques → Importer .xlsx',
    source:{ datatest:true }, compter:{ 'Vérifications': w => lireStock(w, 'vigie_hse_verifications').length } },
  { fichier:'11-formation-habilitation', nom:'Formation & habilitations', page:'formation-habilitation.html', exp:'btnExport', imp:'importFile', ou:'Formation / Habilitation → Importer .xlsx',
    source:{ datatest:true }, compter:{ Habilitations: w => lireStock(w, 'vigie_hse_habilitations').length } },
  { fichier:'12-produits-chimiques', nom:'Produits chimiques', page:'produits-chimiques.html', exp:'btnExport', imp:'importFile', ou:'Produits chimiques → Importer .xlsx',
    source:{ datatest:true }, compter:{ 'Produits Chimiques': w => lireStock(w, 'vigie_hse_produits_chimiques').length } },
  { fichier:'13-inspection-trames', nom:'Trames d\'inspection', page:'inspection-audit.html', imp:'importTramesFile', ou:'Inspection / Audit → Importer les trames',
    source:{ datatest:true, trames:true }, compter:{ Trames: w => somme(lireStock(w, 'vigie_hse_inspection_trames'), 'points') },
    note:"Une ligne par point de contrôle ; les lignes qui portent le même nom de trame forment une trame. À charger avant les inspections." },
  { fichier:'14-inspections', nom:'Inspections réalisées', page:'inspection-audit.html', exp:'btnExport', imp:'importFile', ou:'Inspection / Audit → Importer .xlsx',
    prerequis:['vigie_hse_inspection_trames'], source:{ datatest:true }, compter:{ Inspections: w => lireStock(w, 'vigie_hse_inspections').length },
    note:"La colonne « Trame » doit reprendre le nom exact d'une trame déjà chargée (fichier 13)." },
  { fichier:'15-urgences-exercices', nom:'Exercices d\'urgence', page:'urgences-exercices.html', exp:'btnExport', imp:'importFile', ou:'Situations d\'urgence → Importer .xlsx',
    source:{ datatest:true, enrichir:{ cle:'vigie_hse_exercices_urgence', f: l => { l[0].actions = [{ id:'act-ex-1', description:"Dégager l'issue de secours côté réserve", responsable:"Chef d'atelier", echeance:'2026-10-31', statut:'En cours' }]; return l; } } },
    compter:{ Exercices: w => lireStock(w, 'vigie_hse_exercices_urgence').length, Actions: w => somme(lireStock(w, 'vigie_hse_exercices_urgence'), 'actions') },
    note:"La périodicité est obligatoire : l'application ne la devine jamais (réponse du préventeur à la question 6)." },
  { fichier:'16-epi-catalogue', nom:'Catalogue des EPI', page:'epi-dotation.html', onglet:'catalogue', exp:'catExport', imp:'catImportFile', ou:'EPI & Dotation → onglet Catalogue → Importer .xlsx',
    source:{ datatest:true }, compter:{ Catalogue: w => lireStock(w, 'vigie_hse_epi_catalogue').length },
    note:"À charger avant les dotations : une dotation désigne un article du catalogue par son nom." },
  { fichier:'17-epi-dotations', nom:'Dotations d\'EPI', page:'epi-dotation.html', onglet:'dotations', exp:'dotExport', imp:'dotImportFile', ou:'EPI & Dotation → onglet Dotations → Importer .xlsx',
    prerequis:['vigie_hse_epi_catalogue'], source:{ datatest:true }, compter:{ Dotations: w => lireStock(w, 'vigie_hse_epi_dotations').length } },
];
const SAISIE_ECRAN = [
  ['Référentiels (services, sites, familles de risque…)', 'Administration → Référentiels', "À faire AVANT tout import : les colonnes « Service » des fichiers doivent reprendre exactement ces libellés."],
  ['Comptes utilisateurs', 'Administration → Utilisateurs', "Créés un par un (ils relèveront de la future authentification)."],
  ['Accueil au poste', 'Accueil au poste', "Pas d'import : les parcours se créent à l'arrivée de chaque agent."],
  ['Entreprises extérieures', 'Entreprises extérieures', "Pas d'import : une fiche par intervention."],
  ['Base documentaire', 'Base documentaire', "Pas d'import : fiches et documents se saisissent à l'écran."],
  ['Stock et lavages des EPI', 'EPI & Dotation', "Pas d'import pour ces deux onglets."],
  ['Rendez-vous médicaux', 'Santé & Visites → Agenda', "Pas d'import : l'agenda démarre à la mise en service."],
];

// ---------------------------------------------------------------- utilitaires classeur
function lignesDe(wb){ const out = {}; for (const sn of wb.SheetNames) out[sn] = XLSX.utils.sheet_to_json(wb.Sheets[sn], { defval:'' }); return out; }
function entetes(wb, sn){ return (XLSX.utils.sheet_to_json(wb.Sheets[sn], { header:1 })[0] || []).map(String); }
function classeur(feuilles, ordre){
  const wb = XLSX.utils.book_new();
  for (const sn of ordre) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(feuilles[sn].lignes, { header: feuilles[sn].entetes }), sn);
  return wb;
}
async function importerDans(m, feuilles, ordre, prerequis){
  const B = await charger(m.page, { datatest:false, stockage: prerequis, attente: 300 });
  if (m.onglet){ const t = B.w.document.querySelector('[data-tab="' + m.onglet + '"]'); if (t) t.click(); }
  const input = B.w.document.getElementById(m.imp);
  const buf = XLSX.write(classeur(feuilles, ordre), { type:'array', bookType:'xlsx' });
  Object.defineProperty(input, 'files', { configurable:true, value:[new B.w.File([buf], 'import.xlsx')] });
  input.dispatchEvent(new B.w.Event('change', { bubbles:true }));
  await sleep(350);
  const comptes = {}; for (const [sn, f] of Object.entries(m.compter)) comptes[sn] = f(B.w);
  let reexport = null;
  if (m.exp){ B.w.document.getElementById(m.exp).click(); reexport = B.w.captures[0] ? lignesDe(B.w.captures[0]) : null; }
  // tout ce qui a été stocké, journaux exclus (ils citent les noms saisis) : sert à voir si une valeur a été gardée
  let dump = '';
  for (let i = 0; i < B.w.localStorage.length; i++){ const k = B.w.localStorage.key(i); if (!/_log$/.test(k)) dump += B.w.localStorage.getItem(k); }
  const res = { comptes, reexport, dump, messages: B.w.messages.slice(), errs: B.errs.slice() };
  B.w.close();
  return res;
}
function formatDe(valeurs){
  const v = valeurs.map(x => String(x).trim()).filter(Boolean);
  if (!v.length) return 'Texte';
  if (v.every(x => /^\d{4}-\d{2}-\d{2}$/.test(x))) return 'Date AAAA-MM-JJ (une date Excel convient aussi)';
  if (v.every(x => /^\d{4}-\d{2}$/.test(x))) return 'Mois AAAA-MM (ou MM/AAAA, ou une date Excel)';
  if (v.every(x => /^(oui|non)$/i.test(x))) return 'Oui / Non';
  if (v.every(x => /^-?\d+([.,]\d+)?$/.test(x))) return 'Nombre';
  return 'Texte';
}

// ---------------------------------------------------------------- génération
(async () => {
  fs.mkdirSync(SORTIE, { recursive:true });
  let DATASET = null;
  const bilan = [];
  for (const m of MODULES){
    process.stdout.write(m.fichier.padEnd(28));
    // 1. classeur source (export réel, ou trames lues dans le stockage)
    if (m.source.atmp && !DATASET){ const r = await charger('registre-at-mp.html'); DATASET = r.w.localStorage.getItem(EVT); r.w.close(); }
    const stockSource = {};
    if (m.source.atmp) stockSource[EVT] = DATASET;
    const s = typeof m.source.stock === 'function' ? m.source.stock(JSON.parse(DATASET)) : (m.source.stock || {});
    for (const [k, v] of Object.entries(s)) stockSource[k] = JSON.stringify(v);
    let A = await charger(m.page, { datatest: !!m.source.datatest, stockage: stockSource });
    if (m.source.enrichir){
      // données de démonstration complétées (ex. une action corrective), rechargées sans DATATEST
      const e = m.source.enrichir, tout = {};
      for (let i = 0; i < A.w.localStorage.length; i++){ const k = A.w.localStorage.key(i); tout[k] = A.w.localStorage.getItem(k); }
      tout[e.cle] = JSON.stringify(e.f(JSON.parse(tout[e.cle] || '[]')));
      A.w.close();
      A = await charger(m.page, { datatest:false, stockage: tout });
    }
    if (m.onglet){ const t = A.w.document.querySelector('[data-tab="' + m.onglet + '"]'); if (t) t.click(); }
    const prerequis = {};
    ['vigie_hse_referentials', ...(m.prerequis || [])].forEach(k => { const v = A.w.localStorage.getItem(k); if (v != null) prerequis[k] = v; });
    let wbSource;
    if (m.source.trames){
      const trames = lireStock(A.w, 'vigie_hse_inspection_trames');
      const lignes = [];
      trames.forEach(t => (t.points || []).forEach(p => lignes.push({ 'Trame': t.nom, 'Point de contrôle': p.libelle, 'Catégorie': p.categorie || '' })));
      wbSource = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wbSource, XLSX.utils.json_to_sheet(lignes, { header:['Trame', 'Point de contrôle', 'Catégorie'] }), 'Trames');
    } else {
      A.w.document.getElementById(m.exp).click();
      wbSource = A.w.captures[0];
    }
    A.w.close();
    const ordre = wbSource.SheetNames.slice();
    const toutes = lignesDe(wbSource);
    const feuilles = {};
    for (const sn of ordre){
      const tri = (m.exemplesUtiles && m.exemplesUtiles[sn]) ? toutes[sn].filter(m.exemplesUtiles[sn]).concat(toutes[sn].filter(r => !m.exemplesUtiles[sn](r))) : toutes[sn];
      // trames : un exemple = les points d'une même trame, pas trois trames coupées
      const ex = m.source.trames ? tri.filter(r => r['Trame'] === (tri[0] || {})['Trame']).slice(0, 6) : tri.slice(0, EXEMPLES);
      feuilles[sn] = { entetes: entetes(wbSource, sn), lignes: ex, toutes: toutes[sn] };
    }

    // 2. référence : les exemples s'importent-ils ?
    const ref = await importerDans(m, feuilles, ordre, prerequis);
    // 3. chaque colonne : vidée, puis valeur inconnue
    const consignes = [];
    for (const sn of ordre){
      const f = feuilles[sn];
      if (!f.lignes.length){ f.entetes.forEach(c => consignes.push({ feuille:sn, colonne:c, obligatoire:'—', format:'—', valeurs:'', remarque:'aucun exemple disponible pour mesurer' })); continue; }
      for (const c of f.entetes){
        const vide = Object.assign({}, feuilles, { [sn]: Object.assign({}, f, { lignes: f.lignes.map(r => Object.assign({}, r, { [c]: '' })) }) });
        const rv = await importerDans(m, vide, ordre, prerequis);
        const refusees = ref.comptes[sn] - rv.comptes[sn];
        const valeurs = f.toutes.map(r => r[c]);
        const renseignee = f.lignes.some(r => String(r[c]).trim() !== '');
        let obligatoire = refusees > 0 ? 'OUI' : 'non';
        if (!renseignee) obligatoire = 'non';
        const format = formatDe(valeurs);
        // valeur inconnue : gardée telle quelle, remplacée, ou ligne refusée ?
        let nature = '', vals = '';
        const distinctes = [...new Set(valeurs.map(v => String(v).trim()).filter(Boolean))];
        if (format === 'Texte' && renseignee && !/^ID\b/i.test(c) && distinctes.length){
          const inc = Object.assign({}, feuilles, { [sn]: Object.assign({}, f, { lignes: f.lignes.map(r => Object.assign({}, r, { [c]: INCONNUE })) }) });
          const ri = await importerDans(m, inc, ordre, prerequis);
          if (ri.comptes[sn] < ref.comptes[sn]) nature = 'liste fermée : une valeur inconnue fait refuser la ligne';
          else if (ri.dump.includes(INCONNUE)) nature = 'texte libre';
          else if (ri.dump.toLowerCase().includes(INCONNUE.toLowerCase())) nature = 'texte libre (converti en majuscules)';
          else {
            const toutApres = ri.reexport && ri.reexport[sn] ? ri.reexport[sn].map(r => String(r[c]).trim()) : [];
            const apres = [...new Set(toutApres.slice(0, f.lignes.length).filter(Boolean))];
            // chaque valeur d'origine revient, et elles ne sont pas toutes identiques : la colonne n'est pas
            // lue, l'application la reprend de l'enregistrement rattaché (ex. le site de l'exercice, le nom de l'agent)
            const orig = f.lignes.map(r => String(r[c]).trim()).filter(Boolean);
            const reste = toutApres.slice();
            let reprise = new Set(orig).size > 1 && orig.every(v => { const i = reste.indexOf(v); if (i < 0) return false; reste.splice(i, 1); return true; });
            // une seule valeur d'exemple : reprise aussi si la colonne VIDÉE redonne la même valeur (hors
            // collectivité, dont la valeur par défaut « Ville » passerait ce test)
            if (!reprise && new Set(orig).size === 1 && apres.length === 1 && apres[0] === orig[0] && !/collectivit/i.test(c)){
              const siVide = rv.reexport && rv.reexport[sn] ? rv.reexport[sn].map(r => String(r[c]).trim()) : [];
              reprise = siVide.includes(orig[0]);
            }
            nature = reprise ? "non lue à l'import : l'application la calcule ou la reprend d'un enregistrement rattaché"
              : !apres.length ? 'référence : une valeur inconnue est laissée vide (elle doit désigner un enregistrement existant)'
              : 'liste : une valeur inconnue est remplacée' + (apres.length === 1 ? ' par « ' + apres[0] + ' »' : '');
          }
          if (/^liste/.test(nature) || (/service|collectivit/i.test(c) && distinctes.length <= 40)) vals = distinctes.slice(0, 25).join(' · ') + (distinctes.length > 25 ? ' …' : '');
        }
        let remarque = nature;
        if (/^ID\b/i.test(c)) remarque = obligatoire === 'OUI' ? 'identifiant exigé' : 'facultatif : laissez vide pour une nouvelle ligne' + (m.prerequis && m.prerequis.includes(EVT) ? ' (rattachement par « Nom » + « Date AT »)' : '');
        if (/service/i.test(c)) remarque = (remarque ? remarque + ' — ' : '') + 'reprendre exactement un service des référentiels (Administration → Référentiels)';
        consignes.push({ feuille:sn, colonne:c, obligatoire, format: /^ID\b/i.test(c) ? 'Identifiant' : format, valeurs: vals, remarque });
      }
    }

    // 3 bis. aucune colonne isolément obligatoire sur une feuille : une ligne est-elle acceptée avec une seule colonne ?
    const minimales = {};
    for (const sn of ordre){
      const f = feuilles[sn];
      if (!f.lignes.length || consignes.some(k => k.feuille === sn && k.obligatoire === 'OUI')) continue;
      const seules = [];
      for (const c of f.entetes){
        if (!f.lignes.some(r => String(r[c]).trim() !== '')) continue;
        const une = Object.assign({}, feuilles, { [sn]: Object.assign({}, f, { lignes: f.lignes.map(r => Object.fromEntries(f.entetes.map(h => [h, h === c ? r[h] : '']))) }) });
        const ru = await importerDans(m, une, ordre, prerequis);
        if (ru.comptes[sn] > 0) seules.push(c);
      }
      const exigees = f.entetes.filter(c => !seules.includes(c) && f.lignes.some(r => String(r[c]).trim() !== ''));
      if (seules.length && seules.length < f.entetes.length) minimales[sn] = seules;
      if (!seules.length) minimales[sn] = null;   // une seule colonne ne suffit jamais : combinaison exigée
      if (seules.length && seules.length < exigees.length + seules.length){
        consignes.filter(k => k.feuille === sn && seules.includes(k.colonne)).forEach(k => { k.obligatoire = 'au moins une'; });
      }
    }

    // 4. le modèle : feuilles vides en premier, exemples, consignes
    const wb = XLSX.utils.book_new();
    for (const sn of ordre) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([], { header: feuilles[sn].entetes }), sn);
    for (const sn of ordre) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(feuilles[sn].lignes, { header: feuilles[sn].entetes }), ordre.length > 1 ? ('Exemple ' + sn).slice(0, 31) : 'Exemple');
    const noteMin = Object.entries(minimales).filter(([, v]) => v && v.length).map(([sn, v]) => ({ [ordre.length > 1 ? 'Feuille' : 'Colonne']: ordre.length > 1 ? sn : '(règle)', ...(ordre.length > 1 ? { 'Colonne':'(règle)' } : {}), 'Obligatoire':'', 'Format':'', 'Valeurs acceptées (exemples)':'', 'Remarque':"Une ligne est acceptée dès qu'au moins une de ces colonnes est remplie : " + v.join(', ') + '. Les colonnes marquées « au moins une » en font partie.' }));
    const lignesConsignes = noteMin.concat(consignes.map(k => Object.assign(ordre.length > 1 ? { 'Feuille': k.feuille } : {}, { 'Colonne': k.colonne, 'Obligatoire': k.obligatoire, 'Format': k.format, 'Valeurs acceptées (exemples)': k.valeurs, 'Remarque': k.remarque })));
    const wsC = XLSX.utils.json_to_sheet(lignesConsignes);
    wsC['!cols'] = (ordre.length > 1 ? [{ wch:14 }] : []).concat([{ wch:28 }, { wch:11 }, { wch:34 }, { wch:60 }, { wch:70 }]);
    XLSX.utils.book_append_sheet(wb, wsC, 'Consignes');
    XLSX.writeFile(wb, path.join(SORTIE, m.fichier + '.xlsx'));

    // 5. contrôle du fichier livré : importé tel quel (données vides), il ne crée rien et ne plante pas
    const livre = XLSX.readFile(path.join(SORTIE, m.fichier + '.xlsx'));
    const vierge = {}; for (const sn of ordre) vierge[sn] = { entetes: entetes(livre, sn), lignes: [] };
    const rl = await importerDans(m, vierge, ordre, prerequis);
    const rienCree = Object.values(rl.comptes).every(n => n === 0) && rl.errs.length === 0;
    const refOk = Object.keys(m.compter).every(sn => !feuilles[sn].lignes.length || ref.comptes[sn] > 0) && ref.errs.length === 0;
    bilan.push({ m, ordre, consignes, ref, refOk, rienCree, minimales });
    console.log((refOk && rienCree ? 'ok' : '✗ ') + '  ' + ordre.map(sn => sn + ' ' + feuilles[sn].lignes.length + ' ex. → ' + ref.comptes[sn] + ' importé(s)').join(', ') +
      '  · ' + consignes.filter(k => k.obligatoire === 'OUI').length + ' colonne(s) obligatoire(s)' + (rienCree ? '' : '  ✗ le modèle vide crée des données ou plante') + (ref.errs.length ? '  ✗ ' + ref.errs[0] : ''));
  }

  // ---------------------------------------------------------------- mode d'emploi (Excel) et documentation
  const emploi = [
    ...SAISIE_ECRAN.slice(0, 2).map(([quoi, ou, rem], i) => ({ 'Étape': 'Avant', 'Fichier': '(saisie à l\'écran)', 'Contenu': quoi, 'Où l\'importer': ou, 'Remarques': rem })),
    ...bilan.map(b => ({ 'Étape': b.m.fichier.slice(0, 2), 'Fichier': b.m.fichier + '.xlsx', 'Contenu': b.m.nom, 'Où l\'importer': b.m.ou, 'Remarques': b.m.note || '' })),
    ...SAISIE_ECRAN.slice(2).map(([quoi, ou, rem]) => ({ 'Étape': '—', 'Fichier': '(saisie à l\'écran)', 'Contenu': quoi, 'Où l\'importer': ou, 'Remarques': rem })),
  ];
  const wbE = XLSX.utils.book_new();
  const wsE = XLSX.utils.json_to_sheet(emploi);
  wsE['!cols'] = [{ wch:7 }, { wch:30 }, { wch:36 }, { wch:52 }, { wch:110 }];
  XLSX.utils.book_append_sheet(wbE, wsE, "Mode d'emploi");
  const regles = [
    { 'Règle': "Chaque fichier contient une feuille de données vide (à remplir), une feuille « Exemple » (jamais importée) et une feuille « Consignes »." },
    { 'Règle': "Ne renommez pas les colonnes et ne changez pas le nom des feuilles de données : l'import les reconnaît par leur nom." },
    { 'Règle': "Respectez l'ordre des fichiers : certains se rattachent à des données chargées avant (accidents, trames, catalogue d'EPI)." },
    { 'Règle': "Après chaque import, l'application affiche combien de lignes ont été ajoutées, mises à jour ou ignorées : notez les lignes ignorées et corrigez-les." },
    { 'Règle': "Un fichier réimporté met à jour les lignes qu'il reconnaît ; une colonne absente du fichier ne modifie pas ce qui est déjà enregistré (Gestion RH, Dossiers AT/MP)." },
    { 'Règle': "Les données restent aujourd'hui dans le navigateur qui les importe : faites la reprise sur le poste qui servira, et gardez vos fichiers." },
  ];
  XLSX.utils.book_append_sheet(wbE, XLSX.utils.json_to_sheet(regles), 'Règles');
  XLSX.writeFile(wbE, path.join(SORTIE, "00-mode-d-emploi.xlsx"));

  const md = [
    '# Kit de reprise des données',
    '',
    "> Fichier **généré** par `Documentation/outils/generer-kit-reprise.js` — ne pas l'éditer à la main, relancer le générateur. Dernière génération : " + new Date().toISOString().slice(0, 10) + '.',
    '',
    "Pour mettre en service VIGIE HSE chez un nouveau client, ses données existantes (registres Excel, historique des accidents, suivi des visites…) se chargent par les imports de chaque module. Le dossier `KIT-REPRISE/` contient un modèle Excel par module importable et un mode d'emploi (`00-mode-d-emploi.xlsx`).",
    '',
    "**Comment les modèles sont faits.** Chaque modèle est l'export réel du module : mêmes feuilles, mêmes colonnes. Un aller-retour export → import a été vérifié sur tous les modules (les enregistrements reviennent à l'identique, champ par champ ; seule exception connue, l'arbre des causes d'une analyse d'accident, que la page signale). Les consignes de chaque colonne ne sont pas rédigées à la main : le générateur **importe réellement** les exemples dans la page, vide chaque colonne pour voir si les lignes sont refusées (colonne obligatoire), et y met une valeur inconnue pour voir si elle est gardée (texte libre), remplacée ou refusée (liste).",
    '',
    '## Ordre de chargement',
    '',
    '| Étape | Fichier | Contenu | Où l\'importer | Remarques |',
    '|---|---|---|---|---|',
    ...emploi.map(e => '| ' + [e['Étape'], e['Fichier'] === "(saisie à l'écran)" ? '*saisie à l\'écran*' : '`' + e['Fichier'] + '`', e['Contenu'], e["Où l'importer"], e['Remarques']].map(x => String(x).replace(/\|/g, '\\|')).join(' | ') + ' |'),
    '',
    '## Colonnes obligatoires, par fichier',
    '',
    "Le détail complet (format, valeurs acceptées, remarques) est dans la feuille « Consignes » de chaque modèle. Ci-dessous, les colonnes **sans lesquelles une ligne est refusée** — mesurées, pas supposées.",
    '',
    ...bilan.map(b => {
      const obl = b.consignes.filter(k => k.obligatoire === 'OUI').map(k => (b.ordre.length > 1 ? k.feuille + ' › ' : '') + '« ' + k.colonne + ' »');
      const auMoins = Object.entries(b.minimales || {}).filter(([, v]) => v && v.length).map(([sn, v]) => (b.ordre.length > 1 ? sn + ' › ' : '') + 'au moins une de ' + v.map(c => '« ' + c + ' »').join(', '));
      const listes = b.consignes.filter(k => /^liste/.test(k.remarque)).map(k => '« ' + k.colonne + ' » (' + k.remarque.replace(/^liste( fermée)? ?: ?/, '') + ')');
      return '- **`' + b.m.fichier + '.xlsx`** — ' + b.m.nom + ' : ' + [obl.length ? 'obligatoires ' + obl.join(', ') : '', auMoins.join(' ; ')].filter(Boolean).join(' ; ') + (!obl.length && !auMoins.length ? 'aucune colonne isolément obligatoire' : '') + (listes.length ? ' ; listes : ' + listes.join(', ') : '') + '.';
    }),
    '',
    '## Limites connues',
    '',
    "- **Arbre des causes** d'une analyse d'accident (faits, « pourquoi », diagramme d'Ishikawa) : non repris par l'import, à ressaisir à l'écran — la page l'annonce.",
    "- **Référentiels** (services, sites, familles de risque) et **comptes** : pas d'import ; à saisir dans Administration avant les fichiers, car les colonnes « Service » doivent reprendre exactement ces libellés.",
    "- **Accueil au poste, entreprises extérieures, base documentaire, stock et lavages d'EPI, rendez-vous médicaux** : pas d'import, saisie à l'écran.",
    "- **Données dans le navigateur** : tant que l'application n'a pas de serveur, la reprise se fait sur le poste qui servira (voir `PLAN-MISE-EN-PRODUCTION.md`).",
    '',
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'Documentation', 'KIT-REPRISE-DONNEES.md'), md, 'utf8');
  const ko = bilan.filter(b => !(b.refOk && b.rienCree));
  console.log('\n' + bilan.length + ' modèles + mode d\'emploi écrits dans KIT-REPRISE/ · ' + (ko.length ? ko.length + ' À REVOIR : ' + ko.map(b => b.m.fichier).join(', ') : 'tous importables'));
  process.exit(ko.length ? 1 : 0);
})();
