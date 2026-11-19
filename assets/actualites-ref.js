/* ==========================================================================
   VIGIE HSE — Flash info interne et actualités du secteur HSE (2026-11-19)
   --------------------------------------------------------------------------
   Lu par le module « Flash info et actualités » (actualites.html), qui les gère,
   et par le tableau de bord, qui les affiche. Avant, les deux vivaient dans
   Administration (onglets Flash Info et Veille réglementaire).

   - Flash info (vigie_hse_news) : { id, titre, texte, date, image, auteur,
     archive (vrai : archivé à la main ; faux : gardé publié même ancien),
     archiveLe, archivePar }.
     Un flash est archivé s'il l'a été à la main, ou — réglage « archiver après
     N jours », 0 = jamais — si sa date a plus de N jours et qu'on ne l'a pas
     gardé publié. Un archivé quitte le tableau de bord ; il reste lisible dans
     le module, onglet « Archives », et se republie.
   - Actualités du secteur HSE (vigie_hse_veille) : { id, titre, source, date,
     categorie, statut (« À lire », « Lu », « Archivé »), secteur, resume, url }.
     Celles du statut « Archivé » ou d'un autre secteur ne s'affichent pas.
   - Réglages (vigie_hse_actualites_reglages) : { afficherVeille, archiverApresJours }.
     afficherVeille faux : le tableau de bord ne montre plus le panneau des
     actualités du secteur HSE.
   ========================================================================== */
(function (racine) {
  "use strict";

  var CLE_FLASH = "vigie_hse_news", CLE_VEILLE = "vigie_hse_veille", CLE_REGLAGES = "vigie_hse_actualites_reglages";
  var REGLAGES_DEFAUT = { afficherVeille: true, archiverApresJours: 0 };
  var CATEGORIES = ["Loi / Réglementation", "Jurisprudence", "Norme / Référentiel", "Actu métier"];
  var STATUTS_VEILLE = ["À lire", "Lu", "Archivé"];

  // Actualités de démonstration de la veille (graine posée au premier affichage, comme avant).
  function veilleDefaut() {
    return [
      { id:"v-1", secteur:"collectivite", titre:"DUERP en collectivité territoriale : ce qui change vraiment en 2026", source:"Inforisque", date:"2026-05-04", categorie:"Loi / Réglementation", statut:"À lire", resume:"Sanctions renforcées depuis le 27 juin 2026 (loi de lutte contre les fraudes sociales et fiscales) ; le DUERP doit désormais intégrer plus explicitement les risques psychosociaux, le télétravail et les conditions de travail extrêmes.", url:"https://inforisque.fr/actualite-du-risque/article-13007-2026-05-04-DUERP-collectivite-territoriale-change-vraiment-2026.html" },
      { id:"v-2", secteur:"collectivite", titre:"Nouveau plan santé au travail dans la fonction publique : cap sur 2026", source:"Weka", date:"2026-06-01", categorie:"Actu métier", statut:"À lire", resume:"Élaboration d'ici l'été 2026 d'un nouveau plan santé au travail, qui succède au plan 2022-2025 et se recentre sur les TMS, les RPS, l'usure professionnelle et le maintien en emploi.", url:"https://www.weka.fr/actualite/sante-et-securite-au-travail/article/nouveau-plan-sante-au-travail-dans-la-fonction-publique-cap-sur-2026-210605/" },
      { id:"v-3", secteur:"collectivite", titre:"Arrêts maladie : la réforme s'applique-t-elle aux agents territoriaux ?", source:"Weka", date:"2026-09-01", categorie:"Loi / Réglementation", statut:"À lire", resume:"Le décret n° 2026-498 du 12 juin 2026 plafonne la durée des arrêts de travail : 31 jours maximum en première prescription, 62 jours en prolongation.", url:"https://www.weka.fr/actualite/sante-et-securite-au-travail/article/arrets-maladie-la-reforme-des-arrets-de-travail-au-1er-septembre-2026-s-applique-t-elle-aux-agents-territoriaux-215658/" },
      { id:"v-4", secteur:"collectivite", titre:"La DGAFP prépare le Plan Santé au Travail dans la fonction publique 2026-2030", source:"Préventica", date:"2026-02-13", categorie:"Actu métier", statut:"À lire", resume:"Prise de parole institutionnelle sur les priorités du futur plan pluriannuel de santé au travail pour l'ensemble des agents publics.", url:"https://www.preventica.com/magazine/actualites/la-dgafp-prepare-le-plan-sante-au-travail-dans-la-fonction-publique-2026-2030-13022026" },
      { id:"v-5", secteur:"tous", titre:"Bulletin d'actualité juridique — janvier 2026", source:"INRS", date:"2026-01-15", categorie:"Loi / Réglementation", statut:"À lire", resume:"Sélection mensuelle des textes officiels parus en prévention des risques professionnels, en France et en Europe.", url:"https://www.inrs.fr/actualites/bulletin-juridique-janvier-2026.html" },
      { id:"v-6", secteur:"tous", titre:"Travail & Sécurité n°879 — mars 2026", source:"INRS", date:"2026-03-01", categorie:"Actu métier", statut:"À lire", resume:"Nouveau numéro de la revue technique de référence de l'INRS sur la santé et la sécurité au travail.", url:"https://www.inrs.fr/actualites/TS-879-mars-2026.html" },
      { id:"v-7", secteur:"collectivite", titre:"Santé et sécurité au travail — ressources officielles", source:"Portail de la Fonction publique", date:"2026-01-01", categorie:"Norme / Référentiel", statut:"À lire", resume:"Page de référence du portail officiel de la fonction publique sur les obligations et ressources en santé-sécurité au travail des agents publics.", url:"https://www.fonction-publique.gouv.fr/etre-agent-public/mon-quotidien-au-travail/sante-et-securite-au-travail" }
    ];
  }

  // secteur d'une actualité : celui qu'elle porte ; à défaut (enregistrée avant le 2026-10-06), celui de
  // l'actualité d'origine du même identifiant, sinon « tous »
  function secteurDe(v) {
    if (v && v.secteur) return v.secteur;
    var d = veilleDefaut().filter(function (x) { return v && x.id === v.id; })[0];
    return (d && d.secteur) || "tous";
  }

  // Réglages complets : les valeurs enregistrées sur les valeurs par défaut.
  function reglages(enregistres) {
    var r = { afficherVeille: REGLAGES_DEFAUT.afficherVeille, archiverApresJours: REGLAGES_DEFAUT.archiverApresJours };
    if (enregistres && typeof enregistres === "object" && !Array.isArray(enregistres)) {
      if (typeof enregistres.afficherVeille === "boolean") r.afficherVeille = enregistres.afficherVeille;
      var n = parseInt(enregistres.archiverApresJours, 10);
      if (n > 0) r.archiverApresJours = Math.min(n, 3650);
    }
    return r;
  }

  // Nombre de jours entre deux dates « AAAA-MM-JJ » (calendaires, sans fuseau) ; null si l'une n'en est pas une.
  function jour(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5 : null;
  }
  function joursEntre(a, b) {
    var x = jour(a), y = jour(b);
    return x === null || y === null ? null : y - x;
  }

  // Un flash est archivé : à la main (archive vrai), ou trop ancien d'après le réglage, sauf s'il a été gardé publié (archive faux).
  function flashArchive(n, r, aujourdhui) {
    if (!n) return false;
    if (n.archive === true) return true;
    if (n.archive === false) return false;
    var N = reglages(r).archiverApresJours, age = joursEntre(n.date, aujourdhui);
    return N > 0 && age !== null && age > N;
  }
  // archivé par le réglage seulement (pas à la main) : pour le dire à l'écran
  function archiveAuto(n, r, aujourdhui) { return !!n && n.archive !== true && flashArchive(n, r, aujourdhui); }

  var recentsDabord = function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); };
  function valides(l) { return (Array.isArray(l) ? l : []).filter(function (x) { return x && typeof x === "object" && x.id; }); }
  function flashPublies(liste, r, aujourdhui) {
    return valides(liste).filter(function (n) { return !flashArchive(n, r, aujourdhui); }).sort(recentsDabord);
  }
  function flashArchives(liste, r, aujourdhui) {
    return valides(liste).filter(function (n) { return flashArchive(n, r, aujourdhui); }).sort(recentsDabord);
  }
  // Actualités du secteur HSE montrées au tableau de bord : pas archivées, du secteur de l'organisation (concerne : VigieOrga.concerne).
  function veilleAffichee(liste, concerne) {
    return valides(liste).filter(function (v) { return v.statut !== "Archivé" && (!concerne || concerne(secteurDe(v))); }).sort(recentsDabord);
  }

  var API = {
    CLE_FLASH: CLE_FLASH, CLE_VEILLE: CLE_VEILLE, CLE_REGLAGES: CLE_REGLAGES,
    REGLAGES_DEFAUT: REGLAGES_DEFAUT, CATEGORIES: CATEGORIES, STATUTS_VEILLE: STATUTS_VEILLE,
    veilleDefaut: veilleDefaut, secteurDe: secteurDe, reglages: reglages, joursEntre: joursEntre,
    flashArchive: flashArchive, archiveAuto: archiveAuto, flashPublies: flashPublies, flashArchives: flashArchives,
    veilleAffichee: veilleAffichee
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  racine.VigieActualites = API;
})(typeof window !== "undefined" ? window : globalThis);
