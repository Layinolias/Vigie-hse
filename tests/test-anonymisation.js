// Compte anonymisé (question 16) sur un vrai serveur, avec des fiches réelles (pas celles de la démonstration) —
// défaut remonté le 2026-11-19 : un tel compte ne voyait plus aucun accident. Le serveur lui envoyait le registre
// sans aucune date, et le Registre AT/MP écarte un enregistrement sans date ; en démonstration, la page rechargeait
// alors les fichiers de démonstration complets, noms compris.
//   node tests/test-anonymisation.js      (RACINE=<dossier> : le serveur et les pages d'une autre version)
'use strict';
const H = require('./harnais-serveur.js');
const path = require('path');
const { verif, fin } = H.bilan('Compte anonymisé');

const AGENTS = [{ id:'ag-1', nom:'DURAND', prenom:'Alice', collectivite:'Ville', service:'Voirie & Réseaux', actif:true, civilite:'Madame', dateNaissance:'1985-04-02', grade:'Adjt tech' }];
const REELS = [
  { id:'reel-1', collectivite:'Ville', dateAT:'2026-03-12', dateMois:'2026-03-01', typeAtMp:'Accident de travail', nom:'Durand', prenom:'Alice',
    service:'Voirie & Réseaux', arret:true, joursArret:6, circonstances:'Chute dans l\'escalier', siege:'Cheville', nature:'Entorse', risque:'Chute de plain-pied' },
  { id:'reel-2', collectivite:'Ville', dateAT:'2026-04-02', dateMois:'2026-04-01', typeAtMp:'Accident de travail', nom:'Martin', prenom:'Paul',
    service:'Espaces Verts & Paysage', arret:false, joursArret:0, circonstances:'Coupure', siege:'Main', nature:'Plaie', risque:'Equipement de travail' },
  { id:'reel-3', collectivite:'Ville', dateAT:'2025-11-20', dateMois:'2025-11-01', typeAtMp:'Accident de trajet', nom:'Petit', prenom:'Lea',
    service:'Voirie & Réseaux', arret:true, joursArret:3, circonstances:'Glissade', siege:'Dos', nature:'Contusion', risque:'Routiers' },
];

(async () => {
  const dossier = H.dossierTemporaire('anon');
  const port = 8792;
  // Serveur de démonstration (comptes RH1, RH2… prêts) : les pages y chargent aussi les 25 accidents de démonstration
  // (identifiants « dtst-… ») ; les contrôles portent sur les trois accidents « réels », écrits avant toute page.
  const srv = await H.demarrer({ racine: process.env.RACINE || H.DEPOT, port, env: { VIGIE_BASE: path.join(dossier, 'vigie.db'), VIGIE_SAUVEGARDE_HEURES: '0', VIGIE_SAUVEGARDES: path.join(dossier, 'sv') } });
  try {
    const potA = H.nouveauPot();
    const sa = await H.seConnecterParLaPage(port, 'admin@verchamps.fr', 'admin1234', potA);
    verif('administrateur connecté', !!sa.session, sa);

    // le registre réel, écrit directement (identifiants qui ne sont pas ceux de la démonstration)
    let d = await H.donnees(port, potA);
    const rev = k => d[k] ? d[k].revision : 0;
    verif('registre réel écrit', await H.ecrire(port, potA, 'vigie_hse_dataset', JSON.stringify(REELS), rev('vigie_hse_dataset')) === 200);
    verif('base agents écrite', await H.ecrire(port, potA, 'vigie_hse_agents', JSON.stringify(AGENTS), rev('vigie_hse_agents')) === 200);

    // RH2 anonymisé (profil RH : il gère le registre quand il n'est pas anonymisé)
    const P0 = await H.ouvrirPage(port, 'administration.html', { pot: potA }); P0.fermer();
    d = await H.donnees(port, potA);
    const comptes = JSON.parse(d.vigie_hse_users.valeur);
    const rh2 = comptes.find(u => u.email === 'RH2' || u.username === 'RH2');
    rh2.anonymise = true;
    verif('RH2 anonymisé', await H.ecrire(port, potA, 'vigie_hse_users', JSON.stringify(comptes), d.vigie_hse_users.revision) === 200);

    // ----- ce que le serveur envoie -----
    const potR = H.nouveauPot(), potT = H.nouveauPot();
    const sr = await H.seConnecterParLaPage(port, 'RH2', '1234', potR);
    await H.seConnecterParLaPage(port, 'RH1', '1234', potT);
    verif('session RH2 marquée anonymisée', sr.session && sr.session.anonymise === true, sr.session);
    const recu = JSON.parse((await H.donnees(port, potR)).vigie_hse_dataset.valeur);
    verif('RH2 reçoit les 3 accidents', recu.length === 3, recu.length);   // aucune page ouverte encore : rien d'autre
    verif('… sans identité ni lésion', recu.every(r => !r.nom && !r.prenom && !r.siege && !r.nature && !r.circonstances), recu[0]);
    verif('… au mois près (date ramenée au 1er)', recu.map(r => r.dateAT).join() === '2026-03-01,2026-04-01,2025-11-01', recu.map(r => r.dateAT));
    verif('… avec service, type, arrêt, jours, famille de risque', recu[0].service === 'Voirie & Réseaux' && recu[0].arret === true && recu[0].joursArret === 6 && recu[0].risque === 'Chute de plain-pied', recu[0]);

    const agR = JSON.parse((await H.donnees(port, potR)).vigie_hse_agents.valeur)[0];
    verif('base agents reçue sans données privées (ni date de naissance, ni civilité), le reste oui', agR.nom === 'DURAND' && agR.grade === 'Adjt tech' && !('dateNaissance' in agR) && !('civilite' in agR), agR);
    const agT = JSON.parse((await H.donnees(port, potT)).vigie_hse_agents.valeur)[0];
    verif('… RH1 la reçoit entière', agT.dateNaissance === '1985-04-02' && agT.civilite === 'Madame');

    // ----- Gestion RH : RH2 modifie la fiche sans effacer ce qu'il n'a pas reçu -----
    const G = await H.ouvrirPage(port, 'gestion-rh.html', { pot: potR });
    G.w.document.querySelector('[data-edit="ag-1"]').click();
    verif('fiche agent : civilité et date de naissance masquées', G.w.document.getElementById('agFDateNaissance').closest('.ag-prive').hidden && G.w.document.getElementById('agFCivilite').closest('.ag-prive').hidden);
    G.w.document.getElementById('agFGrade').value = 'Adjt tech Pal 2Cl';
    G.w.document.getElementById('agentForm').dispatchEvent(new G.w.Event('submit', { cancelable:true }));
    await new Promise(r => setTimeout(r, 400));
    G.fermer();
    const agA = JSON.parse((await H.donnees(port, potA)).vigie_hse_agents.valeur)[0];
    verif('modification de RH2 enregistrée, date de naissance et civilité intactes', agA.grade === 'Adjt tech Pal 2Cl' && agA.dateNaissance === '1985-04-02' && agA.civilite === 'Madame', agA);

    // ----- le Registre AT/MP -----
    const R = await H.ouvrirPage(port, 'registre-at-mp.html', { pot: potR });
    const doc = R.w.document;
    const reels = () => [...doc.querySelectorAll('#tbody tr[data-id^="reel-"]')].map(tr => tr.getAttribute('data-id')).sort().join();
    verif('RH2 voit les 3 accidents réels', reels() === 'reel-1,reel-2,reel-3', reels());
    const texte = doc.getElementById('tbody').textContent;
    verif('aucun nom affiché', !/Durand|Martin|Petit/.test(texte));
    verif('date affichée au mois (« mars 2026 »)', /mars 2026/.test(texte) && !/12\/03\/2026|01\/03\/2026/.test(texte));
    const total = JSON.parse((await H.donnees(port, potA)).vigie_hse_dataset.valeur).length;
    verif('total des événements = registre complet (' + total + ')', doc.getElementById('kpiTotal').textContent.trim() === String(total), doc.getElementById('kpiTotal').textContent);
    verif('filtre par année : 2026 → reel-1 et reel-2', (() => { const s = doc.getElementById('fYear'); s.value = '2026'; s.dispatchEvent(new R.w.Event('change')); return reels() === 'reel-1,reel-2'; })(), reels());
    verif('vue réduite : pas de colonne Nom', ![...doc.querySelectorAll('#theadFields th')].some(th => /^Nom/.test(th.textContent.trim())));
    verif('ni « Modifier », ni import', !doc.querySelector('.act-edit[href*="saisie-rh"]') && doc.getElementById('btnImport').style.display === 'none');
    verif('« Nouvelle déclaration » reste (le serveur lui permet d\'ajouter)', doc.getElementById('btnNouvelle').style.display !== 'none');
    const liens = [...doc.querySelectorAll('nav a')].map(a => a.getAttribute('href'));
    verif('menu : ni Santé & Visites, ni Dossiers AT/MP, ni Analyse d\'accident', !liens.some(h => /sante-visites|dossiers-atmp|accident-analyse/.test(h || '')), liens);
    verif('Registre AT/MP sans erreur JS', R.erreurs.length === 0, R.erreurs);
    R.fermer();

    // ----- pages de santé : fermées -----
    for (const p of ['sante-visites.html', 'dossiers-atmp-citis.html', 'accident-analyse.html']){
      const P = await H.ouvrirPage(port, p, { pot: potR });
      verif(p + ' : la page le renvoie ailleurs', P.navigation());
      P.fermer();
    }

    // ----- tableau de bord et Reporting comptent les accidents -----
    const T = await H.ouvrirPage(port, 'dashboard.html', { pot: potR });
    verif('tableau de bord sans erreur JS', T.erreurs.length === 0, T.erreurs);
    T.fermer();

    // ----- le témoin non anonymisé voit tout, à la date exacte -----
    const S = await H.ouvrirPage(port, 'registre-at-mp.html', { pot: potT });
    const ts = S.w.document.getElementById('tbody').textContent;
    verif('RH1 voit les noms et la date exacte', /Durand/.test(ts) && /12\/03\/2026/.test(ts));
    S.fermer();

    // ----- rien n'a été écrit par-dessus le registre réel -----
    d = await H.donnees(port, potA);
    const apres = JSON.parse(d.vigie_hse_dataset.valeur);
    verif('le registre complet est intact (noms, dates exactes)', apres.filter(r => /^reel-/.test(r.id)).length === 3 && apres.find(r => r.id === 'reel-1').nom === 'Durand' && apres.find(r => r.id === 'reel-1').dateAT === '2026-03-12', apres.map(r => [r.id, r.nom, r.dateAT]));
  } finally { await srv.arreter(); H.effacer(dossier); }
  process.exitCode = fin() ? 1 : 0;
})().catch(e => { console.error(e); process.exit(2); });
