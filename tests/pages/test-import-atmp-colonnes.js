// Registre AT/MP : un fichier exporté par le logiciel se réimporte sans perdre de colonne (2026-11-19).
// Défaut corrigé : « Libellé catégorie (actuel) », « Libellé filière (actuel) », « Libellé cadre emploi (actuel) »
// et « Libellé grade (actuel) » arrivaient vides — le nom attendu gardait ses parenthèses, l'en-tête lu les perdait.
//   RACINE=<dossier> node test-import-atmp-colonnes.js
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };

const FICHE = {
  id:'t-imp-1', collectivite:'Ville', dateAT:'2026-03-12', dateMois:'2026-03-01', jour:'Jeudi',
  statut:'Titulaire', civilite:'Madame', nom:'Durand', prenom:'Alice', dateNaissance:'1980-05-04', age:45,
  serviceDetail:'Voirie nord', service:'Voirie', categorie:'Catégorie C', filiere:'Technique',
  cadreEmploi:'Adjoints techniques', grade:'Adjoint technique principal', typeAtMp:'Accident de travail',
  arret:true, joursArret:12, circonstances:'Chute de plain-pied', etat:'Clos', risque:'Chute de plain-pied',
  siege:'Cheville', nature:'Entorse', elementMateriel:'Sol', mpTableau:'57', mpDateConstatation:'2026-02-01',
  mpDateDeclaration:'2026-02-10', mpAvisMedecinTravail:'Favorable', mpAvisConseilMedical:'Favorable',
  mpDecisionCollectivite:'Reconnue',
};
const CHAMPS = Object.keys(FICHE).filter(k => k !== 'id');

async function importer(p, wb){
  const buf = H.XLSX.write(wb, { type:'array', bookType:'xlsx' });
  const fichier = { arrayBuffer: async () => buf };
  Object.defineProperty(p.$('importFile'), 'files', { value:[fichier], configurable:true });
  p.ev(p.$('importFile'), 'change');
  await H.sleep(60);
}

(async () => {
  // 1. Aller-retour : export du logiciel → réimport dans un registre vide.
  const p1 = await H.page('registre-at-mp.html', RH, { vigie_hse_dataset: JSON.stringify([FICHE]) });
  p1.$('btnExport').click();
  check('export produit un classeur', p1.ecrits.length === 1, p1.ecrits.length);
  const wb = p1.ecrits[0] && p1.ecrits[0].wb;

  const p2 = await H.page('registre-at-mp.html', RH, { vigie_hse_dataset: JSON.stringify([]) });
  await importer(p2, wb);
  const relu = (p2.lire('vigie_hse_dataset') || []).find(r => r.id === 't-imp-1');
  check('la fiche est réimportée', !!relu, p2.alertes);
  for (const k of CHAMPS){
    check(`champ « ${k} » conservé`, relu && String(relu[k]) === String(FICHE[k]), relu && relu[k]);
  }

  // 2. En-têtes courts, sans « Libellé … (actuel) » (base d'un tiers).
  const p3 = await H.page('registre-at-mp.html', RH, { vigie_hse_dataset: JSON.stringify([]) });
  const ws = H.XLSX.utils.json_to_sheet([{ 'Date AT':'12/03/2026', 'Nom':'Martin', 'Catégorie':'Catégorie B',
    'Filière':'Administrative', "Cadre d'emploi":'Rédacteurs', 'Grade':'Rédacteur', 'Circonstances':'Coupure' }]);
  const wb3 = H.XLSX.utils.book_new(); H.XLSX.utils.book_append_sheet(wb3, ws, 'AT');
  await importer(p3, wb3);
  const r3 = (p3.lire('vigie_hse_dataset') || [])[0] || {};
  check('en-têtes courts : catégorie', r3.categorie === 'Catégorie B', r3.categorie);
  check('en-têtes courts : filière', r3.filiere === 'Administrative', r3.filiere);
  check("en-têtes courts : cadre d'emploi", r3.cadreEmploi === 'Rédacteurs', r3.cadreEmploi);
  check('en-têtes courts : grade', r3.grade === 'Rédacteur', r3.grade);

  // 3. Ce qui s'affiche : les cellules du tableau ne sont plus vides.
  const cellules = [...p2.d.querySelectorAll('#tbody td')].map(td => td.textContent.trim());
  for (const v of ['C', 'Technique', 'Adjoints techniques', 'Adjoint technique principal']){
    check(`affiché au tableau : ${v}`, cellules.includes(v), cellules.slice(0, 15));
  }

  check('aucune erreur JS', [p1, p2, p3].every(p => p.erreurs.length === 0), [p1, p2, p3].map(p => p.erreurs));
  fin();
})().catch(e => { console.error(e); process.exit(2); });
