/* ============================================================================
   VIGIE HSE — Engagement de la direction (ISO 45001 § 5.1, 2026-10-21)
   ----------------------------------------------------------------------------
   L'engagement lui-même relève de la direction ; l'outil en garde les traces : une visite de terrain, un message au
   personnel, une décision sur les moyens, une participation à l'instance… chacune datée, avec qui, ce qui a été fait,
   les points du § 5.1 qu'elle illustre et sa preuve. Partagé par la page Engagement de la direction et la Préparation
   ISO 45001. Aucune écriture. À charger après dates-locales.js.

   Une trace (clé vigie_hse_engagement_direction) :
     { id, date, qui (membre de la direction), forme (FORMES : une proposition, pas une liste fermée), objet (ce qui a été
       fait, dit ou décidé), points: ["a", "e"…] (POINTS), service (absent : toute l'organisation), preuve (référence ou
       lien), auteur, dateCreation, modifiePar, dateMaj }

   Des faits, sans jugement (comme la Préparation ISO 45001, question 31) : aucun rythme n'est imposé, aucun point
   n'est exigé ; la page dit combien de traces chaque point a, et la plus récente — question 36 au préventeur.
============================================================================ */
(function (racine) {
  "use strict";

  const CLE = "vigie_hse_engagement_direction";
  // Les points du § 5.1, résumés (les mots du secteur passent par VigieOrga.mots() à l'affichage)
  const POINTS = [
    ["a", "Rendre compte de la prévention des accidents et des atteintes à la santé"],
    ["b", "Fixer la politique et les objectifs, en accord avec l'orientation de l'organisation"],
    ["c", "Intégrer la santé-sécurité au fonctionnement de l'organisation"],
    ["d", "Donner les moyens nécessaires"],
    ["e", "Faire savoir que la santé-sécurité compte, et que ses exigences s'appliquent"],
    ["f", "Veiller à ce que la démarche atteigne ses résultats"],
    ["g", "Diriger et soutenir ceux qui y contribuent"],
    ["h", "Promouvoir l'amélioration continue"],
    ["i", "Soutenir l'encadrement dans son rôle de prévention"],
    ["j", "Développer une culture de prévention"],
    ["k", "Protéger contre les représailles ceux qui signalent un incident, un danger ou un risque"],
    ["l", "Faire vivre la consultation et la participation des travailleurs"],
    ["m", "Soutenir la F3SCT"],
  ];
  const LETTRES = POINTS.map(p => p[0]);
  const libellePoint = (c) => (POINTS.find(p => p[0] === c) || [c, c])[1];
  // des propositions à la saisie, pas une liste fermée
  const FORMES = ["Visite de terrain", "Message au personnel", "Décision sur les moyens (budget, effectifs, matériel)",
    "Participation à une instance ou à une réunion de prévention", "Réunion de pilotage", "Reconnaissance d'une bonne pratique",
    "Suite donnée à un signalement ou à un accident", "Autre"];

  const date = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || "") ? d : "";
  const valides = (l) => (Array.isArray(l) ? l : []).filter(t => t && typeof t === "object" && t.id && date(t.date));
  const pointsDe = (t) => (t && Array.isArray(t.points) ? t.points : []).filter(c => LETTRES.includes(c));
  // les traces, la plus récente d'abord
  const triees = (l) => valides(l).slice().sort((a, b) => b.date.localeCompare(a.date) || String(b.dateCreation || "").localeCompare(String(a.dateCreation || "")));
  const norm = (s) => String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

  // Le compte : traces, celles d'une année, personnes, et pour chaque point le nombre de traces et la plus récente
  function synthese(l, annee) {
    const v = valides(l), parPoint = {};
    LETTRES.forEach(c => { parPoint[c] = { n: 0, derniere: "" }; });
    v.forEach(t => pointsDe(t).forEach(c => { const p = parPoint[c]; p.n++; if (t.date > p.derniere) p.derniere = t.date; }));
    const an = String(annee || "");
    return {
      total: v.length,
      annee: an ? v.filter(t => t.date.slice(0, 4) === an).length : 0,
      personnes: new Set(v.map(t => norm(t.qui)).filter(Boolean)).size,
      derniere: v.map(t => t.date).sort().pop() || "",
      parPoint: parPoint,
      pointsAvecTrace: LETTRES.filter(c => parPoint[c].n).length,
      pointsSansTrace: LETTRES.filter(c => !parPoint[c].n),
    };
  }
  // Les traces d'une période (bornes comprises), la plus ancienne d'abord
  const pourPeriode = (l, debut, fin) => valides(l).filter(t => t.date >= debut && t.date <= fin).sort((a, b) => a.date.localeCompare(b.date));

  racine.VigieEngagement = {
    CLE: CLE, POINTS: POINTS, LETTRES: LETTRES, FORMES: FORMES, libellePoint: libellePoint,
    valides: valides, pointsDe: pointsDe, triees: triees, synthese: synthese, pourPeriode: pourPeriode,
  };
})(typeof window !== "undefined" ? window : this);
