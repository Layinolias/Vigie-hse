// Recherche d'un agent dans Gestion RH (2026-11-19) : « chaque fois qu'on demande le nom d'un agent, on va le chercher
// dans la base agents ». Quelques lettres dans le champ Nom proposent les agents ; le choix remplit l'identité que
// la fiche agent connaît. La fiche agent porte désormais civilité, date de naissance, catégorie, filière, cadre
// d'emploi et grade (saisie, export, import).   RACINE=<dossier> node test-recherche-agent.js
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const XLSX = H.XLSX;
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };
const MAN = { user:'manager@verchamps.fr', role:'manager', email:'manager@verchamps.fr', services:['Voirie & Réseaux'], modulePermissions:{} };
const V = 'Voirie & Réseaux', P = 'Patrimoine Bâti';
const AGENTS = [
  { id:'ag1', nom:'MARTIN', prenom:'Jean', collectivite:'Ville', service:V, actif:true, statut:'Titulaire (FPT)', civilite:'Monsieur', dateNaissance:'1980-06-15',
    categorie:'Catégorie C', filiere:'Filière technique', cadreEmploi:'Adjoints techniques territoriaux', grade:'Adjt tech' },
  { id:'ag2', nom:'DURAND', prenom:'Lucie', collectivite:'Ville', service:P, actif:true },
  { id:'ag3', nom:'MARTINEZ', prenom:'Léa', collectivite:'Ville', service:V, actif:false },
  { id:'ag4', nom:'Élise', prenom:'Martine', collectivite:'Ville', service:P, actif:true },
];
const STOCK = { vigie_hse_agents: JSON.stringify(AGENTS) };
const props = p => [...p.d.querySelectorAll('.vr-liste li[data-i]')].map(li => li.textContent);
const taper = (p, id, v) => { p.$(id).value = v; p.ev(p.$(id), 'input'); };
const cliquer = (p, i) => p.d.querySelector(`.vr-liste li[data-i="${i}"]`).dispatchEvent(new p.w.MouseEvent('mousedown', { bubbles:true, cancelable:true }));
const touche = (p, id, key) => p.$(id).dispatchEvent(new p.w.KeyboardEvent('keydown', { key, bubbles:true, cancelable:true }));

(async () => {
  // ----- Déclaration AT/MP : toute l'identité -----
  const p = await H.page('saisie-rh.html', RH, STOCK);
  check('plus de liste « Choisir un agent » à part', !p.$('fAgentPicker'));
  check('le champ Nom invite à chercher', /chercher dans Gestion RH/.test(p.$('fNom').placeholder) && p.$('fNom').getAttribute('role') === 'combobox');
  taper(p, 'fNom', 'mart');
  check('« mart » : MARTIN Jean et Élise Martine (sans accent), pas l\'agent inactif', props(p).length === 2 && props(p).some(t => /MARTIN Jean/.test(t)) && props(p).some(t => /Élise Martine/.test(t)) && !props(p).some(t => /MARTINEZ/.test(t)), props(p));
  check('… le service est indiqué', props(p).some(t => t.includes(V)));
  taper(p, 'fNom', 'mart jean');
  check('plusieurs mots : MARTIN Jean seul', props(p).length === 1, props(p));
  taper(p, 'fNom', 'zzz');
  check('aucun agent : « saisie libre » annoncée, rien à choisir', !props(p).length && /saisie libre/.test(p.d.querySelector('.vr-liste').textContent));
  touche(p, 'fNom', 'Escape');
  check('Échap ferme la liste, le texte tapé reste', p.d.querySelector('.vr-liste').hidden && p.$('fNom').value === 'zzz');
  taper(p, 'fNom', 'martin j');
  touche(p, 'fNom', 'Enter');
  const age = p.w.VigieRoster.ageA('1980-06-15', p.w.VigieDates.aujourdhui());
  check('Entrée choisit : nom, prénom, service', p.$('fNom').value === 'MARTIN' && p.$('fPrenom').value === 'Jean' && p.$('fService').value === V);
  check('… statut, civilité, catégorie, filière, cadre d\'emploi, grade', p.$('fStatut').value === 'Titulaire (FPT)' && p.$('fCivilite').value === 'Monsieur' && p.$('fCategorie').value === 'Catégorie C'
    && p.$('fFiliere').value === 'Filière technique' && p.$('fCadreEmploi').value === 'Adjoints techniques territoriaux' && p.$('fGrade').value === 'Adjt tech');
  check('… date de naissance et âge (' + age + ' ans)', p.$('fDateNaissance').value === '1980-06-15' && p.$('fAge').value === String(age), [p.$('fDateNaissance').value, p.$('fAge').value]);
  // un agent sans ces informations n'efface pas ce qui est déjà saisi
  p.$('fDateAT').value = '2026-06-14';
  taper(p, 'fNom', 'durand'); cliquer(p, 0);
  check('agent sans identité détaillée : nom, prénom, service remplis, le reste n\'est pas effacé', p.$('fNom').value === 'DURAND' && p.$('fPrenom').value === 'Lucie' && p.$('fService').value === P
    && p.$('fCivilite').value === 'Monsieur' && p.$('fGrade').value === 'Adjt tech');
  taper(p, 'fNom', 'martin jean'); cliquer(p, 0);
  check('âge calculé à la date de l\'accident quand elle est saisie (45 ans la veille de ses 46)', p.$('fAge').value === '45', p.$('fAge').value);
  check('saisie-rh sans erreur JS', !p.erreurs.length, p.erreurs);

  // valeur de la fiche agent hors de la liste : ajoutée, pas perdue
  const autre = AGENTS.map(a => a.id === 'ag2' ? Object.assign({}, a, { statut:'Vacataire', categorie:'Catégorie hors liste' }) : a);
  const p2 = await H.page('saisie-rh.html', RH, { vigie_hse_agents: JSON.stringify(autre) });
  taper(p2, 'fNom', 'durand'); cliquer(p2, 0);
  check('statut ou catégorie hors liste : repris tels quels', p2.$('fStatut').value === 'Vacataire' && p2.$('fCategorie').value === 'Catégorie hors liste');

  // périmètre : un manager ne trouve que les agents de ses services
  const pm = await H.page('saisie-rh.html', MAN, STOCK);
  taper(pm, 'fNom', 'mart');
  check('manager limité à Voirie : MARTIN Jean seul', props(pm).length === 1 && /MARTIN Jean/.test(props(pm)[0]), props(pm));
  // base vide : rien ne s'ouvre
  const pv = await H.page('saisie-rh.html', RH, {});
  taper(pv, 'fNom', 'mart');
  check('base agents vide : aucune liste, saisie libre', pv.d.querySelector('.vr-liste').hidden);

  // ----- les autres formulaires d'un agent -----
  for (const [f, nom, prenom, col, svc] of [['sante-visites.html', 'fNom', 'fPrenom', 'fCollectiviteForm', 'fServiceForm'], ['formation-habilitation.html', 'fNom', 'fPrenom', 'fCollectiviteForm', 'fServiceForm'],
    ['epi-dotation.html', 'dotNom', 'dotPrenom', 'dotCollectivite', 'dotService'], ['accueil-poste.html', 'fNom', 'fPrenom', 'fCollectiviteForm', 'fServiceForm']]){
    const q = await H.page(f, RH, STOCK);
    check(f + ' : plus de liste à part', !q.d.querySelector('[id$="AgentPicker"]'));
    taper(q, nom, 'dur');
    check(f + ' : « dur » propose DURAND Lucie', props(q).length === 1 && /DURAND Lucie/.test(props(q)[0]), props(q));
    cliquer(q, 0);
    check(f + ' : nom, prénom, organisation, service remplis', q.$(nom).value === 'DURAND' && q.$(prenom).value === 'Lucie' && q.$(col).value === 'Ville' && q.$(svc).value === P, [q.$(nom).value, q.$(prenom).value, q.$(col).value, q.$(svc).value]);
    check(f + ' : sans erreur JS', !q.erreurs.length, q.erreurs);
  }

  // ----- compte anonymisé : ni date de naissance, ni civilité -----
  const ANON = Object.assign({}, RH, { user:'RH2', email:'RH2', anonymise:true });
  const pa = await H.page('saisie-rh.html', ANON, STOCK);
  taper(pa, 'fNom', 'martin j'); cliquer(pa, 0);
  check('anonymisé : le choix remplit le métier, pas la date de naissance ni la civilité', pa.$('fNom').value === 'MARTIN' && pa.$('fGrade').value === 'Adjt tech' && pa.$('fDateNaissance').value === '' && pa.$('fCivilite').value === '' && pa.$('fAge').value === '');
  const ga = await H.page('gestion-rh.html', ANON, STOCK);
  ga.$('agentTbody').querySelector('[data-edit="ag1"]').click();
  check('anonymisé : Gestion RH masque civilité et date de naissance', ga.$('agFDateNaissance').closest('.ag-prive').hidden && ga.$('agFCivilite').closest('.ag-prive').hidden);
  ga.$('agFGrade').value = 'Agent de maîtrise'; ga.ev(ga.$('agentForm'), 'submit');
  const agA = ga.lire('vigie_hse_agents').find(x => x.id === 'ag1');
  check('… sa modification garde la date de naissance et la civilité', agA.grade === 'Agent de maîtrise' && agA.dateNaissance === '1980-06-15' && agA.civilite === 'Monsieur', agA);
  ga.$('btnExportAgents').click();
  const entA = XLSX.utils.sheet_to_json(ga.ecrits[0].wb.Sheets[ga.ecrits[0].wb.SheetNames[0]], { header:1 })[0];
  check('… son export n\'a ni date de naissance ni civilité',!entA.includes('Date de naissance') && !entA.includes('Civilité') && entA.includes('Grade'), entA);

  // ----- Gestion RH : la fiche agent porte l'identité -----
  const g = await H.page('gestion-rh.html', RH, STOCK);
  g.$('agentTbody').querySelector('[data-edit="ag1"]').click();
  check('fiche agent : civilité, naissance, catégorie, filière, cadre, grade relus', g.$('agFCivilite').value === 'Monsieur' && g.$('agFDateNaissance').value === '1980-06-15' && g.$('agFCategorie').value === 'Catégorie C'
    && g.$('agFFiliere').value === 'Filière technique' && g.$('agFCadreEmploi').value === 'Adjoints techniques territoriaux' && g.$('agFGrade').value === 'Adjt tech');
  g.$('agFGrade').value = 'Adjt tech Pal 2Cl'; g.$('agFCivilite').value = '';
  g.ev(g.$('agentForm'), 'submit');
  let ag1 = g.lire('vigie_hse_agents').find(a => a.id === 'ag1');
  check('modifiée : grade changé, civilité effacée, le reste gardé', ag1.grade === 'Adjt tech Pal 2Cl' && ag1.civilite === '' && ag1.dateNaissance === '1980-06-15' && ag1.cadreEmploi === 'Adjoints techniques territoriaux');
  g.$('btnExportAgents').click();
  const ws = g.ecrits.length ? g.ecrits[g.ecrits.length - 1].wb.Sheets[g.ecrits[g.ecrits.length - 1].wb.SheetNames[0]] : null;
  const ent = ws ? XLSX.utils.sheet_to_json(ws, { header:1 })[0] : [];
  check('export : les six colonnes d\'identité', ['Civilité', 'Date de naissance', 'Catégorie', 'Filière', "Cadre d'emploi", 'Grade'].every(c => ent.includes(c)), ent);
  // import : colonnes de l'export et noms de la base du préventeur (« Libellé catégorie (actuel) »…)
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Nom', 'Prénom', 'Service', 'Civilité', 'Date de naissance', 'Libellé catégorie (actuel)', 'Libellé filière (actuel)', "Cadre d'emploi", 'Grade'],
    ['DURAND', 'Lucie', P, 'Madame', '01/09/1990', 'Catégorie B', 'Filière administrative', 'Rédacteurs Territoriaux', 'Rédacteur'],
  ]), 'Agents');
  const buf = XLSX.write(wb, { type:'array', bookType:'xlsx' });
  Object.defineProperty(g.$('importAgentsFile'), 'files', { value:[{ arrayBuffer: async () => buf }], configurable:true });
  g.ev(g.$('importAgentsFile'), 'change');
  await new Promise(r => setTimeout(r, 80));
  const ag2 = g.lire('vigie_hse_agents').find(a => a.id === 'ag2');
  check('import : DURAND Lucie mise à jour (date lue à la française)', ag2 && ag2.civilite === 'Madame' && ag2.dateNaissance === '1990-09-01' && ag2.categorie === 'Catégorie B' && ag2.filiere === 'Filière administrative'
    && ag2.cadreEmploi === 'Rédacteurs Territoriaux' && ag2.grade === 'Rédacteur', ag2);
  ag1 = g.lire('vigie_hse_agents').find(a => a.id === 'ag1');
  check('… un agent absent du fichier n\'est pas touché', ag1.grade === 'Adjt tech Pal 2Cl');
  check('gestion-rh sans erreur JS', !g.erreurs.length, g.erreurs);

  // ----- la déclaration reprend ce qui vient d'être importé -----
  const p3 = await H.page('saisie-rh.html', RH, { vigie_hse_agents: JSON.stringify(g.lire('vigie_hse_agents')) });
  taper(p3, 'fNom', 'lucie'); cliquer(p3, 0);
  check('déclaration après import : Madame, Catégorie B, Rédacteur', p3.$('fCivilite').value === 'Madame' && p3.$('fCategorie').value === 'Catégorie B' && p3.$('fGrade').value === 'Rédacteur' && p3.$('fDateNaissance').value === '1990-09-01');

  fin();
})().catch(e => { console.error(e); process.exit(2); });
