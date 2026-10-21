// Registre des documents officiels, circuit d'un document (ISO 45001 § 7.5, 2026-10-21) : composant, page (documents
// d'avant le circuit, brouillon, soumission, approbation, nouvelle version, revue, export, lecteurs), Préparation ISO 45001.
//   RACINE=<dossier> node test-documents.js
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };
const PREV = { user:'PREV1', role:'ag', email:'PREV1', services:['*'], profils:['p-agent', 'p-preventeur'] };
const AG = { user:'AG1', role:'ag', email:'AG1', services:['*'], modulePermissions:{} };
const CLE = 'vigie_hse_documents';
const J = (o) => JSON.stringify(o);
const ids = (p) => [...p.d.querySelectorAll('#docTbody tr[data-id]')].map(r => r.dataset.id).sort().join(' ');
const ligne = (p, id) => p.d.querySelector(`#docTbody tr[data-id="${id}"]`);

(async () => {
  // ---------- 1. Composant ----------
  const p0 = await H.page('base-documentaire.html', RH, {});
  const V = p0.w.VigieDocuments, AJD = p0.w.VigieDates ? p0.w.VigieDates.aujourdhui() : null;
  const jour = '2026-06-01';
  check('page sans erreur', !p0.erreurs.length, p0.erreurs);
  check('statuts du circuit ; en préparation : brouillon, à approuver', J(V.STATUTS) === J(['Brouillon', 'À approuver', 'En vigueur', 'Obsolète']) && V.enPreparation({ statut:'Brouillon' }) && V.enPreparation({ statut:'À approuver' }) && !V.enPreparation({ statut:'En vigueur' }) && !V.enPreparation(null));
  check('approuvé : qui et date ; à revoir : en vigueur, date de revue passée', V.approuve({ approuvePar:'DGS', dateApprobation:'2026-01-02' }) && !V.approuve({ approuvePar:'DGS' }) && !V.approuve({ approuvePar:' ', dateApprobation:'2026-01-02' })
    && V.aRevoir({ statut:'En vigueur', revue:'2026-05-31' }, jour) && !V.aRevoir({ statut:'En vigueur', revue:'2026-06-01' }, jour) && !V.aRevoir({ statut:'Obsolète', revue:'2026-01-01' }, jour) && !V.aRevoir({ statut:'En vigueur' }, jour));
  const L = [{ id:'a', version:'v1', statut:'Obsolète', remplacePar:'b' }, { id:'b', version:'v2', statut:'Obsolète', remplace:'a' }, { id:'c', version:'v3', statut:'En vigueur', remplace:'b', approuvePar:'DGS', dateApprobation:'2026-01-01', revue:'2026-03-01', origine:'Externe' },
    { id:'d', statut:'À approuver' }, { id:'e', statut:'Brouillon' }, { id:'f', statut:'En vigueur' }, { id:'x', remplace:'y' }, { id:'y', remplace:'x' }, null, { titre:'sans id' }];
  check('versions : la chaîne de la plus ancienne à la plus récente, de n\'importe quel maillon ; sans boucle', V.versions(L, 'b').map(d => d.id).join('') === 'abc' && V.versions(L, 'a').map(d => d.id).join('') === 'abc' && V.versions(L, 'f').map(d => d.id).join('') === 'f' && V.versions(L, 'x').length === 2 && V.versions(L, 'zz').length === 0);
  const s = V.synthese(L, jour);
  check('synthèse : total, en vigueur, approuvés, à approuver, brouillons, obsolètes, à revoir, externes', s.total === 8 && s.enVigueur === 2 && s.approuves === 1 && s.aApprouver === 1 && s.brouillons === 1 && s.obsoletes === 2 && s.aRevoir === 1 && s.externes === 1, s);

  // ---------- 2. Documents d'avant le circuit, nouveau document direct ----------
  const ANCIENS = [{ id:'doc-1', titre:'Règlement intérieur', categorie:'Règlement', reference:'RI-2024', version:'v1', dateDocument:'2024-01-15', statut:'En vigueur', masque:false, lien:'https://intranet.exemple/ri', description:'', auteur:'admin', dateCreation:'2024-01-15' },
    { id:'doc-2', titre:'Ancienne note', categorie:'Note de service', statut:'Obsolète', masque:false }];
  let p = await H.page('base-documentaire.html', RH, { [CLE]: J(ANCIENS) });
  check('documents d\'avant le circuit : affichés, « Approbation non notée », « Nouvelle version » sur le document en vigueur', !p.erreurs.length && ids(p) === 'doc-1 doc-2' && /Approbation non notée/.test(ligne(p, 'doc-1').textContent) && !!ligne(p, 'doc-1').querySelector('[data-version]') && !ligne(p, 'doc-2').querySelector('[data-version]'));
  p.$('btnNewDoc').click();
  check('nouveau document : en vigueur, origine interne, champs du circuit', p.$('dStatut').value === 'En vigueur' && p.$('dOrigine').value === 'Interne' && ['dApprouvePar', 'dDateApprobation', 'dRevue', 'dConservation'].every(i => !!p.$(i)) && [...p.$('dStatut').options].map(o => o.value).join('|') === 'Brouillon|À approuver|En vigueur|Obsolète');
  p.$('dTitre').value = 'Consignes <b>incendie</b>'; p.$('dRevue').value = '2020-01-01'; p.$('dConservation').value = '5 ans après son remplacement';
  p.ev(p.$('docForm'), 'submit');
  let docs = () => p.lire(CLE) || [];
  let n = docs().find(d => d.titre === 'Consignes <b>incendie</b>') || {};
  check('enregistré directement en vigueur, sans approbation exigée ; champs vides absents', !p.alertes.length && n.statut === 'En vigueur' && n.origine === 'Interne' && n.revue === '2020-01-01' && n.conservation === '5 ans après son remplacement' && !('approuvePar' in n) && !('remplace' in n), n);
  check('… date de revue passée : pastille « À revoir », filtre « À revoir », texte échappé', /À revoir depuis le 01\/01\/2020/.test(ligne(p, n.id).textContent) && !!ligne(p, n.id).querySelector('.chip.late') && !p.d.querySelector('#docTbody b b') && (p.choisir('dStatutFiltre', 'arevoir'), ids(p) === n.id));
  p.choisir('dStatutFiltre', 'all');

  const pext = await H.page('base-documentaire.html', RH, { [CLE]: J([{ id:'ext', titre:'Notice nacelle', statut:'En vigueur', origine:'Externe' }]) });
  check('document externe en vigueur : « Origine externe », pas « Approbation non notée »', /Origine externe/.test(ligne(pext, 'ext').textContent) && !/Approbation non notée/.test(ligne(pext, 'ext').textContent));

  // ---------- 3. Brouillon, soumission, approbation ----------
  p.$('btnNewDoc').click();
  p.$('dTitre').value = 'Procédure travaux en hauteur'; p.$('dStatut').value = 'Brouillon'; p.$('dOrigine').value = 'Interne';
  p.ev(p.$('docForm'), 'submit');
  let b = docs().find(d => d.titre === 'Procédure travaux en hauteur') || {};
  check('brouillon : « Soumettre »', b.statut === 'Brouillon' && !!ligne(p, b.id).querySelector('[data-soumettre]') && !!ligne(p, b.id).querySelector('.chip.info'));
  ligne(p, b.id).querySelector('[data-soumettre]').click();
  b = docs().find(d => d.id === b.id);
  check('soumis : à approuver, par qui et quand ; « Approuver » ; journal', b.statut === 'À approuver' && b.soumisPar === 'RH1' && /^\d{4}-\d{2}-\d{2}$/.test(b.dateSoumission) && !!ligne(p, b.id).querySelector('[data-approuver]') && /Soumis par RH1/.test(ligne(p, b.id).textContent) && (p.lire('vigie_hse_audit_log') || []).some(a => /soumis pour approbation/.test(a.description)));
  ligne(p, b.id).querySelector('[data-approuver]').click();
  check('« Approuver » : formulaire en vigueur, date d\'approbation du jour, qui a soumis', p.$('docFormTitle').textContent === 'Approuver le document' && p.$('dStatut').value === 'En vigueur' && /^\d{4}-\d{2}-\d{2}$/.test(p.$('dDateApprobation').value) && /Soumis pour approbation par RH1/.test(p.$('dCircuit').textContent));
  p.ev(p.$('docForm'), 'submit');
  check('contrôle : qui a approuvé', /qui l'a approuvé/.test(p.alertes.pop() || '') && docs().find(d => d.id === b.id).statut === 'À approuver');
  p.$('dApprouvePar').value = 'M. Bernard, DGS'; p.ev(p.$('docForm'), 'submit');
  b = docs().find(d => d.id === b.id);
  check('approuvé : en vigueur, qui et quand, affiché ; journal', b.statut === 'En vigueur' && b.approuvePar === 'M. Bernard, DGS' && /Approuvé par M\. Bernard, DGS le/.test(ligne(p, b.id).textContent) && (p.lire('vigie_hse_audit_log') || []).some(a => /approuvé par M\. Bernard/.test(a.description)));

  // ---------- 4. Nouvelle version ----------
  ligne(p, 'doc-1').querySelector('[data-version]').click();
  check('« Nouvelle version » : titre et type repris, brouillon, version vide, ce qu\'elle remplace', p.$('docFormTitle').textContent === 'Nouvelle version du document' && p.$('dTitre').value === 'Règlement intérieur' && p.$('dStatut').value === 'Brouillon' && p.$('dVersion').value === '' && p.$('dLien').value === '' && /Remplace la version v1 \(En vigueur\)/.test(p.$('dCircuit').textContent));
  p.$('dVersion').value = 'v2'; p.$('dStatut').value = 'En vigueur'; p.ev(p.$('docForm'), 'submit');
  check('mise en vigueur directe d\'une nouvelle version : approbation exigée', /qui l'a approuvé/.test(p.alertes.pop() || '') && docs().length === 4);
  p.$('dStatut').value = 'Brouillon'; p.ev(p.$('docForm'), 'submit');
  const v2 = docs().find(d => d.version === 'v2') || {};
  check('v2 en brouillon : remplace v1 ; v1 toujours en vigueur, sans « Nouvelle version » tant que la v2 se prépare', v2.remplace === 'doc-1' && docs().find(d => d.id === 'doc-1').statut === 'En vigueur' && !ligne(p, 'doc-1').querySelector('[data-version]') && /Remplace la version v1/.test(ligne(p, v2.id).textContent));
  ligne(p, v2.id).querySelector('[data-edit]').click();
  p.$('dStatut').value = 'En vigueur'; p.$('dApprouvePar').value = 'Mme Durand'; p.$('dDateApprobation').value = '2026-03-01';
  p.ev(p.$('docForm'), 'submit');
  const v1 = docs().find(d => d.id === 'doc-1');
  check('v2 en vigueur : v1 obsolète, remplacée par v2, à la date du jour ; journal', docs().find(d => d.id === v2.id).statut === 'En vigueur' && v1.statut === 'Obsolète' && v1.remplacePar === v2.id && /^\d{4}-\d{2}-\d{2}$/.test(v1.dateObsolete) && /Remplacé par la version v2/.test(ligne(p, 'doc-1').textContent) && (p.lire('vigie_hse_audit_log') || []).some(a => /obsolète : remplacé par la version v2/.test(a.description)));
  ligne(p, v2.id).querySelector('[data-edit]').click();
  check('… la fiche de v2 montre les versions', /Versions : v1 \(Obsolète\) → v2 \(En vigueur\)/.test(p.$('dCircuit').textContent));
  p.$('dCancel').click();

  // ---------- 5. Export ----------
  p.$('btnExport').click();
  const wb = (p.ecrits[0] || {}).wb, dx = wb ? H.XLSX.utils.sheet_to_json(wb.Sheets['Documents']) : [];
  const x2 = dx.find(r => r['Version'] === 'v2') || {}, xb = dx.find(r => r['Titre'] === 'Procédure travaux en hauteur') || {};
  check('export : origine, approbation, revue, conservation, versions', x2['Approuvé par'] === 'Mme Durand' && x2['Date d\'approbation'] === '01/03/2026' && x2['Remplace'] === 'doc-1' && xb['Soumis par'] === 'RH1' && xb['Origine'] === 'Interne' && (dx.find(r => r['ID'] === 'doc-1') || {})['Remplacé par'] === v2.id, { x2, xb });

  // ---------- 6. Lecteurs ----------
  const tous = p.lire(CLE).concat([{ id:'doc-br', titre:'Brouillon caché', statut:'Brouillon' }, { id:'doc-ap', titre:'À approuver caché', statut:'À approuver' }, { id:'doc-mq', titre:'Masqué', statut:'En vigueur', masque:true }]);
  const pa = await H.page('base-documentaire.html', AG, { [CLE]: J(tous) });
  const vus = ids(pa);
  check('lecteur : ni brouillon, ni à approuver, ni masqué ; ni boutons du circuit', !pa.erreurs.length && !/doc-br|doc-ap|doc-mq/.test(vus) && /doc-1/.test(vus) && /doc-2/.test(vus) && !pa.d.querySelector('[data-soumettre], [data-approuver], [data-version]'), vus);
  check('… ni la version suivante d\'un document qu\'il ne voit pas (texte « Remplacé par » réservé aux rédacteurs)', !/Remplacé par/.test(pa.$('docTbody').textContent));

  // ---------- 7. Préparation ISO 45001 ----------
  const faits = (pp) => { const r = pp.d.querySelector('tr[data-clause="7.5"]'); return r ? r.textContent : ''; };
  const etat = (pp) => pp.w.VigiePreparation.evaluer(pp.w.VigieStore, pp.w.VigieDates.aujourdhui()).find(x => x.clause === '7.5');
  let pp = await H.page('preparation-iso.html', PREV, {});
  check('préparation, rien : 7.5 « Aucun enregistrement », couverte', !pp.erreurs.length && etat(pp).etat === 'rien' && /aucun document au registre/.test(faits(pp)) && pp.w.VigiePreparation.COUVERTURE['7.5'].c === 'couverte' && !pp.w.VigiePreparation.COUVERTURE['7.5'].manque);
  pp = await H.page('preparation-iso.html', PREV, { [CLE]: J(L.filter(Boolean).concat([{ id:'g', statut:'En vigueur', revue:'2000-01-01' }])) });
  check('… le registre : en vigueur et approuvés, à approuver, brouillons, revue passée, externes', etat(pp).etat === 'pret' && /9 documents au registre, 3 en vigueur \(1 avec l'approbation notée\)/.test(faits(pp)) && /1 document à approuver, 1 brouillon/.test(faits(pp)) && /2 documents en vigueur dont la date de revue est passée/.test(faits(pp)) && /1 document d'origine externe/.test(faits(pp)), faits(pp).slice(0, 400));
  check('… couverture : 24 couvertes, 3 en partie', Object.values(pp.w.VigiePreparation.COUVERTURE).filter(c => c.c === 'couverte').length === 24 && Object.values(pp.w.VigiePreparation.COUVERTURE).filter(c => c.c === 'partielle').length === 3);
  const lp = pp.w.VigiePreparation.evaluer(Object.assign({}, pp.w.VigieStore, { complet: (c) => c !== CLE }), pp.w.VigieDates.aujourdhui()).find(x => x.clause === '7.5');
  check('… registre partiel pour ce compte : « Non calculé »', lp.etat === 'partiel');
  const W = p0.w; W.eval(require('fs').readFileSync(H.ROOT + 'assets/libelles-champs.js', 'utf8'));
  check('libellés : approuvé par, conservation', /Approuvé par/.test(W.VigieLibelles.libelle(CLE, 'approuvePar')) && /conservation/.test(W.VigieLibelles.libelle(CLE, 'conservation')));

  fin();
})().catch(e => { console.error(e); process.exit(2); });
