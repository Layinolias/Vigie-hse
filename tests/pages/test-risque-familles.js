// Déclaration AT/MP : le risque se choisit dans les familles de risque (2026-11-19), plus dans
// l'ancienne liste « Risques (Registre AT/MP) », retirée de l'éditeur des référentiels.
//   RACINE=<dossier> node test-risque-familles.js
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };
const ADMIN = { user:'admin@verchamps.fr', role:'admin', email:'admin@verchamps.fr', services:['*'], modulePermissions:{} };

const fiche = (id, risque) => ({ id, collectivite:'Ville', dateAT:'2026-03-12', typeAtMp:'Accident de travail', nom:'N' + id, prenom:'P',
  service:'Voirie & Réseaux', arret:false, joursArret:0, circonstances:'c', risque });
const DONNEES = [fiche('r1', 'Routier'), fiche('r2', "Chute d'objet"), fiche('r3', 'Risque inconnu'), fiche('r4', 'RPS'), fiche('r5', 'Chute de plain pied')];
const STOCK = { vigie_hse_dataset: JSON.stringify(DONNEES) };
const options = p => [...p.$('fRisque').options].filter(o => o.value).map(o => o.value);

(async () => {
  // ----- nouvelle déclaration -----
  const p = await H.page('saisie-rh.html', RH, STOCK);
  const o = options(p);
  check('libellé « Famille de risque »', /Famille de risque/.test(p.d.querySelector('label[for="fRisque"]').textContent));
  check('la liste propose les 33 familles de risque', o.length === 33, o.length);
  check('« Routiers » proposé, plus « Routier »', o.includes('Routiers') && !o.includes('Routier'));
  check('familles du Document unique (ex. « Bruit », « Travail isolé »)', o.includes('Bruit') && o.includes('Travail isolé'));

  // Une famille ajoutée dans Administration est proposée
  const ref = { risqueFamillesDUERP: [['Déneigement', 'Engins de nuit'], ['Bruit', '']] };
  const p2 = await H.page('saisie-rh.html', RH, Object.assign({ vigie_hse_referentials: JSON.stringify(ref) }, STOCK));
  check('liste réglée dans les référentiels : ses familles', options(p2).join('|') === 'Déneigement|Bruit', options(p2));

  // ----- fiches existantes : ancienne valeur ramenée à sa famille -----
  const attendu = { r1:'Routiers', r2:"Effondrements et aux chutes d'objets", r4:'RPS', r5:'Chute de plain-pied' };
  for (const [id, fam] of Object.entries(attendu)){
    const q = await H.page('saisie-rh.html', RH, STOCK, '?id=' + id);
    check(`fiche « ${DONNEES.find(d => d.id === id).risque} » → « ${fam} »`, q.$('fRisque').value === fam, q.$('fRisque').value);
  }
  const q3 = await H.page('saisie-rh.html', RH, STOCK, '?id=r3');
  check('libellé sans famille gardé tel quel', q3.$('fRisque').value === 'Risque inconnu', q3.$('fRisque').value);
  check('… signalé « hors familles de risque »', /hors familles de risque/.test(q3.$('fRisque').selectedOptions[0].textContent));

  // ----- Administration -----
  const a = await H.page('administration.html', ADMIN, {});
  const listes = [...a.$('refSelect').options].map(x => x.value);
  check('éditeur : plus de liste « Risques (Registre AT/MP) »', !listes.includes('risquesATMP'), listes);
  check('éditeur : familles de risque nommées pour les deux registres',
    /Document Unique, Registre AT\/MP/.test([...a.$('refSelect').options].find(x => x.value === 'risqueFamillesDUERP').textContent));

  // Un fichier de référentiels à l'ancien libellé s'importe encore dans les familles
  const ws = H.XLSX.utils.json_to_sheet([{ 'Liste':'Familles de risque (Document Unique)', 'Valeur':'Famille de test', 'Définition':'Définition de test' }]);
  const wb = H.XLSX.utils.book_new(); H.XLSX.utils.book_append_sheet(wb, ws, 'Référentiels');
  const buf = H.XLSX.write(wb, { type:'array', bookType:'xlsx' });
  Object.defineProperty(a.$('refImportFile'), 'files', { value:[{ arrayBuffer: async () => buf }], configurable:true });
  a.ev(a.$('refImportFile'), 'change');
  await H.sleep(80);
  const fam = (a.lire('vigie_hse_referentials') || {}).risqueFamillesDUERP || [];
  check('import à l\'ancien libellé : famille ajoutée', fam.some(f => Array.isArray(f) && f[0] === 'Famille de test' && f[1] === 'Définition de test'), a.alertes);

  check('aucune erreur JS', [p, p2, q3, a].every(x => x.erreurs.length === 0), [p, p2, q3, a].map(x => x.erreurs));
  fin();
})().catch(e => { console.error(e); process.exit(2); });
