// Registre AT/MP, import : les jours d'arrêt ne dépendent plus de la colonne « Avec ou sans arrêt » (2026-11-19).
// Défaut remonté par le préventeur : un fichier où cette colonne manquait ou était mal écrite perdait tous ses
// jours d'arrêt (gardés seulement si la colonne contenait « avec »). Un nombre de jours renseigné vaut arrêt.
//   RACINE=<dossier> node test-import-atmp-arret.js
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };

async function importer(lignes){
  const p = await H.page('registre-at-mp.html', RH, { vigie_hse_dataset: JSON.stringify([]) });
  const wb = H.XLSX.utils.book_new();
  H.XLSX.utils.book_append_sheet(wb, H.XLSX.utils.aoa_to_sheet(lignes), 'Registre');
  const buf = H.XLSX.write(wb, { type:'array', bookType:'xlsx' });
  Object.defineProperty(p.$('importFile'), 'files', { value:[{ arrayBuffer: async () => buf }], configurable:true });
  p.ev(p.$('importFile'), 'change');
  await H.sleep(60);
  const l = p.lire('vigie_hse_dataset') || [];
  return { p, fiche: id => l.find(r => r.id === id) || {}, l };
}
const etat = r => [r.arret, r.joursArret];

(async () => {
  // 1. Aucune colonne « Avec ou sans arrêt » : les jours suffisent
  let { p, fiche, l } = await importer([
    ['ID', 'Date AT', 'Nom', 'Service', 'Nb jours arret total'],
    ['a1', '12/03/2026', 'Durand', 'Voirie', 12],
    ['a2', '13/03/2026', 'Martin', 'Voirie', 0],
    ['a3', '14/03/2026', 'Petit', 'Voirie', ''],
  ]);
  check('sans colonne Avec/sans : 12 jours → avec arrêt, 12 j', etat(fiche('a1')).join() === 'true,12', etat(fiche('a1')));
  check('… 0 jour → sans arrêt', etat(fiche('a2')).join() === 'false,0', etat(fiche('a2')));
  check('… jours vides → sans arrêt', etat(fiche('a3')).join() === 'false,0', etat(fiche('a3')));
  const ligne = p.d.querySelector('#tbody tr[data-id="a1"]');
  const idx = [...p.d.querySelectorAll('#theadFields th')].findIndex(th => th.getAttribute('data-key') === 'joursArret');
  check('le tableau affiche les 12 jours', ligne && idx >= 0 && ligne.children[idx].textContent.trim().startsWith('12'), ligne && idx >= 0 && ligne.children[idx].textContent);
  check('total des jours d\'arrêt (KPI) compte les 12 jours', p.$('kpiJours').textContent.trim().startsWith('12'), p.$('kpiJours').textContent);
  check('aucune trace de calcul enregistrée', !l.some(r => '_arretCorrige' in r));

  // 2. Colonne présente mais mal écrite ou vide
  ({ p, fiche } = await importer([
    ['ID', 'Date AT', 'Nom', 'Avec ou sans arrêt', 'Jours d\'arrêt'],
    ['b1', '12/03/2026', 'Durand', 'AA', 5],
    ['b2', '12/03/2026', 'Martin', '', 3],
    ['b3', '12/03/2026', 'Petit', 'Oui', 0],
    ['b4', '12/03/2026', 'Leroy', 'Avec Arrêt', '7 j'],
    ['b5', '12/03/2026', 'Moreau', 'Sans Arrêt', 0],
    ['b6', '12/03/2026', 'Roux', 'avec arret', '2,0'],
  ]));
  check('valeur illisible (« AA ») + 5 jours → avec arrêt, 5 j', etat(fiche('b1')).join() === 'true,5', etat(fiche('b1')));
  check('colonne vide + 3 jours → avec arrêt, 3 j', etat(fiche('b2')).join() === 'true,3', etat(fiche('b2')));
  check('« Oui », 0 jour → avec arrêt (en cours), 0 j', etat(fiche('b3')).join() === 'true,0', etat(fiche('b3')));
  check('« Avec Arrêt », « 7 j » → 7 jours', etat(fiche('b4')).join() === 'true,7', etat(fiche('b4')));
  check('« Sans Arrêt », 0 jour → sans arrêt', etat(fiche('b5')).join() === 'false,0', etat(fiche('b5')));
  check('« avec arret », « 2,0 » → 2 jours', etat(fiche('b6')).join() === 'true,2', etat(fiche('b6')));
  check('aucune ligne contradictoire : pas d\'avertissement', !/sans arrêt » portaient/.test(p.alertes.join(' ')), p.alertes);

  // 3. Contradiction : « Sans arrêt » mais des jours → comptée avec arrêt, signalée
  ({ p, fiche } = await importer([
    ['ID', 'Date AT', 'Nom', 'Avec ou sans arrêt', 'Nb jours arret total'],
    ['c1', '12/03/2026', 'Durand', 'Sans Arrêt', 4],
    ['c2', '12/03/2026', 'Martin', 'Sans Arrêt', 0],
  ]));
  check('« Sans Arrêt » + 4 jours → avec arrêt, 4 j', etat(fiche('c1')).join() === 'true,4', etat(fiche('c1')));
  check('… signalé dans le compte rendu d\'import (1 ligne)', /1 ligne\(s\) notée\(s\) « sans arrêt » portaient pourtant des jours d'arrêt/.test(p.alertes.join(' ')), p.alertes);
  check('Registre sans erreur JS', !p.erreurs.length, p.erreurs);

  fin();
})().catch(e => { console.error(e); process.exit(2); });
