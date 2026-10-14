// Test de mise à jour (Documentation/LIVRAISON-POSTE.md) — à passer avant de remettre un paquet.
//   node tests/test-mise-a-jour.js <commit> [<commit>…]   (les commits des paquets déjà bâtis)
// Pour chaque commit : l'ANCIENNE version, extraite du dépôt, remplit une base comme un utilisateur (première
// connexion, toutes ses pages avec les données de démonstration, plus une saisie) ; puis la NOUVELLE version — le
// dossier de travail, comme le paquet — démarre sur cette base, sans démonstration, comme le lanceur. Rien ne doit
// s'y perdre, et une copie doit avoir été prise avant.
'use strict';
const H = require('./harnais-serveur.js');
const fs = require('fs'), path = require('path');

const COMMITS = process.argv.slice(2).filter(a => !a.startsWith('--'));
const GARDER = process.argv.includes('--garder');   // garder le dossier de travail (enquête)
if (!COMMITS.length){ console.error('usage : node tests/test-mise-a-jour.js <commit> [<commit>…]'); process.exit(2); }
const COMPTES = [['admin@verchamps.fr', 'admin1234'], ['RH1', '1234'], ['manager@verchamps.fr', 'manager1234'], ['AG1', '1234'], ['PREV1', '1234']];
const MOTIF_MAJ = /^vigie-avant-mise-a-jour-.+\.db$/;
const PORT_ANCIENNE = 8871, PORT_NOUVELLE = 8872;

async function essai(commit, { verif }){
  console.log('\n=== Depuis ' + commit + ' (' + H.git('log', '-1', '--format=%cs %s', commit).slice(0, 90) + ')');
  const T = H.dossierTemporaire('maj');
  const ANCIENNE = H.extraireCommit(commit, path.join(T, 'ancienne'));
  const BASE = path.join(T, 'donnees', 'vigie.db'), SAUV = path.join(T, 'donnees', 'sauvegardes');
  const ENV = { VIGIE_BASE: BASE, VIGIE_SAUVEGARDES: SAUV };
  const copiesMaj = () => { try { return fs.readdirSync(SAUV).filter(f => MOTIF_MAJ.test(f)); } catch(e){ return []; } };
  let srv = null;
  try {
    // 1. l'ancienne version remplit la base
    srv = await H.demarrer({ racine: ANCIENNE, port: PORT_ANCIENNE, env: ENV });
    const pot = H.nouveauPot();
    const premiere = await H.seConnecterParLaPage(PORT_ANCIENNE, 'admin@verchamps.fr', 'admin1234', pot);
    if (!verif('ancienne version : première connexion (comptes inscrits par l\'écran de connexion)', premiere.session && premiere.cookie, premiere)) return;
    const pagesAnciennes = H.pages(ANCIENNE).filter(p => p !== 'login.html');   // l'écran de connexion ferme la session
    for (const pg of pagesAnciennes){ const P = await H.ouvrirPage(PORT_ANCIENNE, pg, { pot }); P.fermer(); }
    // une saisie, comme un utilisateur : un accident de plus au registre
    let d = await H.donnees(PORT_ANCIENNE, pot);
    const reg = d.vigie_hse_dataset || { valeur: '[]', revision: 0 };
    const saisie = { id: 'maj-essai-' + Date.now().toString(36), dateAT: '2026-03-02', typeAtMp: 'Accident de travail', arret: true, joursArret: 4,
      collectivite: 'Ville', service: 'Voirie & Réseaux', circonstances: 'Saisie du test de mise à jour : glissade sur une plaque de verglas.' };
    const liste = JSON.parse(reg.valeur || '[]').concat([saisie]);
    verif('ancienne version : une saisie enregistrée', await H.ecrire(PORT_ANCIENNE, pot, 'vigie_hse_dataset', JSON.stringify(liste), reg.revision) === 200);
    const avant = await H.donnees(PORT_ANCIENNE, pot);
    const remplis = Object.keys(avant).filter(k => avant[k].valeur != null);
    verif('ancienne version : ' + pagesAnciennes.length + ' pages ouvertes, ' + remplis.length + ' registres remplis', remplis.length >= 20, remplis.length);
    await srv.arreter(); srv = null;
    const contenuAvant = H.contenuBase(BASE);

    // 2. la nouvelle version démarre sur la base
    srv = await H.demarrer({ port: PORT_NOUVELLE, env: Object.assign({ VIGIE_DEMO: '0' }, ENV) });
    const copies = copiesMaj();
    verif('nouvelle version : une copie « avant mise à jour » prise', copies.length === 1, copies);
    if (copies.length) verif('… identique à la base d\'avant, registre par registre', JSON.stringify(H.contenuBase(path.join(SAUV, copies[0]))) === JSON.stringify(contenuAvant));
    const refus = [];
    for (const [id, mdp] of COMPTES){ const c = await H.connecter(PORT_NOUVELLE, id, mdp, H.nouveauPot()); if (c.statut !== 200) refus.push(id + ' : ' + c.statut); }
    verif('comptes et mots de passe repris (' + COMPTES.map(c => c[0]).join(', ') + ')', !refus.length, refus);
    const pot2 = H.nouveauPot();
    await H.connecter(PORT_NOUVELLE, 'admin@verchamps.fr', 'admin1234', pot2);
    const pagesNouvelles = H.pages(H.DEPOT).filter(p => p !== 'login.html');   // l'écran de connexion ferme la session
    const fautives = [];
    for (const pg of pagesNouvelles){
      const P = await H.ouvrirPage(PORT_NOUVELLE, pg, { pot: pot2 });
      if (P.statut !== 200 || P.erreurs.length) fautives.push(pg + ' : ' + (P.statut !== 200 ? P.statut : P.erreurs.join(' | ')));
      P.fermer();
    }
    verif('nouvelle version : les ' + pagesNouvelles.length + ' pages s\'ouvrent sans erreur (administrateur)', !fautives.length, fautives);
    // les autres comptes : leur tableau de bord
    const fautivesComptes = [];
    for (const [id, mdp] of COMPTES.slice(1)){
      const p = H.nouveauPot(); await H.connecter(PORT_NOUVELLE, id, mdp, p);
      const P = await H.ouvrirPage(PORT_NOUVELLE, 'dashboard.html', { pot: p });
      if (P.statut !== 200 || P.erreurs.length) fautivesComptes.push(id + ' : ' + (P.statut !== 200 ? P.statut : P.erreurs.join(' | ')));
      P.fermer();
    }
    verif('nouvelle version : tableau de bord des autres comptes sans erreur', !fautivesComptes.length, fautivesComptes);

    // 3. rien de perdu
    const apres = await H.donnees(PORT_NOUVELLE, pot2) || {};
    const registresPerdus = remplis.filter(k => !apres[k] || apres[k].valeur == null);
    verif('aucun registre perdu (' + remplis.length + ')', !registresPerdus.length, registresPerdus);
    const perdus = [];
    let compte = 0;
    for (const k of remplis){
      const ids = H.identifiants(avant[k].valeur);
      if (!ids) continue;
      const restent = new Set(H.identifiants(apres[k] && apres[k].valeur) || []);
      compte += ids.length;
      const manquent = ids.filter(i => !restent.has(i));
      if (manquent.length) perdus.push(k + ' : ' + manquent.length + ' (' + manquent.slice(0, 3).join(', ') + ')');
    }
    verif('aucun enregistrement perdu, par identifiant (' + compte + ')', !perdus.length, perdus);
    const retrouvee = (JSON.parse((apres.vigie_hse_dataset || {}).valeur || '[]')).find(x => x && x.id === saisie.id);
    verif('la saisie intacte', retrouvee && JSON.stringify(Object.keys(saisie).map(k => retrouvee[k])) === JSON.stringify(Object.keys(saisie).map(k => saisie[k])), retrouvee);
    const reecrits = remplis.filter(k => apres[k] && apres[k].valeur !== avant[k].valeur);
    console.log('    (registres réécrits par les nouvelles pages, sans perte : ' + (reecrits.join(', ') || 'aucun') + ')');
    await srv.arreter(); srv = null;

    // 4. redémarrage : pas de seconde copie
    srv = await H.demarrer({ port: PORT_NOUVELLE, env: Object.assign({ VIGIE_DEMO: '0' }, ENV) });
    verif('redémarrage de la même version : pas de seconde copie', copiesMaj().length === 1, copiesMaj());
  } finally {
    if (srv) await srv.arreter();
    if (GARDER) console.log('    dossier de travail gardé : ' + T); else H.effacer(T);
  }
}

(async () => {
  const B = H.bilan('Mise à jour depuis ' + COMMITS.join(', '));
  for (const c of COMMITS) await essai(c, B);
  process.exit(B.fin() ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
