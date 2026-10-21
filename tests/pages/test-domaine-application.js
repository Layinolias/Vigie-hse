// Domaine d'application du système (ISO 45001 § 4.3, 2026-10-18), dans Contexte et enjeux : versions datées,
// organisation relevée, écart avec l'organisation du jour, impression, export, revue de direction, Préparation ISO 45001.
//   RACINE=<dossier> node test-domaine-application.js
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };
const MAN = { user:'manager@verchamps.fr', role:'manager', email:'manager@verchamps.fr', services:['Voirie & Réseaux'], modulePermissions:{} };
const PREV = { user:'PREV1', role:'ag', email:'PREV1', services:['*'], profils:['p-agent', 'p-preventeur'] };
const CLE = 'vigie_hse_contexte';
const J = (o) => JSON.stringify(o);

(async () => {
  // ---------- 1. Rien d'écrit ----------
  let p = await H.page('contexte.html', PREV, {});
  const ajd = p.w.VigieDates.aujourdhui(), fr = (d) => d.split('-').reverse().join('/');
  const VX = p.w.VigieContexte, orga = VX.organisationDe(p.w.VigieOrga);
  check('panneau vide : invitation, bouton « Écrire le domaine d\'application », sans erreur', /pas encore écrit/.test(p.$('domaine').textContent) && /Écrire le domaine d'application/.test(p.$('actDomaine').textContent) && !p.erreurs.length, p.erreurs);
  check('organisation relevée : les entrées et leurs services', orga.length >= 1 && orga.every(e => e.nom && Array.isArray(e.services)), orga);
  p.$('btnDomaine').click();
  check('formulaire : énoncé, activités, exclusions, date (aujourd\'hui), validé par, mis à disposition, organisation, « version 1 »', ['dEnonce', 'dActivites', 'dExclusions', 'dDepuis', 'dValidePar', 'dDiffusion'].every(id => !!p.$(id)) && p.$('dDepuis').value === ajd && /Enregistrer la version 1/.test(p.$('domaine').textContent) && p.$('domaine').textContent.includes(orga[0].nom) && !p.$('btnDomaine'));
  check('… placeholders aux mots du secteur (agents)', /agents/.test(p.$('dActivites').placeholder));
  const soumettre = () => p.ev(p.$('domaineForm'), 'submit');
  soumettre();
  check('validation : l\'énoncé', /Écrivez l'énoncé/.test(p.alertes.pop() || '') && !p.lire(CLE));
  p.$('dEnonce').value = 'La démarche couvre tous les services <img src=x onerror="window.pirate=1">';
  p.$('dDepuis').value = '';
  soumettre();
  check('validation : la date', /à partir de quand/.test(p.alertes.pop() || '') && !p.lire(CLE));
  p.$('dDepuis').value = '2026-01-15'; p.$('dActivites').value = 'Bureaux, ateliers, voirie'; p.$('dValidePar').value = 'Direction générale'; p.$('dDiffusion').value = 'Base documentaire';
  soumettre();
  let l = p.lire(CLE) || [], v1 = l[0] || {};
  check('version 1 enregistrée : registre, version, date, textes, organisation du jour, auteur', l.length === 1 && v1.registre === 'domaine' && v1.version === 1 && v1.depuis === '2026-01-15' && v1.validePar === 'Direction générale' && v1.exclusions === '' && J(v1.organisation) === J(orga) && v1.auteur === 'PREV1' && /^ctx-dom-/.test(v1.id), v1);
  check('… affichée : version 1, en vigueur depuis, validée par, exclusions « Aucune », organisation ; formulaire refermé', /Version 1 · en vigueur depuis le 15\/01\/2026 · validée par Direction générale/.test(p.$('domaine').textContent) && /Aucune/.test(p.$('domaine').textContent) && /Bureaux, ateliers/.test(p.$('domaine').textContent) && !p.$('domaineForm') && /Nouvelle version/.test(p.$('actDomaine').textContent));
  check('… texte échappé (aucune balise interprétée)', !p.$('domaine').querySelector('img') && !p.w.pirate && /<img/.test(p.$('domaine').textContent));
  check('… journal d\'audit', (p.lire('vigie_hse_audit_log') || []).some(a => a.module === 'Contexte et enjeux' && a.type === 'Création' && /Domaine d'application, version 1, en vigueur à partir du 15\/01\/2026/.test(a.description)));
  check('… n\'entre pas dans les trois registres (compteurs à 0, registre vide)', p.$('kpiEnjeux').textContent === '0' && p.$('kpiRo').textContent === '0' && /Aucun enjeu pour le moment/.test(p.$('tbEnjeux').textContent) && VX.valides(l).length === 0);

  // ---------- 2. Nouvelle version, à venir ----------
  p.$('btnDomaine').click();
  check('nouvelle version : reprend le texte de la dernière, « version 2 », date du jour', p.$('dEnonce').value.startsWith('La démarche couvre') && p.$('dValidePar').value === 'Direction générale' && p.$('dDepuis').value === ajd && /Enregistrer la version 2/.test(p.$('domaine').textContent));
  p.$('btnDomaineAnnuler').click();
  check('… annuler : rien d\'écrit, version 1 affichée', !p.$('domaineForm') && (p.lire(CLE) || []).length === 1 && /Version 1/.test(p.$('domaine').textContent));
  p.$('btnDomaine').click();
  p.$('dEnonce').value = 'La démarche couvre tous les services et le nouveau centre technique';
  p.$('dDepuis').value = '2099-01-01';
  soumettre();
  l = p.lire(CLE) || [];
  const v2 = l.find(x => x.version === 2) || {};
  check('version 2 à venir : enregistrée, la 1 reste en vigueur', l.length === 2 && v2.depuis === '2099-01-01' && /Version 1 · en vigueur/.test(p.$('domaine').textContent));
  const items = [...p.d.querySelectorAll('.domaine-versions li')];
  check('… toutes les versions : 2, la plus récente d\'abord (À venir, puis En vigueur) ; suppression sur la dernière seulement', items.length === 2 && /À venir/.test(items[0].textContent) && /Version 2/.test(items[0].textContent) && /En vigueur/.test(items[1].textContent) && !!items[0].querySelector('[data-suppr-domaine]') && !items[1].querySelector('[data-suppr-domaine]'));
  items[0].querySelector('[data-suppr-domaine]').click();
  l = p.lire(CLE) || [];
  check('supprimer la dernière : la 1 reste, journal', l.length === 1 && l[0].version === 1 && (p.lire('vigie_hse_audit_log') || []).some(a => a.type === 'Suppression' && /Domaine d'application, version 2/.test(a.description)));
  p.$('btnDomaine').click();
  check('… le numéro suivant redevient 2', /Enregistrer la version 2/.test(p.$('domaine').textContent));
  p.$('btnDomaineAnnuler').click();

  // ---------- 3. L'organisation a changé ----------
  const autre = JSON.parse(J(orga));
  autre[0].services = autre[0].services.slice(1).concat(['Service disparu']);
  const ancien = Object.assign({}, v1, { organisation: autre });
  const stock = { [CLE]: J([ancien]) };
  p = await H.page('contexte.html', RH, stock);
  check('organisation changée : signalé, avec l\'ajouté et le disparu', !!p.$('domaineEcart') && p.$('domaineEcart').textContent.includes(orga[0].services[0]) && /Service disparu/.test(p.$('domaineEcart').textContent), p.$('domaineEcart') && p.$('domaineEcart').textContent);
  p = await H.page('contexte.html', RH, { [CLE]: J([v1]) });
  check('… organisation identique : rien de signalé', !p.$('domaineEcart'));
  check('ecartOrganisation : sans relevé, rien ; entrée ajoutée', J(VX.ecartOrganisation({}, orga)) === J({ ajouts: [], retraits: [] }) && VX.ecartOrganisation({ organisation: [] }, [{ nom: 'Usine 2', services: ['Atelier'] }]).ajouts.join('|') === 'Usine 2|Atelier (Usine 2)');

  // ---------- 4. Impression et export ----------
  p.$('btnImprimer').click();
  const imp = p.$('ctx-impression');
  check('registre imprimé : domaine d\'application en tête, version, énoncé, tableau', imp && /Domaine d'application du système/.test(imp.textContent) && /Version 1, en vigueur depuis le 15\/01\/2026, validée par Direction générale/.test(imp.textContent) && /Bureaux, ateliers/.test(imp.textContent) && imp.textContent.indexOf('Domaine d') < imp.textContent.indexOf('Enjeux internes'));
  p = await H.page('contexte.html', RH, { [CLE]: J([v1, Object.assign({}, v2, { id: 'v2' })]) });
  p.$('btnExport').click();
  const wb = (p.ecrits[0] || {}).wb, f = wb && wb.Sheets["Domaine d'application"];
  const lignes = f ? H.XLSX.utils.sheet_to_json(f) : [];
  check('export : feuille « Domaine d\'application », toutes les versions, état', lignes.length === 2 && lignes[0]['Version'] === 2 && lignes[0]['État'] === 'À venir' && lignes[1]['État'] === 'En vigueur' && lignes[1]['Validé par'] === 'Direction générale' && /\(/.test(lignes[1]['Organisation suivie']), lignes);
  p = await H.page('contexte.html', RH, {});
  p.$('btnImprimer').click();
  check('… sans domaine : « Pas encore écrit. »', /Domaine d'application du système\s*Pas encore écrit/.test(p.$('ctx-impression').textContent));

  // ---------- 5. Lecture seule ----------
  p = await H.page('contexte.html', MAN, { [CLE]: J([v1, Object.assign({}, v2, { id: 'v2' })]) });
  check('manager : lit le domaine, ni nouvelle version ni suppression', /Version 1 · en vigueur/.test(p.$('domaine').textContent) && !p.$('btnDomaine') && !p.d.querySelector('[data-suppr-domaine]') && !p.erreurs.length);

  // ---------- 6. Logique partagée ----------
  const L = [{ id:'a', registre:'domaine', version:1, depuis:'2025-01-01' }, { id:'b', registre:'domaine', version:2, depuis:'2026-03-01' }, { id:'c', registre:'domaine', version:3, depuis:'2099-01-01' },
    { id:'d', registre:'domaine', version:4, depuis:'pas une date' }, { id:'e', registre:'enjeu', texte:'x' }, null];
  check('domaines : valides seulement, la plus récente d\'abord', VX.domaines(L).map(x => x.id).join('') === 'cba');
  check('domaineEnVigueur : la plus récente déjà commencée ; avant toute version : aucune', VX.domaineEnVigueur(L, '2026-10-18').id === 'b' && VX.domaineEnVigueur(L, '2025-06-01').id === 'a' && VX.domaineEnVigueur(L, '2024-01-01') === null);
  check('prochaineVersion : après la plus haute', VX.prochaineVersion(L) === 4 && VX.prochaineVersion([]) === 1);
  const s = VX.synthese(L, [], '2026-10-18');
  check('synthese : le domaine en vigueur, hors des compteurs', s.domaine && s.domaine.version === 2 && s.domaine.depuis === '2026-03-01' && s.enjeux === 1 && VX.synthese([], []).domaine === null);
  const pp = VX.pourPeriode(L, [], '2026-01-01', '2026-06-30');
  check('pourPeriode : « Nouvelle version » du domaine dans la période', pp.mouvements.some(m => m.registre === "Domaine d'application" && m.quoi === 'Nouvelle version' && m.date === '2026-03-01' && /version 2/.test(m.libelle)) && !pp.mouvements.some(m => /version 1|version 3/.test(m.libelle)));

  // ---------- 7. Revue de direction ----------
  const stockRD = { [CLE]: J([Object.assign({}, v1, { depuis: ajd })]) };
  const rd = await H.page('revue-direction.html', RH, stockRD);
  rd.$('btnNouvelle').click();
  const txt = rd.$('revue') ? rd.$('revue').textContent : '';
  check('revue de direction : domaine en vigueur et sa nouvelle version dans la période, même registre vide', new RegExp("Domaine d'application : version 1, en vigueur depuis le " + fr(ajd).replace(/\//g, '\\/') + ", validée par Direction générale").test(txt) && /Nouvelle version le .* Domaine d'application : version 1/.test(txt) && /Registre du contexte vide/.test(txt) && !rd.erreurs.length, { err: rd.erreurs, t: txt.slice(0, 400) });
  const revue = (rd.lire('vigie_hse_revues_direction') || [])[0] || {};
  const co = revue.chiffres && revue.chiffres.contexteOrganisation;
  check('… photographié avec la revue', co && co.domaine && co.domaine.version === 1, co);
  check('… revue antérieure (sans domaine) : rien de plus ; aucun domaine : dit', !/Domaine d'application/.test(rd.w.contexteDeLaRevue({ contexteOrganisation: { enjeux: 1, parties: 0, risques: 0, opportunites: 0, mouvements: [] } })) && /Pas de domaine d'application en vigueur/.test(rd.w.contexteDeLaRevue({ contexteOrganisation: { domaine: null, enjeux: 1, parties: 0, risques: 0, opportunites: 0, mouvements: [] } })));

  // ---------- 8. Préparation ISO 45001 ----------
  const etat43 = async (stock) => { const q = await H.page('preparation-iso.html', PREV, stock); const tr = q.d.querySelector('#tbody tr[data-clause="4.3"]'); return { q, tr, etat: tr ? tr.querySelectorAll('td')[2].textContent.trim() : '', texte: tr ? tr.textContent : '' }; };
  let e = await etat43({});
  const LIB = e.q.w.VigiePreparation.LIBELLES;
  check('Préparation ISO, 4.3 : couverte ; sans domaine, aucun enregistrement', e.q.w.VigiePreparation.COUVERTURE['4.3'].c === 'couverte' && e.etat === LIB.rien && /aucun domaine d'application en vigueur/.test(e.texte) && !!e.tr.querySelector('a[href="contexte.html"]'), e.texte);
  e = await etat43({ [CLE]: J([v1]) });
  check('… domaine en vigueur : des enregistrements, version et date', e.etat === LIB.pret && /domaine d'application : version 1, en vigueur depuis le 15\/01\/2026/.test(e.texte), e.texte);
  e = await etat43({ [CLE]: J([ancien]) });
  check('… organisation changée depuis : à reprendre, et dit', e.etat === LIB.areprendre && /l'organisation a changé depuis cette version/.test(e.texte), e.texte);

  fin();
})().catch(e => { console.error(e); process.exit(2); });
