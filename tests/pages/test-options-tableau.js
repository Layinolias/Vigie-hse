// Options du tableau (assets/options-tableau.js) sur le Registre AT/MP (2026-11-19) :
// ordre et choix des colonnes, graphiques sous le tableau, réglages par compte.
//   RACINE=<dossier> node test-options-tableau.js
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };
const RH2 = { user:'RH2', role:'rh', email:'RH2', services:['*'], modulePermissions:{} };
const AG = { user:'AG1', role:'ag', email:'AG1', services:['*'], modulePermissions:{} };

const fiche = (id, service, dateAT, arret, jours, extra) => Object.assign({
  id, collectivite:'Ville', dateAT, dateMois:dateAT.slice(0, 8) + '01', jour:'Lundi', statut:'Titulaire', civilite:'Madame',
  nom:'Nom' + id, prenom:'P', dateNaissance:'1980-01-01', age:45, serviceDetail:service, service, categorie:'Catégorie C',
  filiere:'Technique', cadreEmploi:'Adjoints', grade:'Adjoint', typeAtMp:'Accident de travail', arret, joursArret:jours,
  circonstances:'c', etat:'Clos', risque:'Chute', siege:'Main', nature:'Plaie', elementMateriel:'Sol',
}, extra || {});
const DONNEES = [
  fiche('o1', 'Voirie', '2026-01-10', true, 5),
  fiche('o2', 'Voirie', '2026-03-02', false, 0),
  fiche('o3', 'Restauration', '2026-03-20', true, 12),
  fiche('o4', '<img src=x onerror="window.__xss=1">', '2026-05-05', true, 3),
];
const STOCK = { vigie_hse_dataset: JSON.stringify(DONNEES) };

const entetes = p => [...p.d.querySelectorAll('#theadFields th')].map(th => th.getAttribute('data-key'));
const lignes = p => p.d.querySelectorAll('#tbody tr:not(.empty-row)').length;
const ouvrir = p => { p.$('btnOptionsTableau').click(); return p.d.querySelector('.vot-fond'); };
const ligneCol = (p, key) => {
  const lib = { nom:'Nom', dateAT:'Date', service:'Service', prenom:'Prénom' }[key];
  return [...p.d.querySelectorAll('.vot-col')].find(li => li.querySelector('.vot-nom').textContent === lib);
};
const cocher = (p, key, v) => { const cb = ligneCol(p, key).querySelector('input'); cb.checked = v; p.ev(cb, 'change'); };

(async () => {
  // ----- colonnes -----
  const p = await H.page('registre-at-mp.html', RH, STOCK);
  check('bouton Options présent', !!p.$('btnOptionsTableau'));
  const avant = entetes(p);
  check('ordre d\'origine : Statut d\'abord', avant[0] === 'statut', avant.slice(0, 3));
  check('ligne des groupes visible au départ', p.$('theadGroups').style.display !== 'none' && p.$('theadGroups').children.length > 0);
  check('zone des graphiques masquée sans graphique', p.$('zoneGraphiques').hidden === true);

  let fen = ouvrir(p);
  check('la fenêtre s\'ouvre', !!fen);
  check('une ligne par colonne visible du compte', p.d.querySelectorAll('.vot-col').length === avant.length, p.d.querySelectorAll('.vot-col').length);

  cocher(p, 'nom', false);
  check('décocher « Nom » retire la colonne', !entetes(p).includes('nom') && entetes(p).length === avant.length - 1);
  check('les cellules suivent', p.d.querySelector('#tbody tr').children.length === avant.length - 1);

  // Monter « Date » tout en haut avec les flèches
  for (let k = 0; k < 40; k++){ const b = ligneCol(p, 'dateAT').querySelector('[data-fl="-1"]'); if (b.disabled) break; b.click(); }
  check('« Date » en première colonne', entetes(p)[0] === 'dateAT', entetes(p).slice(0, 3));
  check('ordre changé : ligne des groupes masquée', p.$('theadGroups').style.display === 'none');

  const garde = (p.lire('vigie_hse_options_tableaux') || {});
  check('réglage gardé sous le compte RH1', garde.RH1 && garde.RH1['registre-at-mp'] && Array.isArray(garde.RH1['registre-at-mp'].colonnes));

  // Dernière colonne : refus
  const p1 = await H.page('registre-at-mp.html', RH, STOCK);
  ouvrir(p1);
  const cbs = [...p1.d.querySelectorAll('.vot-col input')];
  cbs.forEach(cb => { cb.checked = false; p1.ev(cb, 'change'); });
  check('au moins une colonne reste affichée', entetes(p1).length === 1, entetes(p1));
  check('message « Gardez au moins une colonne »', /au moins une colonne/.test(p1.d.querySelector('#vot-msg').textContent));

  // Rechargement : même compte → réglage retrouvé ; autre compte → affichage d'origine
  const p2 = await H.page('registre-at-mp.html', RH, p.stockage());
  check('rechargé : « Date » toujours première', entetes(p2)[0] === 'dateAT');
  check('rechargé : « Nom » toujours masqué', !entetes(p2).includes('nom'));
  const p3 = await H.page('registre-at-mp.html', RH2, p.stockage());
  check('un autre compte garde l\'affichage d\'origine', entetes(p3).join() === avant.join());

  // Revenir à l'origine
  ouvrir(p2);
  p2.d.querySelector('[data-act="origine"]').click();
  check('« Revenir à l\'affichage d\'origine »', entetes(p2).join() === avant.join());
  check('groupes de nouveau visibles', p2.$('theadGroups').style.display !== 'none');

  // Tri sur une colonne puis masquage : le tri est oublié
  const p4 = await H.page('registre-at-mp.html', RH, STOCK);
  p4.d.querySelector('#theadFields .vt-label[data-key="service"]').click();
  p4.d.querySelector('#theadFields .vt-label[data-key="service"]').click();   // décroissant : Voirie d'abord
  const premierTrie = p4.d.querySelector('#tbody tr').getAttribute('data-id');
  ouvrir(p4); cocher(p4, 'service', false);
  const premierApres = p4.d.querySelector('#tbody tr').getAttribute('data-id');
  check('tri décroissant sur « Service » actif avant masquage (Voirie d\'abord)', premierTrie === 'o2', premierTrie);
  check('colonne masquée : son tri est oublié (ordre par date)', premierApres === 'o4', [premierTrie, premierApres]);
  cocher(p4, 'service', true);
  check('colonne ré-affichée sans tri', !p4.d.querySelector('.vt-label[data-key="service"] .vt-arrow').textContent);

  // ----- graphiques -----
  const g = await H.page('registre-at-mp.html', RH, STOCK);
  ouvrir(g);
  g.d.querySelector('[data-onglet="graphiques"]').click();
  const optsGroupe = [...g.d.querySelectorAll('#vot-groupe option')].map(o => o.textContent);
  check('« Regrouper par » propose Service et la date par mois', optsGroupe.includes('Service') && optsGroupe.includes('Date — par mois'), optsGroupe);
  check('pas de regroupement par Nom ni Circonstances', !optsGroupe.includes('Nom') && !optsGroupe.includes('Circonstances'));
  g.choisir('vot-groupe', 'service|');
  check('forme cachée pour une colonne non datée', g.$('vot-forme-champ').style.display === 'none');
  g.choisir('vot-mesure', 'nombre');
  g.$('vot-ajouter').click();
  check('zone des graphiques affichée', g.$('zoneGraphiques').hidden === false);
  const vals = () => [...g.d.querySelectorAll('#zoneGraphiques .vot-hb-val')].map(e => Number(e.textContent));
  check('un graphique, une barre par service', vals().length === 3, vals());
  check('la somme des barres = lignes du tableau', vals().reduce((a, b) => a + b, 0) === lignes(g), [vals(), lignes(g)]);
  check('titre du graphique', /Nombre d'événements — Service/.test(g.$('zoneGraphiques').textContent));
  check('texte de donnée échappé dans le graphique', !g.$('zoneGraphiques').querySelector('img') && !g.w.__xss);

  // Le graphique suit les filtres de la page
  g.choisir('fArret', 'avec');
  check('filtre « Avec arrêt » : somme = 3', vals().reduce((a, b) => a + b, 0) === 3, vals());

  // Graphique dans le temps
  g.choisir('vot-groupe', 'dateAT|mois');
  check('forme proposée pour une date', g.$('vot-forme-champ').style.display !== 'none');
  g.choisir('vot-mesure', 'joursArret');
  g.choisir('vot-forme', 'courbe');
  g.$('vot-ajouter').click();
  const svg = g.d.querySelectorAll('#zoneGraphiques svg');
  check('courbe dessinée', svg.length === 1 && !!svg[0].querySelector('polyline'));
  check('mois sans événement comptés (janv. → mai = 5 points)', svg[0].querySelectorAll('circle').length === 5, svg[0].querySelectorAll('circle').length);
  check('total des jours avec arrêt = 20', [...g.d.querySelectorAll('#zoneGraphiques details')[1].querySelectorAll('td:last-child')].reduce((s, td) => s + Number(td.textContent), 0) === 20);

  // Rechargé : graphiques retrouvés ; retirer
  const g2 = await H.page('registre-at-mp.html', RH, g.stockage());
  check('graphiques retrouvés au rechargement', g2.d.querySelectorAll('#zoneGraphiques .vot-carte').length === 2);
  g2.d.querySelector('#zoneGraphiques [data-retirer-g="0"]').click();
  g2.d.querySelector('#zoneGraphiques [data-retirer-g="0"]').click();
  check('tout retiré : zone masquée', g2.$('zoneGraphiques').hidden === true);

  // ----- compte agent : droits respectés -----
  const a = await H.page('registre-at-mp.html', AG, STOCK);
  check('agent : bouton Options visible', !!a.$('btnOptionsTableau') && a.$('btnOptionsTableau').offsetParent !== undefined && a.$('btnOptionsTableau').style.display !== 'none');
  ouvrir(a);
  const libs = [...a.d.querySelectorAll('.vot-nom')].map(e => e.textContent);
  check('agent : ni Nom ni Prénom dans la liste des colonnes', !libs.includes('Nom') && !libs.includes('Prénom'), libs);
  a.d.querySelector('[data-onglet="graphiques"]').click();
  const ga = [...a.d.querySelectorAll('#vot-groupe option')].map(o => o.textContent);
  check('agent : rien d\'identifiant parmi les regroupements', !ga.some(t => /Nom|Prénom|Grade|Naissance/.test(t)), ga);

  // Échap ferme la fenêtre
  a.d.dispatchEvent(new a.w.KeyboardEvent('keydown', { key:'Escape' }));
  check('Échap ferme la fenêtre', !a.d.querySelector('.vot-fond'));

  check('aucune erreur JS', [p, p1, p2, p3, p4, g, g2, a].every(x => x.erreurs.length === 0), [p, p1, p2, p3, p4, g, g2, a].map(x => x.erreurs));
  fin();
})().catch(e => { console.error(e); process.exit(2); });
