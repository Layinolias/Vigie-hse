// Préparation ISO 45001 (2026-10-16) : la carte de couverture lue en direct — accès, états du jour calculés depuis les
// registres (sans écriture), audit interne de chaque exigence, filtres, données partielles, impression, export.
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };
const ADMIN = { user:'admin@verchamps.fr', role:'admin', email:'admin@verchamps.fr', services:['*'], modulePermissions:{} };
const MAN = { user:'manager@verchamps.fr', role:'manager', email:'manager@verchamps.fr', services:['Voirie & Réseaux'], modulePermissions:{} };
const PREV = { user:'PREV1', role:'ag', email:'PREV1', services:['*'], profils:['p-agent', 'p-preventeur'] };
const AG = { user:'AG1', role:'ag', email:'AG1', services:['*'], modulePermissions:{} };
const J = (o) => JSON.stringify(o);

(async () => {
  // ---------- 1. Accès ----------
  for (const [nom, S, ouvert] of [['RH', RH, true], ['administrateur', ADMIN, true], ['préventeur', PREV, true], ['manager', MAN, false], ['agent', AG, false]]){
    const p = await H.page('preparation-iso.html', S, {});
    check(`accès ${nom} : ${ouvert ? 'page ouverte' : 'renvoyé au tableau de bord'}`, p.navigation() === !ouvert && !p.erreurs.length, { nav: p.navigation(), err: p.erreurs });
    const d = await H.page('dashboard.html', S, {});
    check(`menu ${nom} : lien « Préparation ISO 45001 » ${ouvert ? 'présent' : 'absent'}`, !!d.d.querySelector('a[href="preparation-iso.html"]') === ouvert);
  }

  // ---------- 2. Installation vide ----------
  let p = await H.page('preparation-iso.html', PREV, {});
  const ligne = (c) => p.d.querySelector(`#tbody tr[data-clause="${c}"]`);
  const etat = (c) => { const l = ligne(c); return l ? l.querySelectorAll('td')[2].textContent.trim() : null; };
  check('30 exigences sous 7 chapitres, rien d\'écrit', p.d.querySelectorAll('#tbody tr[data-clause]').length === 30 && p.d.querySelectorAll('#tbody tr.chap').length === 7 && Object.keys(p.stockage()).length === 0, Object.keys(p.stockage()));
  check('… hors outil : 4.4, 7.1, 10.1 ; les autres sans enregistrement, domaine d\'application (4.3) compris', ['4.4', '7.1', '10.1'].every(c => etat(c) === 'Hors outil') && etat('4.3') === 'Aucun enregistrement' && etat('9.2') === 'Aucun enregistrement' && etat('5.2') === 'Aucun enregistrement');
  check('… compteurs : 0 avec enregistrements, 0 à reprendre, 27 sans, 30 jamais auditées', p.$('kpiPret').textContent === '0' && p.$('kpiReprendre').textContent === '0' && p.$('kpiRien').textContent === '27' && p.$('kpiJamais').textContent === '30');
  check('… la couverture de l\'outil : 26 couvertes, 1 en partie, 3 hors outil, avec ce qui manque', /26 exigences couvertes par l'outil, 1 en partie, 3 hors outil/.test(p.$('calculNote').textContent) && /Manque : les mesures déjà en place au Document unique/.test(ligne('8.1.2').textContent) && !/Manque/.test(ligne('10.3').textContent) && !/Manque/.test(ligne('8.1.4').textContent) && !/Manque/.test(ligne('7.4').textContent) && !/Manque/.test(ligne('7.5').textContent) && !/Manque/.test(ligne('4.3').textContent) && !!ligne('5.2').querySelector('a[href="politique-sante-securite.html"]'));

  // ---------- 3. Des registres ----------
  const ts = new Date().toISOString();
  const stock = {
    vigie_hse_contexte: J([{ id:'e1', registre:'enjeu', origine:'Interne', theme:'Autre', texte:'Réorganisation', dateCreation: ts }, { id:'p1', registre:'partie', partie:'Agents', besoins:'Être informés', exigence:true, dateCreation: ts },
      { id:'r1', registre:'ro', type:'Risque', niveau:'Élevée', texte:'Départ du seul assistant', actions:[], dateCreation: ts }]),
    vigie_hse_politiques: J([{ id:'pol-1', version:1, statut:'En vigueur', texte:'t', engagements:['conditions'], signataire:'Maire', dateSignature:'2025-01-01', prochaineRevue:'2026-01-01', publieLe:'2025-01-01' }]),
    vigie_hse_duerp_dataset: J([{ id:'d1', dateEvaluation:'2026-01-01', frequence:2, gravite:2, service:'Voirie & Réseaux' }]),
    vigie_hse_changements: J([{ id:'c1', titre:'Tondeuse', datePrevue:'2026-01-01', dateMiseEnOeuvre:'2026-01-02', duerp:true, risques:[] }]),
    vigie_hse_actions: J([{ id:'a1', statut:'À faire', echeance:'2020-01-01', dateCreation:'2026-01-01' }, { id:'a2', statut:'Fait', echeance:'2026-01-01', dateCreation:'2026-01-01' }]),
    vigie_hse_exigences: J([{ id:'x1', intitule:'Registre de sécurité', statut:'En vigueur' }]),
    vigie_hse_audits_internes: J([{ id:'au1', titre:'Audit 2026', clauses:['9.2', '5.2'], datePrevue:'2026-03-01', dateRealisee:'2026-03-01', auditeur:'Préventeur', constats:[] }]),
    vigie_hse_revues_direction: J([{ id:'rv1', statut:'Validée', dateRevue:'2026-06-30' }, { id:'rv2', statut:'Brouillon', dateRevue:'2026-09-30' }]),
  };
  p = await H.page('preparation-iso.html', PREV, stock);
  const faits = (c) => ligne(c).querySelectorAll('td')[3].textContent;
  check('contexte : enjeux et parties « à reprendre » (registre jamais revu), risque sans action', etat('4.1') === 'Des points à reprendre' && /1 enjeu \(1 interne, 0 externe\)/.test(faits('4.1')) && /revue annuelle à faire/.test(faits('4.1')) && etat('4.2') === 'Des points à reprendre' && /1 obligation à suivre/.test(faits('4.2')) && etat('6.1.1') === 'Des points à reprendre' && /1 élément sans action/.test(faits('6.1.1')) && /1 d'importance élevée/.test(faits('6.1.1')));
  check('politique : revue dépassée → à reprendre (version, signature, engagements 1 / 7)', etat('5.2') === 'Des points à reprendre' && /version 1, signée le 01\/01\/2025/.test(faits('5.2')) && /prochaine revue le 01\/01\/2026 : dépassée/.test(faits('5.2')) && /1 \/ 7 engagements/.test(faits('5.2')));
  check('Document unique : une évaluation, et un changement qui en demande la mise à jour → à reprendre', etat('6.1.2') === 'Des points à reprendre' && /1 évaluation au Document unique/.test(faits('6.1.2')) && /1 changement demande sa mise à jour/.test(faits('6.1.2')));
  check('changements : Document unique et mise en œuvre sans validation → à reprendre', etat('8.1.3') === 'Des points à reprendre' && /1 changement demande la mise à jour du Document unique/.test(faits('8.1.3')) && /1 mise en œuvre sans validation/.test(faits('8.1.3')));
  check('Plan d\'actions : une action en retard → à reprendre ; amélioration : une action faite', etat('6.1.4') === 'Des points à reprendre' && /2 actions, 1 faite/.test(faits('6.1.4')) && /1 action en retard/.test(faits('6.1.4')) && etat('10.3') === 'Des enregistrements');
  check('conformité : exigence au registre (6.1.3), jamais évaluée (9.1.2 à reprendre)', etat('6.1.3') === 'Des enregistrements' && /1 exigence applicable/.test(faits('6.1.3')) && etat('9.1.2') === 'Des points à reprendre' && /1 exigence jamais évaluée/.test(faits('9.1.2')));
  check('audit interne : un audit réalisé ; dernier audit de 9.2 et 5.2, les autres jamais auditées', etat('9.2') === 'Des enregistrements' && /1 audit réalisé/.test(faits('9.2')) && /28 clauses jamais auditées/.test(faits('9.2')) && /dernier le 01\/03\/2026/.test(ligne('9.2').querySelectorAll('td')[4].textContent) && /jamais auditée/.test(ligne('4.1').querySelectorAll('td')[4].textContent) && p.$('kpiJamais').textContent === '28');
  check('revue de direction : une validée (5.1 et 9.3), une en préparation', etat('9.3') === 'Des enregistrements' && /1 revue validée, la dernière le 30\/06\/2026/.test(faits('9.3')) && /1 revue en préparation/.test(faits('9.3')) && etat('5.1') === 'Des enregistrements');
  check('… rien n\'est écrit par la page', J(Object.keys(p.stockage()).sort()) === J(Object.keys(stock).sort()) && Object.keys(stock).every(k => p.stockage()[k] === stock[k]));

  // ---------- 4. Filtres ----------
  p.choisir('fEtat', 'areprendre');
  check('filtre « points à reprendre » : les 9 exigences concernées (dont 10.2 : efficacité à vérifier)', p.d.querySelectorAll('#tbody tr[data-clause]').length === Number(p.$('kpiReprendre').textContent) && p.$('kpiReprendre').textContent === '9' && etat('10.2') === 'Des points à reprendre' && /efficacité est à vérifier/.test(faits('10.2')), p.$('kpiReprendre').textContent);
  p.choisir('fEtat', '');
  p.choisir('fCouverture', 'hors');
  check('filtre « hors outil » : 3 exigences', p.d.querySelectorAll('#tbody tr[data-clause]').length === 3);
  p.choisir('fCouverture', '');

  // ---------- 5. Données partielles ----------
  p.w.VigieStore.complet = (c) => c !== 'vigie_hse_contexte';
  p.$('btnRecalculer').click();
  check('un registre reçu en partie : ses exigences « non calculées », dit', etat('4.1') === 'Non calculé' && etat('6.1.1') === 'Non calculé' && /ne reçoit pas toutes les données/.test(faits('4.1')) && /non calculée/.test(p.$('kpiRienLabel').textContent) && etat('5.2') === 'Des points à reprendre');
  p.w.VigieStore.complet = () => true;
  p.$('btnRecalculer').click();

  // ---------- 6. Impression, export ----------
  let imprime = null;
  p.w.print = () => { imprime = p.d.getElementById('prep-impression') ? p.d.getElementById('prep-impression').textContent : ''; };
  p.$('btnImprimer').click();
  check('impression : les 30 exigences par chapitre, l\'état et les faits, la marque', /Préparation ISO 45001/.test(imprime || '') && /4 — /.test(imprime) && /version 1, signée le/.test(imprime) && imprime.includes(p.w.VigieMarque.nom()));
  p.ev(p.w, 'afterprint');
  check('… bloc retiré après impression', !p.d.getElementById('prep-impression'));
  p.$('btnExport').click();
  const wb = (p.ecrits.pop() || {}).wb;
  const rows = wb ? H.XLSX.utils.sheet_to_json(wb.Sheets['Préparation ISO 45001'], { defval:'' }) : [];
  check('export : 30 lignes (exigence, outil, manque, état, faits, audit, où)', rows.length === 30 && rows.some(r => /^5\.2 /.test(r['Exigence']) && r['Aujourd\'hui'] === 'Des points à reprendre' && /dépassée/.test(r['Ce que montrent les enregistrements']) && /dernier le/.test(r['Audit interne'])));

  // ---------- 7. Logique, droits ----------
  const VPR = p.w.VigiePreparation;
  check('couverture : les 30 exigences d\'ISO 45001 connues de l\'audit interne, et elles seules', J(Object.keys(VPR.COUVERTURE).sort()) === J(p.w.VigieAuditInterne.CLAUSES.map(c => c[0]).sort()));
  const s = VPR.synthese([{ etat:'pret', couverture:'couverte', audit:{ audits:0 } }, { etat:'hors', couverture:'hors', audit:{ audits:2 } }, { etat:'partiel', couverture:'partielle', audit:null }]);
  check('synthese', s.pret === 1 && s.hors === 1 && s.partiel === 1 && s.couvertes === 1 && s.partielles === 1 && s.jamaisAuditees === 1);
  const W = p.w, res = (S) => W.VigieDroits.pour(S);
  check('droits : module « preparation-iso » (Pilotage, consulter) ; Préventeur, Administrateur, RH ; ni manager ni agent', res(PREV).peut('preparation-iso', 'consulter') && res(RH).peut('preparation-iso', 'consulter') && res(ADMIN).peut('preparation-iso', 'consulter') && !res(MAN).peut('preparation-iso', 'consulter') && !res(AG).peut('preparation-iso', 'consulter') && (!W.VigieDroits.MODULES || (W.VigieDroits.MODULES.find(m => m.id === 'preparation-iso') || {}).section === 'Pilotage'));
  check('icône du menu : i-check-square', !!W.VigieIcones.ICONES['i-check-square']);

  fin();
})().catch(e => { console.error(e); process.exit(2); });
