// Programme annuel de prévention (PAPRIPACT, question 25, 2026-10-15) : champs au Plan d'actions, page du programme
// (mesures de l'année, bilan, avis, adoption, abandon, report), revue de direction, droits.   node test-programme.js
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const ROOT = H.ROOT, XLSX = H.XLSX;
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };
const RH_PAT = { user:'RH2', role:'rh', email:'RH2', services:['Patrimoine Bâti'], modulePermissions:{} };
const ADMIN = { user:'admin@verchamps.fr', role:'admin', email:'admin@verchamps.fr', services:['*'], modulePermissions:{} };
const MAN = { user:'manager@verchamps.fr', role:'manager', email:'manager@verchamps.fr', services:['Voirie & Réseaux'], modulePermissions:{} };
const PREV = { user:'PREV1', role:'ag', email:'PREV1', services:['*'], profils:['p-agent', 'p-preventeur'] };
const AG = { user:'AG1', role:'ag', email:'AG1', services:['*'], modulePermissions:{} };
const V = 'Voirie & Réseaux', P = 'Patrimoine Bâti';
const CLE = 'vigie_hse_programmes';
const J = (o) => JSON.stringify(o);

(async () => {
  // l'année courante du fuseau du harnais (celle que la page prend)
  const p0 = await H.page('programme-prevention.html', RH, {});
  const AJD = p0.w.VigieDates.aujourdhui(), Y = Number(AJD.slice(0, 4));
  const d = (an, mmjj) => an + '-' + mmjj;
  const ACTIONS = [
    { id:'a1', titre:'Former les agents au travail en hauteur', description:'Deux sessions', service:V, collectivite:'Ville', risqueLie:'Chute de hauteur', origine:'DUERP', responsable:'RH', echeance:d(Y, '03-31'), priorite:'Haute', statut:'Fait', coutEstime:2400, financement:'Budget formation', conditionsExecution:'Organisme agréé', indicateurResultat:'100 % des équipes formées' },
    { id:'a2', titre:'Remplacer les échelles', service:V, collectivite:'Ville', risqueLie:'Chute de hauteur', origine:'Inspection', responsable:'Atelier', echeance:d(Y, '06-30'), priorite:'Moyenne', statut:'En cours', coutEstime:800.5 },
    { id:'a3', titre:'Vérifier les extincteurs', service:P, collectivite:'Ville', origine:'Manuel', responsable:'Bâtiments', echeance:d(Y, '09-15'), priorite:'Moyenne', statut:'À faire', conditionsExecution:'Prestataire', indicateurResultat:'Rapport sans réserve' },
    { id:'a4', titre:'Affichage des consignes', service:'', collectivite:'', origine:'Objectif', responsable:'HSE', echeance:d(Y, '11-30'), priorite:'Basse', statut:'À faire' },
    { id:'b1', titre:'Ancienne mesure faite', service:V, collectivite:'Ville', echeance:d(Y - 1, '05-01'), statut:'Fait', coutEstime:1000 },
    { id:'b2', titre:'Ancienne mesure non faite', service:V, collectivite:'Ville', echeance:d(Y - 1, '07-01'), statut:'À faire' },
    { id:'c1', titre:'Mesure de l\'an prochain', service:V, collectivite:'Ville', echeance:d(Y + 1, '02-01'), statut:'À faire' },
  ];
  const base = { vigie_hse_actions: J(ACTIONS) };

  // ---------- 1. Logique partagée ----------
  const VP = p0.w.VigieProgramme;
  check('montant : formats français, refus du texte et du négatif', VP.montant('1 250,50') === 1250.5 && VP.montant('1250.5 €') === 1250.5 && VP.montant(12) === 12 && VP.montant('') === null && VP.montant('à définir') === null && VP.montant(-3) === null && VP.montant('1 000') === 1000);
  check('mesures de l\'année : échéance dans l\'année, triées', J(VP.mesuresDeLAnnee(ACTIONS, Y).map(a => a.id)) === J(['a1', 'a2', 'a3', 'a4']) && VP.mesuresDeLAnnee(ACTIONS, Y - 1).length === 2);
  check('à compléter : coût, conditions, indicateur (le financement n\'est pas exigé)', J(VP.aCompleter(ACTIONS[0])) === '[]' && J(VP.aCompleter(ACTIONS[1])) === J(["conditions d'exécution", 'indicateur de résultat']) && J(VP.aCompleter(ACTIONS[2])) === J(['coût estimé']));
  const em = (action, jour, abandon) => VP.etatMesure({ id:'x' }, action, Y, jour, abandon).code;
  check('état d\'une mesure : réalisée, reportée, abandonnée, retirée, non réalisée, en cours, à faire',
    em({ statut:'Fait', echeance:d(Y, '01-01') }, AJD) === 'realisee' && em({ statut:'À faire', echeance:d(Y + 1, '01-10') }, AJD) === 'reportee'
    && em({ statut:'À faire', echeance:d(Y, '01-01') }, AJD, { motif:'x' }) === 'abandonnee' && em(null, AJD) === 'retiree'
    && em({ statut:'À faire', echeance:d(Y, '05-01') }, d(Y + 1, '01-02')) === 'non-realisee' && em({ statut:'En cours', echeance:d(Y, '05-01') }, d(Y, '05-02')) === 'en-cours'
    && em({ statut:'À faire', echeance:d(Y, '05-01') }, d(Y, '05-02')) === 'a-faire');
  const rl = VP.lire(null, ACTIONS, Y, AJD);
  check('programme en préparation : lu sur le Plan d\'actions (4 mesures, 3 200,50 € prévus, 2 sans coût, 3 à compléter)', rl.total === 4 && rl.cout === 3200.5 && rl.sansCout === 2 && rl.aCompleter === 3 && rl.realisees === 1 && !rl.adopte, rl);

  // ---------- 2. Accès et menu ----------
  for (const [nom, S, ouvert, gere] of [['RH', RH, true, true], ['administrateur', ADMIN, true, true], ['préventeur', PREV, true, true], ['manager', MAN, true, false], ['agent', AG, false, false]]){
    const p = await H.page('programme-prevention.html', S, base);
    check(`accès ${nom} : ${ouvert ? (gere ? 'gère' : 'consulte') : 'renvoyé au tableau de bord'}`, p.navigation() === !ouvert && !p.erreurs.length && (!ouvert || (!!p.$('btnAdopter') === gere && p.$('avisDate').disabled === !gere)), { nav: p.navigation(), err: p.erreurs });
    const db = await H.page('dashboard.html', S, {});
    check(`menu ${nom} : lien « Programme annuel de prévention » ${ouvert ? 'présent' : 'absent'}`, !!db.d.querySelector('a[href="programme-prevention.html"]') === ouvert);
  }

  // ---------- 3. Plan d'actions : les quatre champs ----------
  let pa = await H.page('plan-actions.html', RH, base, '?modifier=a2');
  check('Plan d\'actions ?modifier= : l\'action ouverte, coût affiché à la française', H.visible(pa.$('formPanel')) && pa.$('fId').value === 'a2' && pa.$('fCout').value === '800,5' && !pa.erreurs.length, { err: pa.erreurs, v: pa.$('fCout').value });
  pa.$('fCout').value = 'beaucoup';
  pa.ev(pa.$('actionForm'), 'submit');
  check('… coût invalide : refusé, rien d\'enregistré', /montant en euros/.test(pa.alertes.pop() || '') && (pa.lire('vigie_hse_actions').find(a => a.id === 'a2') || {}).coutEstime === 800.5);
  pa.$('fCout').value = '1 250,50'; pa.$('fFinancement').value = 'Subvention'; pa.$('fConditions').value = 'Achat groupé'; pa.$('fIndicateur').value = 'Plus aucune échelle défectueuse';
  pa.ev(pa.$('actionForm'), 'submit');
  let a2 = pa.lire('vigie_hse_actions').find(a => a.id === 'a2');
  check('… enregistrés : coût en nombre, financement, conditions, indicateur', a2.coutEstime === 1250.5 && a2.financement === 'Subvention' && a2.conditionsExecution === 'Achat groupé' && a2.indicateurResultat === 'Plus aucune échelle défectueuse', a2);
  pa.ev(pa.d.querySelector('[data-edit="a2"]'), 'click');
  pa.$('fCout').value = ''; pa.$('fFinancement').value = '';
  pa.ev(pa.$('actionForm'), 'submit');
  a2 = pa.lire('vigie_hse_actions').find(a => a.id === 'a2');
  check('… vidés : champs retirés de l\'enregistrement', !('coutEstime' in a2) && !('financement' in a2) && a2.conditionsExecution === 'Achat groupé');
  pa.$('btnExport').click();
  const feuille = XLSX.utils.sheet_to_json(pa.ecrits.pop().wb.Sheets["Plan d'Actions"], { defval:'' });
  const ex1 = feuille.find(x => x.ID === 'a1');
  check('export : colonnes du programme', ex1 && ex1['Coût estimé (€)'] === 2400 && ex1['Financement'] === 'Budget formation' && ex1["Conditions d'exécution"] === 'Organisme agréé' && ex1['Indicateur de résultat'] === '100 % des équipes formées', ex1);
  // import : colonnes présentes posées, absentes intactes (relu par la page, via un vrai fichier)
  // un fichier importé par le vrai champ (jsdom : File sans arrayBuffer())
  async function importer(lignes){
    const wbi = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbi, XLSX.utils.json_to_sheet(lignes), 'Plan');
    const octets = XLSX.write(wbi, { type:'array', bookType:'xlsx' });
    const fichier = new pa.w.File([octets], 'import.xlsx');
    fichier.arrayBuffer = async () => octets;
    Object.defineProperty(pa.$('importFile'), 'files', { value: [fichier], configurable: true });
    const n = pa.alertes.length;
    pa.ev(pa.$('importFile'), 'change');
    for (let i = 0; i < 60 && pa.alertes.length === n; i++) await H.sleep(50);
  }
  await importer([{ 'ID':'a3', 'Titre':'Vérifier les extincteurs', 'Description':'', 'Service':P, 'Échéance':d(Y, '09-15'), 'Statut':'À faire', 'Coût estimé (€)':'3 000', 'Financement':'Budget bâtiments' }]);
  await importer([{ 'ID':'a1', 'Titre':'Former les agents au travail en hauteur', 'Description':'Deux sessions', 'Service':V, 'Échéance':d(Y, '03-31'), 'Statut':'Fait' }]);
  const apresImport = pa.lire('vigie_hse_actions');
  const a3 = apresImport.find(a => a.id === 'a3'), a1 = apresImport.find(a => a.id === 'a1');
  check('import : coût et financement posés, conditions et indicateur gardés (colonnes absentes)', a3 && a3.coutEstime === 3000 && a3.financement === 'Budget bâtiments' && a3.conditionsExecution === 'Prestataire' && a3.indicateurResultat === 'Rapport sans réserve', { a3, al: pa.alertes });
  check('… un fichier sans ces colonnes ne les efface pas', a1 && a1.coutEstime === 2400 && a1.financement === 'Budget formation');

  // ---------- 4. Page du programme : en préparation ----------
  let p = await H.page('programme-prevention.html', RH, base);
  const rows = () => [...p.d.querySelectorAll('#tbody tr:not(.total)')].map(r => r.cells[0] && r.cells[0].querySelector('b') ? r.cells[0].querySelector('b').textContent : '');
  check('année proposée : l\'année en cours ; années voisines au choix', p.$('selAnnee').value === String(Y) && [...p.$('selAnnee').options].some(o => o.value === String(Y + 1)) && [...p.$('selAnnee').options].some(o => o.value === String(Y - 1)));
  check('mesures : les 4 actions de l\'année, par échéance', J(rows()) === J(ACTIONS.slice(0, 4).map(a => a.titre)), rows());
  check('compteurs : 4 mesures, 3 200,50 €, 3 à compléter, 1 réalisée', p.$('kpiMesures').textContent === '4' && /3\s200,5\s€/.test(p.$('kpiCout').textContent) && p.$('kpiCompleter').textContent === '3' && p.$('kpiRealisees').textContent === '1', [p.$('kpiCout').textContent, p.$('kpiCompleter').textContent]);
  check('« à compléter » sur les champs manquants, « Compléter » vers le Plan d\'actions', p.d.querySelectorAll('#tbody .manque').length === 6 && (p.d.querySelector('#tbody a[href^="plan-actions.html?modifier="]') || {}).getAttribute('href') === 'plan-actions.html?modifier=a1');
  check('ligne de total : coût et mesures sans coût', /3\s200,5\s€/.test(p.d.querySelector('#tbody tr.total').textContent) && /2 mesure\(s\) sans coût/.test(p.d.querySelector('#tbody tr.total').textContent));
  check('bilan de l\'année écoulée (sans programme adopté) : 2 mesures, 1 réalisée, 1 non réalisée', /Bilan de l'année/.test(p.$('titreBilan').textContent) && /Pas de programme/.test(p.$('noteBilan').textContent) && /2mesures/.test(p.$('chiffresBilan').textContent.replace(/\s/g, '')) && /1réalisées/.test(p.$('chiffresBilan').textContent.replace(/\s/g, '')) && /1nonréalisées/.test(p.$('chiffresBilan').textContent.replace(/\s/g, '')) && /Ancienne mesure non faite/.test(p.$('listeBilan').textContent), p.$('chiffresBilan').textContent);
  // enregistrer en préparation
  p.$('bilanPrecedent').value = 'Bonne année dans l\'ensemble.'; p.$('avisDate').value = d(Y, '01-15'); p.$('avisTexte').value = 'Avis favorable à l\'unanimité';
  p.ev(p.$('formAdoption'), 'submit');
  let prog = (p.lire(CLE) || [])[0] || {};
  check('« Enregistrer » : programme de l\'année en préparation, avis et commentaire gardés', prog.id === 'pg-' + Y && prog.annee === Y && prog.statut === 'Brouillon' && prog.avisTexte === 'Avis favorable à l\'unanimité' && prog.bilanPrecedent === 'Bonne année dans l\'ensemble.' && prog.auteur === 'RH1' && !prog.mesures, prog);
  // adopter
  p.$('btnAdopter').click();
  check('adoption : date obligatoire', /date d'adoption/.test(p.alertes.pop() || '') && p.lire(CLE)[0].statut === 'Brouillon');
  p.$('adopteLe').value = d(Y + 1, '12-31'); p.$('btnAdopter').click();
  check('adoption : pas dans le futur', /futur/.test(p.alertes.pop() || '') && p.lire(CLE)[0].statut === 'Brouillon');
  p.$('adopteLe').value = AJD; p.$('btnAdopter').click();
  check('adoption : qui adopte, obligatoire', /qui adopte/.test(p.alertes.pop() || '') && p.lire(CLE)[0].statut === 'Brouillon');
  p.$('adoptePar').value = 'Le Maire'; p.$('btnAdopter').click();
  prog = p.lire(CLE)[0];
  check('adopté : liste figée (4 mesures), date, autorité, saisi par', prog.statut === 'Adopté' && prog.mesures.length === 4 && prog.adoptePar === 'Le Maire' && prog.adopteLe === AJD && prog.adopteSaisiPar === 'RH1' && prog.mesures[0].coutEstime === 2400, prog);
  check('… champs verrouillés, « Rouvrir », journal', p.$('avisDate').disabled && p.$('bilanPrecedent').disabled && !!p.$('btnRouvrir') && (p.lire('vigie_hse_audit_log') || []).some(a => a.module === 'Programme annuel de prévention' && /adopté/.test(a.description)));

  // ---------- 5. Après l'adoption : ajout, report, abandon, retrait ----------
  const actions2 = ACTIONS.map(a => a.id === 'a2' ? Object.assign({}, a, { echeance: d(Y + 1, '03-31') }) : a).filter(a => a.id !== 'a4')
    .concat([{ id:'n1', titre:'Nouvelle action de l\'année', service:V, echeance:d(Y, '10-10'), statut:'À faire', coutEstime:150 }]);
  p = await H.page('programme-prevention.html', RH, Object.assign({}, base, { vigie_hse_actions: J(actions2), [CLE]: J([prog]) }));
  const etatDe = (titre) => { const r = [...p.d.querySelectorAll('#tbody tr')].find(x => x.cells[0] && x.cells[0].textContent.includes(titre)); return r ? r.cells[8].textContent : ''; };
  check('adopté : la liste reste celle de l\'adoption', rows().length === 4 && rows().includes('Affichage des consignes'));
  check('échéance repoussée à l\'année suivante : « Reportée »', /Reportée/.test(etatDe('Remplacer les échelles')), etatDe('Remplacer les échelles'));
  check('action supprimée du Plan d\'actions : « Retirée du Plan d\'actions »', /Retirée du Plan d'actions/.test(etatDe('Affichage des consignes')));
  check('action ajoutée depuis l\'adoption : listée à part', /Ajoutées au Plan d'actions depuis l'adoption/.test(p.$('ajoutees').textContent) && /Nouvelle action de l'année/.test(p.$('ajoutees').textContent));
  check('adopté : plus de lien « Compléter »', !p.d.querySelector('#tbody a[href^="plan-actions.html"]'));
  p.ev(p.d.querySelector('[data-abandonner="a3"]'), 'click');
  check('« Abandonner » : un motif est demandé', !!p.$('motifAbandon'));
  p.ev(p.d.querySelector('[data-confirmer-abandon="a3"]'), 'click');
  check('… sans motif : refusé', /motif/.test(p.alertes.pop() || '') && !(p.lire(CLE)[0].abandons || {}).a3);
  p.$('motifAbandon').value = 'Bâtiment vendu';
  p.ev(p.d.querySelector('[data-confirmer-abandon="a3"]'), 'click');
  const ab = (p.lire(CLE)[0].abandons || {}).a3 || {};
  check('… avec motif : « Abandonnée », motif, date et auteur gardés', /Abandonnée/.test(etatDe('Vérifier les extincteurs')) && ab.motif === 'Bâtiment vendu' && ab.par === 'RH1' && ab.le === AJD, ab);
  p.ev(p.d.querySelector('[data-retablir="a3"]'), 'click');
  check('« Rétablir » : l\'abandon retiré', !(p.lire(CLE)[0].abandons || {}).a3 && !/Abandonnée/.test(etatDe('Vérifier les extincteurs')));
  // export et impression
  p.$('btnExport').click();
  const wbp = (p.ecrits.pop() || {}).wb;
  check('export : programme, mesures de l\'année, bilan de l\'année écoulée', wbp && J(wbp.SheetNames) === J(['Programme', 'Mesures ' + Y, 'Bilan ' + (Y - 1)]) && XLSX.utils.sheet_to_json(wbp.Sheets['Mesures ' + Y]).length === 4 && XLSX.utils.sheet_to_json(wbp.Sheets['Programme'])[0]['Adopté par'] === 'Le Maire', wbp && wbp.SheetNames);
  p.$('btnImprimer').click();
  const imp = p.d.getElementById('pg-impression');
  check('impression : document du programme (bilan, mesures, coût, avis, adoption, signatures)', imp && new RegExp('Programme annuel de prévention ' + Y).test(imp.textContent) && /Bilan de l'année/.test(imp.textContent) && /Coût estimé total/.test(imp.textContent) && /Le Maire/.test(imp.textContent) && imp.querySelectorAll('.pi-signatures div').length === 2 && /F3SCT ou CST/.test(imp.textContent));
  // rouvrir
  p.$('btnRouvrir').click();
  prog = p.lire(CLE)[0];
  check('« Rouvrir » : en préparation, liste figée effacée', prog.statut === 'Brouillon' && !prog.mesures && !p.$('avisDate').disabled);

  // ---------- 6. Bilan d'un programme adopté l'année précédente ----------
  const progPrec = { id:'pg-' + (Y - 1), annee: Y - 1, statut:'Adopté', adopteLe:d(Y - 1, '01-20'), adoptePar:'Le Maire',
    mesures:[{ id:'b1', titre:'Ancienne mesure faite', echeance:d(Y - 1, '05-01'), coutEstime:1000 }, { id:'b2', titre:'Ancienne mesure non faite', echeance:d(Y - 1, '07-01') }, { id:'b3', titre:'Mesure reportée', echeance:d(Y - 1, '08-01') }, { id:'b4', titre:'Mesure abandonnée', echeance:d(Y - 1, '09-01') }],
    abandons:{ b4: { motif:'Plus nécessaire', le:d(Y - 1, '10-01'), par:'RH1' } } };
  const actions3 = ACTIONS.concat([{ id:'b3', titre:'Mesure reportée', echeance:d(Y, '02-01'), statut:'À faire' }, { id:'b4', titre:'Mesure abandonnée', echeance:d(Y - 1, '09-01'), statut:'À faire' }]);
  p = await H.page('programme-prevention.html', RH, { vigie_hse_actions: J(actions3), [CLE]: J([progPrec]) });
  const cb = p.$('chiffresBilan').textContent.replace(/\s/g, '');
  check('bilan d\'un programme adopté : 4 mesures — 1 réalisée, 1 reportée, 1 abandonnée, 1 non réalisée ; 1 000 € réalisés', /Programme \d{4} adopté/.test(p.$('noteBilan').textContent) && /4mesures/.test(cb) && /1réalisées/.test(cb) && /1reportées/.test(cb) && /1abandonnées/.test(cb) && /1nonréalisées/.test(cb) && /1000€/.test(cb) && /Plus nécessaire/.test(p.$('listeBilan').textContent), cb);

  // ---------- 7. Comptes limités, secteur entreprise ----------
  p = await H.page('programme-prevention.html', MAN, base);
  check('manager (Voirie) : ses mesures et celles de toute l\'organisation, en lecture, avertissement', J(rows()) === J(['Former les agents au travail en hauteur', 'Remplacer les échelles', 'Affichage des consignes']) && H.visible(p.$('notePartiel')) && !p.$('btnAdopter') && !p.d.querySelector('#tbody a[href^="plan-actions.html"]'), rows());
  p = await H.page('programme-prevention.html', RH_PAT, base);
  check('RH limité (Patrimoine) : adoption impossible d\'ici', p.$('btnAdopter') && p.$('btnAdopter').disabled && H.visible(p.$('notePartiel')));
  p = await H.page('programme-prevention.html', RH, Object.assign({ vigie_hse_referentials: J({ organisation: { secteur:'entreprise' } }) }, base));
  check('secteur entreprise : « CSSCT ou CSE » au lieu de « F3SCT ou CST »', /CSSCT ou CSE/.test(p.d.querySelector('label[for="avisDate"]').textContent) && !/F3SCT/.test(p.d.querySelector('.page-summary-text p').textContent), p.d.querySelector('label[for="avisDate"]').textContent);

  // ---------- 8. Échappement ----------
  p = await H.page('programme-prevention.html', RH, { vigie_hse_actions: J([{ id:'x1', titre:'<img src=x onerror="window.__xss=1">Piège', description:'<b>d</b>', echeance:d(Y, '05-05'), statut:'À faire', conditionsExecution:'<i>c</i>' }]) });
  check('échappement : rien d\'injecté', !p.d.querySelector('#tbody img') && !p.d.querySelector('#tbody b b') && !p.d.querySelector('#tbody i') && /<img src=x/.test(p.$('tbody').textContent) && !p.w.__xss);

  // ---------- 9. Revue de direction ----------
  const rd = await H.page('revue-direction.html', RH, Object.assign({}, base, { [CLE]: J([Object.assign({}, prog, { statut:'Adopté', adopteLe:AJD, adoptePar:'Le Maire', mesures: ACTIONS.slice(0, 4).map(a => p0.w.VigieProgramme.photo(a)) })]) }));
  rd.$('btnNouvelle').click();
  const txt = rd.$('revue') ? rd.$('revue').textContent : '';
  const rev = (rd.lire('vigie_hse_revues_direction') || [])[0] || {};
  check('revue de direction : le programme de l\'année dans « Ressources »', new RegExp('Programme annuel de prévention ' + Y + ' : adopté').test(txt) && /coût estimé/.test(txt) && rev.chiffres && rev.chiffres.programme && rev.chiffres.programme.mesures === 4 && rev.chiffres.programme.cout === 3200.5 && !rd.erreurs.length, { p: rev.chiffres && rev.chiffres.programme, err: rd.erreurs });
  check('… revue antérieure sans programme : rien ; données partielles : dit', rd.w.programmeDeLaRevue({}) === '' && /non repris/.test(rd.w.programmeDeLaRevue({ programme: null })));

  // ---------- 10. Droits, serveur, registre, libellés ----------
  const W = p0.w, res = (S) => W.VigieDroits.pour(S);
  const defs = W.VigieDroits.MODULES.find(m => m.id === 'programme');
  check('catalogue : module « programme » (Pilotage) ; Administrateur, RH et Préventeur gèrent, Manager consulte, Agent sans accès', defs && defs.section === 'Pilotage' && res(ADMIN).peut('programme', 'gerer') && res(RH).peut('programme', 'gerer') && res(PREV).peut('programme', 'gerer') && res(MAN).peut('programme', 'consulter') && !res(MAN).peut('programme', 'gerer') && !res(AG).peut('programme', 'consulter'));
  const Droits = require(ROOT + 'serveur/droits.js'), Lecture = require(ROOT + 'serveur/lecture.js');
  const sess = (profils) => ({ user:'x', profils, services:['*'] });
  check('serveur, écriture : Préventeur et RH complet, Manager et Agent aucun', Droits.niveau(sess(['p-preventeur']), CLE) === 'complet' && Droits.niveau(sess(['p-rh']), CLE) === 'complet' && Droits.niveau(sess(['p-manager']), CLE) === 'aucun' && Droits.niveau(sess(['p-agent']), CLE) === 'aucun' && Droits.cles.includes(CLE));
  check('serveur, lecture : Manager reçoit, Agent rien', Lecture.regle(sess(['p-manager']), CLE) === null && Lecture.regle(sess(['p-agent']), CLE) === Lecture.RETIRE);
  check('VigieStore.CLES : registre de données, non sensible', W.VigieStore.CLES[CLE] && W.VigieStore.CLES[CLE].nature === 'donnees' && W.VigieStore.CLES[CLE].sensible === false);
  W.eval(require('fs').readFileSync(ROOT + 'assets/libelles-champs.js', 'utf8'));
  check('libellés : coût estimé (Plan d\'actions), adopté par (programme)', W.VigieLibelles.libelle('vigie_hse_actions', 'coutEstime') === 'Coût estimé (€)' && W.VigieLibelles.libelle(CLE, 'adoptePar') === 'Adopté par');

  fin();
})().catch(e => { console.error(e); process.exit(2); });
