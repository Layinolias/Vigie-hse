// Conformité réglementaire (ISO 45001 § 6.1.3 et § 9.1.2, 2026-10-15) : registre des exigences, évaluations, actions au
// Plan d'actions, import/export, bilan dans la revue de direction, droits.   RACINE=<dossier> node test-conformite.js
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const ROOT = H.ROOT;
const XLSX = H.XLSX;
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };
const RH_PAT = { user:'RH2', role:'rh', email:'RH2', services:['Patrimoine Bâti'], modulePermissions:{} };
const ADMIN = { user:'admin@verchamps.fr', role:'admin', email:'admin@verchamps.fr', services:['*'], modulePermissions:{} };
const MAN = { user:'manager@verchamps.fr', role:'manager', email:'manager@verchamps.fr', services:['Voirie & Réseaux'], modulePermissions:{} };
const PREV = { user:'PREV1', role:'ag', email:'PREV1', services:['*'], profils:['p-agent', 'p-preventeur'] };
const AG = { user:'AG1', role:'ag', email:'AG1', services:['*'], modulePermissions:{} };
const V = 'Voirie & Réseaux', P = 'Patrimoine Bâti';
const CLE = 'vigie_hse_exigences';
const J = (o) => JSON.stringify(o);

(async () => {
  // ---------- 1. Accès et menu ----------
  // question 26 : le Préventeur gère, le Manager lit
  for (const [nom, S, ouvert, gere] of [['RH', RH, true, true], ['administrateur', ADMIN, true, true], ['manager', MAN, true, false], ['préventeur', PREV, true, true], ['agent', AG, false, false]]){
    const p = await H.page('conformite.html', S, {});
    check(`accès ${nom} : ${ouvert ? 'page ouverte' : 'renvoyé au tableau de bord'}`, p.navigation() === !ouvert && !p.erreurs.length, { nav: p.navigation(), err: p.erreurs });
    if (ouvert) check(`… ${nom} : bouton « Nouvelle exigence » et import ${gere ? 'présents' : 'absents (lecture seule)'}`, !!p.$('btnNouveau') === gere && !!p.$('btnImport') === gere);
    const d = await H.page('dashboard.html', S, {});
    check(`menu ${nom} : lien « Conformité réglementaire » ${ouvert ? 'présent' : 'absent'}`, !!d.d.querySelector('a[href="conformite.html"]') === ouvert);
  }

  // ---------- 2. Création, validations ----------
  let p = await H.page('conformite.html', RH, {});
  check('registre vide : message et compteurs à 0', /Aucune exigence pour le moment/.test(p.$('tbody').textContent) && p.$('kpiTotal').textContent === '0', p.$('tbody').textContent);
  p.$('btnNouveau').click();
  const remplir = (o) => { for (const [k, v] of Object.entries(o)) p.$(k).value = v; };
  const soumettre = () => p.ev(p.$('ficheForm'), 'submit');
  soumettre();
  check('validation : exigence obligatoire', /Indiquez l'exigence/.test(p.alertes.pop() || '') && !p.lire(CLE));
  remplir({ cIntitule: 'Faire vérifier chaque année les installations électriques', cLien: 'legifrance.gouv.fr' });
  soumettre();
  check('validation : lien en http(s)', /http/.test(p.alertes.pop() || '') && !p.lire(CLE));
  remplir({ cLien: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000018531541', nPreuve: 'rapport' });
  soumettre();
  check('validation : preuve sans état constaté', /état constaté/.test(p.alertes.pop() || '') && !p.lire(CLE));
  remplir({ nEtat: 'Non conforme', nDate: '2099-01-01' });
  soumettre();
  check('validation : évaluation dans le futur', /futur/.test(p.alertes.pop() || '') && !p.lire(CLE));
  const ajd = p.w.VigieDates.aujourdhui();
  remplir({ nDate: ajd, cReference: 'Code du travail, art. R4226-16', cTheme: 'Électricité', cResponsable: 'Services techniques', cProchaine: '2099-06-30', nPreuve: 'Rapport Socotec du 12/03', nConstat: 'Deux réserves non levées' });
  p.choisir('cService', V);
  check('écart sans action : signalé', H.visible(p.$('cSansAction')) && /Non conforme sans action/.test(p.$('cSansAction').textContent), p.$('cSansAction').textContent);
  p.$('btnAjoutAction').click();
  p.d.querySelector('#cActions [data-k="description"]').value = 'Lever les deux réserves';
  p.d.querySelector('#cActions [data-k="responsable"]').value = 'Électricien';
  p.ev(p.d.querySelector('#cActions [data-k="description"]'), 'change');
  check('… plus signalé une fois l\'action ajoutée', !H.visible(p.$('cSansAction')));
  soumettre();
  let l = p.lire(CLE) || [];
  let x = l[0] || {};
  check('création : une exigence, champs enregistrés', l.length === 1 && x.intitule.startsWith('Faire vérifier') && x.reference === 'Code du travail, art. R4226-16' && x.theme === 'Électricité' && x.service === V && x.responsable === 'Services techniques' && x.prochaineEvaluation === '2099-06-30' && x.auteur === 'RH1' && x.statut === 'En vigueur', x);
  check('… son évaluation, au nom de l\'auteur', (x.evaluations || []).length === 1 && x.evaluations[0].etat === 'Non conforme' && x.evaluations[0].par === 'RH1' && x.evaluations[0].date === ajd && x.evaluations[0].preuve === 'Rapport Socotec du 12/03' && x.evaluations[0].constat === 'Deux réserves non levées', x.evaluations);
  check('… son action, avec un identifiant', (x.actions || []).length === 1 && x.actions[0].description === 'Lever les deux réserves' && !!x.actions[0].id, x.actions);
  const audit = (p.lire('vigie_hse_audit_log') || []).filter(a => a.module === 'Conformité réglementaire');
  check('journal d\'audit : création et état évalué', audit.length === 1 && audit[0].type === 'Création' && /évaluée : Non conforme/.test(audit[0].description), audit);
  check('compteurs : 1 en vigueur, 0 conforme, 1 écart, 0 à évaluer', p.$('kpiTotal').textContent === '1' && p.$('kpiConformes').textContent === '0' && p.$('kpiEcarts').textContent === '1' && p.$('kpiAEvaluer').textContent === '0');
  check('liste : état « Non conforme », référence sous l\'exigence, actions 0 / 1', /Non conforme/.test(p.$('tbody').textContent) && /R4226-16/.test(p.d.querySelector('#tbody .ref').textContent) && /0 \/ 1 soldée/.test(p.$('tbody').textContent), p.$('tbody').textContent.replace(/\s+/g, ' '));
  check('fiche rouverte : « Ouvrir le texte » pointe vers le lien', (p.d.querySelector('#fiche a[target="_blank"]') || {}).href === 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000018531541');

  // ---------- 3. Nouvelle évaluation, retrait d'une évaluation ----------
  remplir({ nEtat: 'Conforme', nDate: ajd, nPreuve: 'Contre-visite', nConstat: '' });
  soumettre();
  x = p.lire(CLE)[0];
  check('seconde évaluation : état « Conforme » (la dernière, à date égale l\'ordre d\'enregistrement)', x.evaluations.length === 2 && p.w.VigieConformite.etat(x, ajd).code === 'conforme' && /Conformes · 100 % des évaluées/.test(p.$('kpiConformesLabel').textContent), p.$('kpiConformesLabel').textContent);
  check('historique : deux évaluations, la plus récente en tête', p.d.querySelectorAll('#cEvaluations li').length === 2 && /Conforme/.test(p.d.querySelector('#cEvaluations li .chip').textContent) && !/Non/.test(p.d.querySelector('#cEvaluations li .chip').textContent));
  p.d.querySelector('#cEvaluations [data-retirer-eval]').click();
  check('« Retirer » une évaluation : rien d\'enregistré avant l\'enregistrement', p.lire(CLE)[0].evaluations.length === 2 && p.d.querySelectorAll('#cEvaluations li').length === 1);
  soumettre();
  x = p.lire(CLE)[0];
  const audit2 = (p.lire('vigie_hse_audit_log') || []).filter(a => a.module === 'Conformité réglementaire').pop();
  check('… enregistrée : une évaluation, état « Non conforme », journal', x.evaluations.length === 1 && x.evaluations[0].etat === 'Non conforme' && /1 évaluation\(s\) retirée\(s\)/.test(audit2.description), audit2);

  // ---------- 4. Échappement ----------
  p.$('btnNouveau').click();
  remplir({ cIntitule: '<img src=x onerror="window.__xss=1">Piège', cReference: '<b>gras</b>', cTheme: '<i>t</i>' });
  soumettre();
  check('échappement : aucun élément injecté, texte affiché tel quel', !p.d.querySelector('#tbody img') && !p.d.querySelector('#tbody .ref b') && /<img src=x/.test(p.$('tbody').textContent) && !p.w.__xss);
  // supprimer
  p.ev(p.d.querySelector(`[data-ouvrir="${p.lire(CLE)[1].id}"]`), 'click');
  p.$('btnSupprimer').click();
  check('suppression : l\'exigence disparaît, journal « Suppression »', p.lire(CLE).length === 1 && (p.lire('vigie_hse_audit_log') || []).some(a => a.module === 'Conformité réglementaire' && a.type === 'Suppression'));

  // ---------- 5. À réévaluer, retirée, filtres ----------
  const stock = {
    [CLE]: J([
      { id:'ex-a', intitule:'Tenir le registre de sécurité', reference:'CCH R143-38', theme:'Incendie', responsable:'Bâtiments', prochaineEvaluation:'2025-06-01', statut:'En vigueur',
        evaluations:[{ id:'e1', date:'2025-01-10', etat:'Conforme', par:'RH1' }], actions:[] },
      { id:'ex-b', intitule:'Afficher les consignes de sécurité incendie', service:P, theme:'Incendie', statut:'En vigueur', evaluations:[], actions:[] },
      { id:'ex-c', intitule:'Évaluer le risque chimique', theme:'Chimique', statut:'En vigueur',
        evaluations:[{ id:'e2', date:'2026-02-01', etat:'Partiellement conforme', par:'RH1' }], actions:[{ id:'a1', description:'Compléter les FDS', echeance:'2026-12-31' }] },
      { id:'ex-d', intitule:'Désigner un conseiller à la sécurité des transports', theme:'Transport', statut:'En vigueur', evaluations:[{ id:'e3', date:'2026-01-05', etat:'Non applicable', par:'RH1' }], actions:[] },
      { id:'ex-e', intitule:'Ancien texte abrogé', statut:'Retirée', retireeLe:'2026-01-01', retireePar:'RH1', evaluations:[{ id:'e4', date:'2025-05-05', etat:'Non conforme' }], actions:[] },
    ]),
    vigie_hse_actions: J([{ id:'pa-conf-ex-c-a1', titre:'Conformité : Évaluer le risque chimique', description:'Compléter les FDS', origine:'Conformité', statut:'Fait', service:'', echeance:'2026-12-31' }]),
  };
  p = await H.page('conformite.html', RH, stock);
  const lignes = () => [...p.d.querySelectorAll('#tbody tr')].map(r => r.cells[0] ? r.cells[0].querySelector('b').textContent : '');
  check('compteurs : 4 en vigueur, 1 conforme (50 % des évaluées), 1 écart, 2 à évaluer ou réévaluer', p.$('kpiTotal').textContent === '4' && p.$('kpiConformes').textContent === '1' && /50 %/.test(p.$('kpiConformesLabel').textContent) && p.$('kpiEcarts').textContent === '1' && p.$('kpiAEvaluer').textContent === '2',
    [p.$('kpiTotal').textContent, p.$('kpiConformes').textContent, p.$('kpiConformesLabel').textContent, p.$('kpiEcarts').textContent, p.$('kpiAEvaluer').textContent]);
  check('ordre : écarts, puis à évaluer, puis conformes, non applicables ; retirée masquée', J(lignes()) === J(['Évaluer le risque chimique', 'Afficher les consignes de sécurité incendie', 'Tenir le registre de sécurité', 'Désigner un conseiller à la sécurité des transports']), lignes());
  check('« À réévaluer » quand la date est passée', /À réévaluer/.test(p.d.querySelectorAll('#tbody tr')[2].textContent));
  check('action soldée au Plan d\'actions : « 1 / 1 soldée »', /1 \/ 1 soldée/.test(p.d.querySelectorAll('#tbody tr')[0].textContent));
  p.choisir('fEtat', 'reevaluer');
  check('filtre « à réévaluer »', J(lignes()) === J(['Tenir le registre de sécurité']), lignes());
  p.choisir('fEtat', 'a-evaluer');
  check('filtre « à évaluer »', J(lignes()) === J(['Afficher les consignes de sécurité incendie']), lignes());
  p.choisir('fEtat', '');
  p.choisir('fTheme', 'Incendie');
  check('filtre par thème', lignes().length === 2, lignes());
  p.choisir('fTheme', '');
  p.choisir('fPerimetre', P);
  check('filtre par périmètre', J(lignes()) === J(['Afficher les consignes de sécurité incendie']), lignes());
  p.choisir('fPerimetre', '-');
  check('filtre « toute l\'organisation »', lignes().length === 3, lignes());
  p.choisir('fPerimetre', '');
  p.$('fTexte').value = 'chimique'; p.ev(p.$('fTexte'), 'input');
  check('recherche plein texte (accents ignorés)', J(lignes()) === J(['Évaluer le risque chimique']), lignes());
  p.$('fTexte').value = ''; p.ev(p.$('fTexte'), 'input');
  p.choisir('fStatut', 'Retirée');
  check('« Retirées » : l\'exigence retirée', J(lignes()) === J(['Ancien texte abrogé']), lignes());
  p.ev(p.d.querySelector('[data-ouvrir="ex-e"]'), 'click');
  check('exigence retirée : formulaire figé, « Remettre en vigueur »', p.$('cIntitule').disabled && !!p.$('btnRemettre') && !p.$('nEtat'));
  p.$('btnRemettre').click();
  check('… remise en vigueur', p.lire(CLE).find(e => e.id === 'ex-e').statut === 'En vigueur' && !p.lire(CLE).find(e => e.id === 'ex-e').retireeLe);
  p.choisir('fStatut', 'En vigueur');
  p.ev(p.d.querySelector('[data-ouvrir="ex-a"]'), 'click');
  p.$('btnRetirer').click();
  const exa = p.lire(CLE).find(e => e.id === 'ex-a');
  check('« Retirer du registre » : statut, date et auteur ; évaluations gardées', exa.statut === 'Retirée' && exa.retireePar === 'RH1' && exa.retireeLe === p.w.VigieDates.aujourdhui() && exa.evaluations.length === 1);
  check('… sortie de la liste en vigueur', !lignes().includes('Tenir le registre de sécurité'));

  // ---------- 6. Veille réglementaire ----------
  p = await H.page('conformite.html', RH, { vigie_hse_veille: J([{ id:'v1', titre:'Décret relatif aux vérifications', source:'Légifrance', url:'https://www.legifrance.gouv.fr/x', date:'2026-09-01', statut:'À lire' }, { id:'v2', titre:'Archivée', date:'2026-01-01', statut:'Archivé' }]) });
  p.$('btnNouveau').click();
  check('veille : les actualités non archivées proposées', p.$('cVeille') && p.$('cVeille').options.length === 2, p.$('cVeille') && p.$('cVeille').options.length);
  p.choisir('cVeille', 'v1');
  check('… choisie : texte de référence et lien complétés', p.$('cReference').value === 'Décret relatif aux vérifications (Légifrance)' && p.$('cLien').value === 'https://www.legifrance.gouv.fr/x');
  p.$('cIntitule').value = 'Vérifier'; p.ev(p.$('ficheForm'), 'submit');
  check('… et l\'exigence garde l\'actualité', p.lire(CLE)[0].veilleId === 'v1');

  // ---------- 7. Lecture seule (droits « consulter ») ----------
  const lecteur = { user:'L1', role:'ag', email:'L1', services:['*'], profils:['Lecteur'], droits:{ conformite:'consulter' } };   // droits posés par la connexion
  const profils = J([{ id:'p-lecteur', nom:'Lecteur', droits:{ conformite:'consulter' } }]);
  p = await H.page('conformite.html', lecteur, Object.assign({ vigie_hse_profils: profils }, stock));
  p.ev(p.d.querySelector('[data-ouvrir="ex-c"]'), 'click');
  check('lecture seule : ni création, ni import ; fiche figée, sans nouvelle évaluation ni bouton d\'enregistrement', !p.$('btnNouveau') && !p.$('btnImport') && p.$('cIntitule').disabled && !p.$('nEtat') && !p.d.querySelector('#fiche [type="submit"]') && !p.navigation(), p.erreurs);

  // ---------- 8. Export et import ----------
  p = await H.page('conformite.html', RH, stock);
  p.$('btnExport').click();
  const wb = (p.ecrits[0] || {}).wb;
  check('export : trois feuilles', wb && J(wb.SheetNames) === J(['Exigences', 'Évaluations', 'Actions']), wb && wb.SheetNames);
  const lignesEx = wb ? XLSX.utils.sheet_to_json(wb.Sheets['Exigences'], { defval:'' }) : [];
  const ra = lignesEx.find(r => r.Identifiant === 'ex-a') || {};
  check('export : la dernière évaluation et l\'état « à évaluer »', lignesEx.length === 5 && ra['État'] === 'Conforme' && ra['Évaluée le'] === '10/01/2025' && ra['Prochaine évaluation'] === '01/06/2025' && ra['Périmètre'] === "Toute l'organisation" && (lignesEx.find(r => r.Identifiant === 'ex-b') || {})['État'] === 'À évaluer', ra);
  check('export : historique et actions', XLSX.utils.sheet_to_json(wb.Sheets['Évaluations']).length === 4 && XLSX.utils.sheet_to_json(wb.Sheets['Actions'])[0]["État au Plan d'actions"] === 'Fait');
  const avant = p.lire(CLE);
  let r = p.w.importer(lignesEx);
  check('réimport de l\'export : rien d\'ajouté ni de modifié', r.ajoutees === 0 && r.modifiees === 0 && r.evaluations === 0 && J(p.lire(CLE)) === J(avant), r);
  r = p.w.importer([
    { 'Exigence':'Former les sauveteurs secouristes', 'Texte de référence':'R4224-15', 'Thème':'Secours', 'Périmètre':"Toute l'organisation", 'État':'NC', 'Évaluée le':'12/03/2026', 'Preuve':'Liste des SST' },
    { 'Identifiant':'ex-b', 'Exigence':'Afficher les consignes de sécurité incendie', 'Responsable':'Gardien', 'État':'Conforme', 'Évaluée le':'01/04/2026', 'Évaluée par':'Bureau de contrôle' },
    { 'Identifiant':'ex-d', 'Exigence':'Désigner un conseiller à la sécurité des transports', 'Statut':'Retirée' },
    { 'Thème':'ligne sans exigence' },
  ]);
  const apres = p.lire(CLE);
  const neuve = apres.find(e => e.intitule === 'Former les sauveteurs secouristes') || {};
  const exb = apres.find(e => e.id === 'ex-b') || {};
  check('import : une ajoutée, deux mises à jour, deux évaluations, une ignorée', r.ajoutees === 1 && r.modifiees === 2 && r.evaluations === 2 && r.ignorees === 1, r);
  check('… la nouvelle : sans service, évaluée « Non conforme » le 12/03/2026 (NC)', !neuve.service && neuve.reference === 'R4224-15' && neuve.evaluations.length === 1 && neuve.evaluations[0].etat === 'Non conforme' && neuve.evaluations[0].date === '2026-03-12' && neuve.evaluations[0].par === 'RH1' && neuve.statut === 'En vigueur', neuve);
  check('… la mise à jour : responsable, évaluation par le bureau de contrôle, service gardé (colonne absente)', exb.responsable === 'Gardien' && exb.service === P && exb.evaluations.length === 1 && exb.evaluations[0].par === 'Bureau de contrôle' && exb.modifiePar === 'RH1', exb);
  check('… « Retirée » : retirée du registre', (apres.find(e => e.id === 'ex-d') || {}).statut === 'Retirée');
  check('… journal d\'audit « Import »', (p.lire('vigie_hse_audit_log') || []).some(a => a.type === 'Import' && /1 exigence\(s\) ajoutée\(s\), 2 mise\(s\) à jour/.test(a.description)));
  // le fichier lui-même, lu par VigieImport (classeur réécrit en .xlsx)
  const buf = XLSX.write(wb, { type:'array', bookType:'xlsx' });
  const relu = p.w.XLSX.utils.sheet_to_json(p.w.VigieImport.lireClasseur(buf).Sheets['Exigences'], { defval:'' });
  check('fichier .xlsx relu par VigieImport : mêmes lignes', relu.length === 5 && relu.some(x => x.Identifiant === 'ex-c'));
  // compte limité à un service
  p = await H.page('conformite.html', RH_PAT, stock);
  check('compte limité (Patrimoine) : ses services et toute l\'organisation', J(lignes().sort()) === J(['Afficher les consignes de sécurité incendie', 'Désigner un conseiller à la sécurité des transports', 'Tenir le registre de sécurité', 'Évaluer le risque chimique'].sort()), lignes());
  r = p.w.importer([{ 'Exigence':'Hors périmètre', 'Périmètre':V }, { 'Exigence':'Du périmètre', 'Périmètre':P }]);
  check('… import : une ligne d\'un autre service ignorée', r.ajoutees === 1 && r.horsPerimetre === 1, r);
  p.$('btnNouveau').click();
  check('… périmètres proposés : toute l\'organisation et ses services', [...p.$('cService').options].map(o => o.value).every(v => !v || v === P), [...p.$('cService').options].map(o => o.value));

  p = await H.page('conformite.html', MAN, stock);
  check("manager (Voirie) : en lecture, les exigences de toute l'organisation et aucune d'un autre service", !p.$('btnNouveau') && !lignes().includes('Afficher les consignes de sécurité incendie') && lignes().includes('Évaluer le risque chimique') && !p.erreurs.length, lignes());

  // ---------- 9. Plan d'actions ----------
  const stockPA = { [CLE]: J([{ id:'ex-v', intitule:'Vérifier les échafaudages', service:V, statut:'En vigueur', evaluations:[], actions:[{ id:'a9', description:'Faire passer le vérificateur', responsable:'Chef d\'équipe', echeance:'2026-11-30' }] }]) };
  const pa = await H.page('plan-actions.html', RH, stockPA);
  const act = (pa.lire('vigie_hse_actions') || []).find(a => a.id === 'pa-conf-ex-v-a9') || {};
  check('Plan d\'actions : l\'action reprise (origine « Conformité », service, entrée, échéance)', act.origine === 'Conformité' && act.titre === 'Conformité : Vérifier les échafaudages' && act.service === V && act.collectivite === 'Ville' && act.echeance === '2026-11-30' && act.responsable === "Chef d'équipe" && !pa.erreurs.length, { act, err: pa.erreurs });
  check('… avec sa pastille d\'origine', !!pa.d.querySelector('.origine-chip.conformite'));
  const paMan = await H.page('plan-actions.html', MAN, stockPA);
  check('… visible du manager de ce service', /Conformité : Vérifier les échafaudages/.test(paMan.d.querySelector('tbody').textContent) && !paMan.erreurs.length, { err: paMan.erreurs, n: paMan.d.querySelectorAll('tbody tr').length, nav: paMan.navigation() });

  // ---------- 10. Revue de direction ----------
  const rd = await H.page('revue-direction.html', RH, stock);
  rd.$('btnNouvelle').click();
  const txt = rd.$('revue') ? rd.$('revue').textContent : '';
  check('revue de direction : bilan de la conformité dans la performance', /Évaluation de la conformité réglementaire/.test(txt) && /exigences en vigueur/.test(txt) && /Évaluer le risque chimique/.test(txt) && /Partiellement conforme/.test(txt) && !rd.erreurs.length, { err: rd.erreurs, t: txt.slice(0, 200) });
  const revue = (rd.lire('vigie_hse_revues_direction') || [])[0] || {};
  check('… photographié avec la revue (4 en vigueur, 50 %)', revue.chiffres && revue.chiffres.conformite && revue.chiffres.conformite.total === 4 && revue.chiffres.conformite.taux === 50 && revue.chiffres.conformite.ecarts.length === 1, revue.chiffres && revue.chiffres.conformite);
  check('… revue antérieure (sans bilan) : rien d\'ajouté', rd.w.conformiteDeLaRevue({}) === '');
  check('… données partielles : bilan non calculé, et dit', (rd.w.VigieStore.complet = () => false, rd.w.conformiteDuJour() === null) && /Bilan non calculé/.test(rd.w.conformiteDeLaRevue({ conformite: null })));

  // ---------- 11. Logique partagée ----------
  const VC = p.w.VigieConformite;
  check('etat : à date égale, la dernière enregistrée ; date invalide ignorée', VC.etat({ evaluations:[{ date:'2026-01-01', etat:'Non conforme' }, { date:'2026-01-01', etat:'Conforme' }, { date:'n/a', etat:'Non conforme' }] }, '2026-02-01').code === 'conforme');
  check('etat : à évaluer sans évaluation ; à réévaluer seulement une fois la date passée', VC.etat({}, '2026-01-01').code === 'a-evaluer' && !VC.etat({ prochaineEvaluation:'2026-01-01', evaluations:[{ date:'2025-01-01', etat:'Conforme' }] }, '2026-01-01').aReevaluer && VC.etat({ prochaineEvaluation:'2026-01-01', evaluations:[{ date:'2025-01-01', etat:'Conforme' }] }, '2026-01-02').aReevaluer);
  const s = VC.synthese([{ evaluations:[{ date:'2026-01-01', etat:'Conforme' }] }, { evaluations:[{ date:'2026-01-01', etat:'Non applicable' }] }, { statut:'Retirée', evaluations:[{ date:'2026-01-01', etat:'Non conforme' }] }, null, 'x'], '2026-02-01');
  check('synthese : taux hors non applicables, retirées et entrées invalides ignorées', s.total === 2 && s.taux === 100 && s.nonApplicables === 1 && s.nonConformes === 0, s);

  // ---------- 12. Droits, serveur, registre, libellés ----------
  const Droits = require(ROOT + 'serveur/droits.js'), Lecture = require(ROOT + 'serveur/lecture.js');
  const W = p.w;
  const defs = W.VigieDroits.MODULES ? W.VigieDroits.MODULES.find(m => m.id === 'conformite') : null;
  const res = (S, st) => W.VigieDroits.pour(S, st);
  check('catalogue : module « conformite » (Pilotage) ; Administrateur, RH et Préventeur gèrent, Manager consulte, Agent sans accès', (!W.VigieDroits.MODULES || (defs && defs.section === 'Pilotage')) && res(ADMIN).peut('conformite', 'gerer') && res(RH).peut('conformite', 'gerer') && res(PREV).peut('conformite', 'gerer') && res(MAN).peut('conformite', 'consulter') && !res(MAN).peut('conformite', 'gerer') && !res(AG).peut('conformite', 'consulter'));
  const sess = (profils) => ({ user:'x', profils, services:['*'] });
  const niv = (pr) => Droits.niveau(sess(pr), CLE);
  check('serveur, écriture : RH et Préventeur complet, manager aucun', niv(['p-rh']) === 'complet' && niv(['p-preventeur']) === 'complet' && niv(['p-manager']) === 'aucun' && niv(['p-admin']) === 'complet', [niv(['p-rh']), niv(['p-preventeur']), niv(['p-manager'])]);
  check('serveur : règle explicite pour la clé', Droits.cles.includes(CLE));
  const pageDe = (profils) => Object.assign(sess(profils), { droits: undefined });
  const vueAgent = JSON.parse(Lecture.vue(pageDe(['p-agent']), CLE, stock[CLE]));
  check('serveur, lecture : un agent ne reçoit que identifiant, intitulé, service, actions', J(Object.keys(vueAgent[2]).sort()) === J(['actions', 'id', 'intitule']) && J(Object.keys(vueAgent[1]).sort()) === J(['actions', 'id', 'intitule', 'service']) && Lecture.regle(pageDe(['p-rh']), CLE) === null && Lecture.regle(pageDe(['p-manager']), CLE) === null, vueAgent);
  check('VigieStore.CLES : registre de données, non sensible', W.VigieStore.CLES[CLE] && W.VigieStore.CLES[CLE].nature === 'donnees' && W.VigieStore.CLES[CLE].sensible === false);
  W.eval(require('fs').readFileSync(ROOT + 'assets/libelles-champs.js', 'utf8'));
  check('libellés : évaluations et prochaine évaluation', W.VigieLibelles.libelle(CLE, 'evaluations') === 'Évaluations de conformité' && W.VigieLibelles.libelle(CLE, 'prochaineEvaluation') === 'Prochaine évaluation');

  fin();
})().catch(e => { console.error(e); process.exit(2); });
