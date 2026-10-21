// Niveau des mesures de prévention (ISO 45001 § 8.1.2, 2026-10-18) : composant, Plan d'actions (formulaire, liste, filtre,
// compte, export, import), Préparation ISO 45001, libellés.   node test-niveaux-mesures.js
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const ROOT = H.ROOT, XLSX = H.XLSX;
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };
const AG = { user:'AG1', role:'ag', email:'AG1', services:['*'], modulePermissions:{} };
const V = 'Voirie & Réseaux', P = 'Patrimoine Bâti';
const J = (o) => JSON.stringify(o);

(async () => {
  // ---------- 1. Composant ----------
  const p0 = await H.page('plan-actions.html', RH, {});
  const M = p0.w.VigieMesures;
  check('composant : 5 niveaux dans l\'ordre de la norme', J(M.NIVEAUX.map(n => n.id)) === J(['supprimer', 'remplacer', 'collective', 'organisation', 'individuelle']) && J(M.NIVEAUX.map(n => n.rang)) === J([1, 2, 3, 4, 5]));
  check('reconnaitre : identifiant, rang, « Niveau 3 », libellé sans accents, mot court, EPI', M.reconnaitre('remplacer') === 'remplacer' && M.reconnaitre('1') === 'supprimer' && M.reconnaitre('Niveau 3') === 'collective'
    && M.reconnaitre('consignes, procedures, formation') === 'organisation' && M.reconnaitre('Collective') === 'collective' && M.reconnaitre('EPI') === 'individuelle' && M.reconnaitre('5. Protection individuelle (EPI)') === 'individuelle');
  check('reconnaitre : vide ou inconnu → ""', M.reconnaitre('') === '' && M.reconnaitre('n\'importe quoi') === '' && M.reconnaitre('12') === '' && M.reconnaitre(null) === '');
  const b0 = M.bilan([{ niveauMesure:'collective' }, { niveauMesure:'individuelle' }, { niveauMesure:'individuelle' }, {}, { niveauMesure:'inconnu' }, null]);
  check('bilan : rangées, non rangées (inconnu compris), par niveau', b0.total === 5 && b0.rangees === 3 && b0.nonRangees === 2 && b0.parNiveau.individuelle === 2 && b0.parNiveau.collective === 1 && b0.parNiveau.supprimer === 0);
  check('libellé : connu, inconnu vide', M.libelle('supprimer') === 'Supprimer le danger' && M.libelle('x') === '' && M.libelle(undefined) === '');

  // ---------- 2. Plan d'actions ----------
  const ACTIONS = [
    { id:'a1', titre:'Capter les poussières à la source', service:V, collectivite:'Ville', origine:'Manuel', echeance:'2026-12-01', priorite:'Haute', statut:'À faire', niveauMesure:'collective' },
    { id:'a2', titre:'Masques FFP3', service:V, collectivite:'Ville', origine:'Manuel', echeance:'2026-12-02', priorite:'Moyenne', statut:'À faire', niveauMesure:'individuelle' },
    { id:'a3', titre:'Affichage des consignes', service:P, collectivite:'Ville', origine:'Manuel', echeance:'2026-12-03', priorite:'Basse', statut:'En cours' },
    { id:'a4', titre:'Ancien niveau inconnu', service:P, collectivite:'Ville', origine:'Manuel', echeance:'2026-12-04', priorite:'Basse', statut:'À faire', niveauMesure:'zzz' },
  ];
  const base = { vigie_hse_actions: J(ACTIONS) };
  let pa = await H.page('plan-actions.html', RH, base);
  check('page sans erreur', !pa.erreurs.length, pa.erreurs);
  const titres = () => [...pa.d.querySelectorAll('#tbody tr[data-id]')].map(r => r.dataset.id);
  const ligne = (id) => pa.d.querySelector(`#tbody tr[data-id="${id}"]`);
  check('liste : le niveau sous le titre (« Niveau 3 · … »), rien pour une action non rangée ou inconnue', /Niveau 3 · Protection collective/.test(ligne('a1').cells[0].textContent) && /Niveau 5 · Protection individuelle/.test(ligne('a2').cells[0].textContent)
    && !ligne('a3').querySelector('.niv') && !ligne('a4').querySelector('.niv'));
  check('… le nombre de colonnes est inchangé (8 pour qui modifie)', ligne('a1').cells.length === 8, ligne('a1').cells.length);
  check('compte des niveaux : Collective 1, Individuelle 1, non rangées 2', /Collective 1 · Organisation 0 · Individuelle 1 · non rangées 2/.test(pa.$('niveauxBilan').textContent), pa.$('niveauxBilan').textContent);
  const opts = [...pa.$('fNiveau').options].map(o => o.value);
  check('filtre : Tous, les 5 niveaux, « Non rangée »', J(opts) === J(['all', 'supprimer', 'remplacer', 'collective', 'organisation', 'individuelle', 'none']));
  pa.$('fNiveau').value = 'individuelle'; pa.ev(pa.$('fNiveau'), 'change');
  check('filtre « Protection individuelle » : a2 seule, compteur', J(titres()) === J(['a2']) && pa.$('resultCount').textContent === '1');
  pa.$('fNiveau').value = 'none'; pa.ev(pa.$('fNiveau'), 'change');
  check('filtre « Non rangée » : a3 et a4 (niveau inconnu)', J(titres()) === J(['a3', 'a4']));
  pa.$('btnReset').click();
  check('Réinitialiser : filtre remis à Tous', pa.$('fNiveau').value === 'all' && titres().length === 4);

  // formulaire : choix, enregistrement, retrait
  check('formulaire : « Non rangée » puis les 5 niveaux avec leur aide', J([...pa.$('fNiveauMesure').options].map(o => o.value)) === J(['', 'supprimer', 'remplacer', 'collective', 'organisation', 'individuelle'])
    && /porté par chacun/.test(pa.$('fNiveauMesure').options[5].title));
  pa.ev(pa.d.querySelector('[data-edit="a3"]'), 'click');
  check('ouvrir une action non rangée : « Non rangée »', pa.$('fId').value === 'a3' && pa.$('fNiveauMesure').value === '');
  pa.$('fNiveauMesure').value = 'organisation';
  pa.ev(pa.$('actionForm'), 'submit');
  let a3 = pa.lire('vigie_hse_actions').find(a => a.id === 'a3');
  check('enregistrée : niveauMesure « organisation », le reste intact', a3.niveauMesure === 'organisation' && a3.statut === 'En cours' && a3.titre === 'Affichage des consignes');
  pa.ev(pa.d.querySelector('[data-edit="a4"]'), 'click');
  check('ouvrir une action au niveau inconnu : « Non rangée »', pa.$('fNiveauMesure').value === '');
  pa.ev(pa.$('actionForm'), 'submit');
  check('… enregistrer sans choisir : la valeur inconnue est retirée', !('niveauMesure' in pa.lire('vigie_hse_actions').find(a => a.id === 'a4')));
  pa.ev(pa.d.querySelector('[data-edit="a1"]'), 'click');
  check('ouvrir une action rangée : son niveau', pa.$('fNiveauMesure').value === 'collective');
  pa.$('fNiveauMesure').value = '';
  pa.ev(pa.$('actionForm'), 'submit');
  check('… remise à « Non rangée » : champ retiré', !('niveauMesure' in pa.lire('vigie_hse_actions').find(a => a.id === 'a1')));
  // nouvelle action
  pa.$('btnNew').click();
  check('nouvelle action : « Non rangée » par défaut', pa.$('fNiveauMesure').value === '' && pa.$('fId').value === '');
  pa.$('fTitre').value = 'Remplacer le solvant'; pa.$('fCollectiviteForm').value = 'Ville'; pa.ev(pa.$('fCollectiviteForm'), 'change');
  pa.$('fServiceForm').value = V; pa.$('fEcheance').value = '2026-12-20'; pa.$('fNiveauMesure').value = 'remplacer';
  pa.ev(pa.$('actionForm'), 'submit');
  const nv = pa.lire('vigie_hse_actions').find(a => a.titre === 'Remplacer le solvant');
  check('nouvelle action enregistrée avec son niveau', nv && nv.niveauMesure === 'remplacer' && nv.origine === 'Manuel', nv);

  // export
  pa.$('btnExport').click();
  const feuille = XLSX.utils.sheet_to_json(pa.ecrits.pop().wb.Sheets["Plan d'Actions"], { defval:'' });
  check('export : colonne « Niveau de la mesure » (libellé, vide si non rangée)', feuille.find(x => x.ID === 'a2')['Niveau de la mesure'] === 'Protection individuelle (EPI)' && feuille.find(x => x.ID === 'a1')['Niveau de la mesure'] === ''
    && feuille.find(x => x.ID === 'a3')['Niveau de la mesure'] === 'Consignes, procédures, formation');

  // import
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
  const L = (id, titre, svc, niv) => Object.assign({ 'ID':id, 'Titre':titre, 'Description':'', 'Service':svc, 'Échéance':'2026-12-01', 'Statut':'À faire' }, niv === undefined ? {} : { 'Niveau de la mesure': niv });
  await importer([L('a1', 'Capter les poussières à la source', V, 'Niveau 3'), L('a3', 'Affichage des consignes', P, 'texte inconnu'), L('i1', 'Supprimer l\'opération de ponçage', V, 'Supprimer le danger')]);
  await importer([L('a2', 'Masques FFP3', V)]);
  let apres = pa.lire('vigie_hse_actions'), de = (id) => apres.find(a => a.id === id) || {};
  check('import : « Niveau 3 » reconnu, nouvelle ligne avec son niveau', de('a1').niveauMesure === 'collective' && de('i1').niveauMesure === 'supprimer', [de('a1').niveauMesure, de('i1').niveauMesure]);
  check('… sans la colonne : niveau gardé ; valeur inconnue : niveau gardé', de('a2').niveauMesure === 'individuelle' && de('a3').niveauMesure === 'organisation');
  await importer([L('a2', 'Masques FFP3', V, '')]);
  apres = pa.lire('vigie_hse_actions');
  check('… colonne vide : niveau retiré', !('niveauMesure' in de('a2')));

  // lecture seule : la pastille, pas de formulaire
  const pAg = await H.page('plan-actions.html', AG, base);
  check('agent (lecture) : niveau affiché, compte affiché', !pAg.erreurs.length && /Niveau 3/.test((pAg.d.querySelector('#tbody tr[data-id="a1"]') || { textContent:'' }).textContent) && /non rangées 2/.test(pAg.$('niveauxBilan').textContent), pAg.erreurs);

  // ---------- 3. Préparation ISO 45001 ----------
  const PREV = { user:'PREV1', role:'ag', email:'PREV1', services:['*'], profils:['p-agent', 'p-preventeur'] };
  const DU = [{ id:'du1', service:V, collectivite:'Ville', risque:'Poussières', frequence:2, gravite:2, mesuresProposees:'' }];
  let pp = await H.page('preparation-iso.html', PREV, Object.assign({ vigie_hse_duerp_dataset: J(DU) }, base));
  const faits = (c) => { const r = pp.d.querySelector(`tr[data-clause="${c}"]`); return r ? r.textContent : ''; };
  check('préparation : 8.1.2 dit les actions rangées par niveau', !pp.erreurs.length && /2 actions rangées par niveau de mesure \(1 collective, 1 individuelle\), 2 non rangées/.test(faits('8.1.2')), faits('8.1.2').slice(0, 400));
  check('… lien vers le Plan d\'actions, ce qui manque dit (mesures du Document unique ; plus de signal attendu, question 32)', /Plan d'actions/.test(faits('8.1.2')) && /Document unique ne sont pas rangées/.test(faits('8.1.2')) && !/protection individuelle prévue seule/.test(faits('8.1.2')));
  pp = await H.page('preparation-iso.html', PREV, { vigie_hse_duerp_dataset: J(DU), vigie_hse_actions: J([{ id:'x', titre:'x', statut:'À faire' }]) });
  check('… aucune action rangée : le fait est dit', /aucune action rangée par niveau de mesure \(1 action au Plan d'actions\)/.test(faits('8.1.2')), faits('8.1.2').slice(0, 300));
  pp = await H.page('preparation-iso.html', PREV, { vigie_hse_duerp_dataset: J(DU) });
  check('… aucune action : « aucune action au Plan d\'actions »', /aucune action au Plan d'actions/.test(faits('8.1.2')));
  const ligneEtat = pp.w.VigiePreparation.evaluer(Object.assign({}, pp.w.VigieStore, { complet: (c) => c !== 'vigie_hse_actions' }), pp.w.VigieDates.aujourdhui()).find(l => l.clause === '8.1.2');
  check('… actions partielles pour ce compte : « Non calculé »', ligneEtat.etat === 'partiel', ligneEtat.etat);
  const sansM = pp.w.VigieMesures; delete pp.w.VigieMesures;
  const l2 = pp.w.VigiePreparation.evaluer(pp.w.VigieStore, pp.w.VigieDates.aujourdhui()).find(l => l.clause === '8.1.2');
  pp.w.VigieMesures = sansM;
  check('… composant absent : « Non calculé »', l2.etat === 'partiel');
  check('couverture : 8.1.2 reste « en partie »', pp.w.VigiePreparation.COUVERTURE['8.1.2'].c === 'partielle');

  // ---------- 4. Libellés ----------
  pp.w.eval(require('fs').readFileSync(ROOT + 'assets/libelles-champs.js', 'utf8'));
  check('libellés : niveau de la mesure', pp.w.VigieLibelles.libelle('vigie_hse_actions', 'niveauMesure') === 'Niveau de la mesure');

  fin();
})().catch(e => { console.error(e); process.exit(2); });
