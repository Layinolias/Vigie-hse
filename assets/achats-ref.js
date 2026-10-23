/* ============================================================================
   VIGIE HSE — Achats et santé-sécurité (ISO 45001 § 8.1.4, 2026-10-21)
   ----------------------------------------------------------------------------
   Avant d'acheter un équipement, un produit, des EPI, un véhicule, du mobilier ou une prestation, la demande passe par
   un examen de santé-sécurité : des critères (marquage CE, notice, FDS, substitution, consultation des utilisateurs…),
   puis un avis (favorable, avec réserves, défavorable), puis la suite (acheté, abandonné). Partagé par la page Achats
   et santé-sécurité et la Préparation ISO 45001. Aucune écriture. À charger après dates-locales.js.

   Une demande (clé vigie_hse_achats) :
     { id, date, objet, nature (NATURES), usage (pour quoi, quels postes), service (absent : toute l'organisation),
       demandeur, fournisseur, criteres: [{ c (libellé), r: "oui"|"non"|"so"|"" , note }], avis (AVIS ou absent),
       avisPar, dateAvis, reserves (conditions, mesures à prendre), suite: "achete"|"abandonne" (absent : pas encore),
       dateSuite, noteSuite, auteur, dateCreation, modifiePar, dateMaj }

   Les critères sont des propositions, pas une liste réglementaire : chacun en ajoute, en marque « sans objet », et
   l'avis reste libre (un critère « non » n'interdit rien) — question 39 : comme aujourd'hui, réponse du préventeur du 2026-10-23.
============================================================================ */
(function (racine) {
  "use strict";

  const CLE = "vigie_hse_achats";
  const NATURES = ["Équipement de travail (machine, outil, appareil)", "Produit chimique", "Équipement de protection individuelle (EPI)",
    "Véhicule ou engin", "Mobilier, poste de travail", "Prestation ou sous-traitance", "Autre"];
  // Critères proposés : communs à toute demande, puis selon la nature (propositions, confirmées par le préventeur — question 39)
  const COMMUNS = ["Les futurs utilisateurs ont été consultés", "Les risques à l'usage ont été examinés (document unique)",
    "La formation ou l'habilitation nécessaire est identifiée"];
  const PAR_NATURE = {
    "Équipement de travail (machine, outil, appareil)": ["Marquage CE et déclaration de conformité fournis", "Notice d'instructions en français fournie",
      "Bruit, vibrations et ergonomie pris en compte", "Vérifications périodiques et entretien à prévoir identifiés"],
    "Produit chimique": ["Fiche de données de sécurité (FDS) obtenue avant l'achat", "Un produit moins dangereux a été recherché (substitution)",
      "Stockage et protections nécessaires identifiés"],
    "Équipement de protection individuelle (EPI)": ["Marquage CE et notice fournis", "Adapté au risque et aux personnes (tailles, confort), essayé par les utilisateurs",
      "Entretien et remplacement prévus"],
    "Véhicule ou engin": ["Équipements de sécurité adaptés à l'usage", "Poste de conduite et ergonomie examinés", "Vérifications périodiques et entretien à prévoir identifiés"],
    "Mobilier, poste de travail": ["Réglages et ergonomie adaptés aux utilisateurs"],
    "Prestation ou sous-traitance": ["Exigences de santé-sécurité écrites dans le cahier des charges", "Compétences et références de santé-sécurité du prestataire vérifiées",
      "Coordination prévue en cas d'intervention sur site (plan de prévention)"],
  };
  const criteresPour = (nature) => COMMUNS.concat(PAR_NATURE[nature] || []);
  const AVIS = ["Favorable", "Favorable avec réserves", "Défavorable"];
  const REPONSES = [["oui", "Oui"], ["non", "Non"], ["so", "Sans objet"]];

  const date = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || "") ? d : "";
  const valides = (l) => (Array.isArray(l) ? l : []).filter(a => a && typeof a === "object" && a.id && date(a.date));
  const criteres = (a) => (a && Array.isArray(a.criteres) ? a.criteres : []).filter(c => c && String(c.c || "").trim());
  const avisDonne = (a) => !!a && AVIS.includes(a.avis);
  // l'état d'une demande : à examiner, avis donné, achetée, abandonnée
  const etat = (a) => !a ? "" : a.suite === "achete" ? "achete" : a.suite === "abandonne" ? "abandonne" : avisDonne(a) ? "avis" : "examiner";
  const ETATS = { examiner: "À examiner", avis: "Avis donné", achete: "Achetée", abandonne: "Abandonnée" };
  // le compte des critères d'une demande
  function bilanCriteres(a) {
    const l = criteres(a);
    return { total: l.length, oui: l.filter(c => c.r === "oui").length, non: l.filter(c => c.r === "non").length,
      so: l.filter(c => c.r === "so").length, vides: l.filter(c => !["oui", "non", "so"].includes(c.r)).length };
  }
  // les demandes, la plus récente d'abord
  const triees = (l) => valides(l).slice().sort((a, b) => b.date.localeCompare(a.date) || String(b.dateCreation || "").localeCompare(String(a.dateCreation || "")));

  // Le compte : demandes, de l'année, par état, par avis, achetées sans avis ou malgré un avis défavorable
  function synthese(l, annee) {
    const v = valides(l), an = String(annee || "");
    return {
      total: v.length,
      annee: an ? v.filter(a => a.date.slice(0, 4) === an).length : 0,
      aExaminer: v.filter(a => etat(a) === "examiner").length,
      avisDonnes: v.filter(avisDonne).length,
      favorables: v.filter(a => a.avis === "Favorable").length,
      reserves: v.filter(a => a.avis === "Favorable avec réserves").length,
      defavorables: v.filter(a => a.avis === "Défavorable").length,
      achetees: v.filter(a => etat(a) === "achete").length,
      abandonnees: v.filter(a => etat(a) === "abandonne").length,
      acheteesSansAvis: v.filter(a => a.suite === "achete" && !avisDonne(a)).length,
      acheteesMalgreDefavorable: v.filter(a => a.suite === "achete" && a.avis === "Défavorable").length,
      avecCritereNon: v.filter(a => bilanCriteres(a).non > 0).length,
    };
  }
  // Les demandes d'une période (bornes comprises), la plus ancienne d'abord
  const pourPeriode = (l, debut, fin) => valides(l).filter(a => a.date >= debut && a.date <= fin).sort((a, b) => a.date.localeCompare(b.date));

  racine.VigieAchats = {
    CLE: CLE, NATURES: NATURES, COMMUNS: COMMUNS, PAR_NATURE: PAR_NATURE, criteresPour: criteresPour, AVIS: AVIS, REPONSES: REPONSES, ETATS: ETATS,
    valides: valides, criteres: criteres, avisDonne: avisDonne, etat: etat, bilanCriteres: bilanCriteres, triees: triees,
    synthese: synthese, pourPeriode: pourPeriode,
  };
})(typeof window !== "undefined" ? window : this);
