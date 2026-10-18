/* ============================================================================
   VIGIE HSE — Rôles de prévention (ISO 45001 § 5.3, 2026-10-18)
   ----------------------------------------------------------------------------
   Qui tient quel rôle dans la démarche de santé et de sécurité (assistant ou conseiller de prévention, inspection,
   membres de l'instance, référents, secouristes…), sur quel périmètre, avec quelle mission, désigné quand et par
   qui, avec quelle formation. Partagé par la page Rôles de prévention et la Préparation ISO 45001. Aucune écriture.
   À charger après dates-locales.js.

   Un rôle (clé vigie_hse_roles_prevention) :
     { id, role, personne, agentId (fiche de Gestion RH, si choisie), service (absent : toute l'organisation),
       mission, designeLe, designePar, lettre (référence ou lien de la lettre de mission), formation, formationLe,
       contact, finLe (fin de fonction), motifFin, auteur, dateCreation, modifiePar, dateMaj }

   Rien n'est imposé (question 33) : aucun rôle n'est exigé, aucune formation n'a de durée de validité. Seul est dit
   ce qui manque à la fiche d'un rôle en fonction pour qu'il soit attribué par écrit : sa mission, sa date de
   désignation.
============================================================================ */
(function (racine) {
  "use strict";

  const CLE = "vigie_hse_roles_prevention";
  // Des propositions, jamais une liste fermée : chacun saisit les siens. Les mots du secteur passent par VigieOrga.mots().
  const SUGGESTIONS = {
    collectivite: ["Assistant de prévention", "Conseiller de prévention", "Agent chargé de la fonction d'inspection (ACFI)",
      "Membre de la F3SCT", "Référent du dispositif de signalement (violences, harcèlement, discriminations)",
      "Sauveteur secouriste du travail", "Chargé d'évacuation", "Correspondant santé-sécurité de service"],
    entreprise: ["Salarié désigné compétent en santé-sécurité", "Membre de la CSSCT", "Référent harcèlement sexuel et agissements sexistes",
      "Sauveteur secouriste du travail", "Chargé d'évacuation", "Correspondant santé-sécurité de service"],
  };
  function suggestions(secteur) { return (SUGGESTIONS[secteur] || SUGGESTIONS.collectivite).slice(); }

  const valides = (l) => (Array.isArray(l) ? l : []).filter(r => r && typeof r === "object" && r.id);
  const date = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || "") ? d : "";
  // terminé : une date de fin passée ou du jour
  function termine(r, aujourdhui) { return !!date(r && r.finLe) && r.finLe <= aujourdhui; }
  function enFonction(l, aujourdhui) { return valides(l).filter(r => !termine(r, aujourdhui)); }
  // ce qui manque pour qu'un rôle soit attribué par écrit
  function manques(r) {
    const m = [];
    if (!String(r.mission || "").trim()) m.push("mission");
    if (!date(r.designeLe)) m.push("date de désignation");
    return m;
  }
  function etat(r, aujourdhui) {
    if (termine(r, aujourdhui)) return { code: "termine", libelle: "Terminé" };
    return manques(r).length ? { code: "acompleter", libelle: "À compléter" } : { code: "enfonction", libelle: "En fonction" };
  }
  const norm = (s) => String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  function synthese(l, aujourdhui) {
    const v = valides(l), actifs = enFonction(v, aujourdhui);
    const personnes = new Set(actifs.map(r => r.agentId ? "id:" + r.agentId : "nom:" + norm(r.personne)).filter(k => k !== "nom:"));
    const roles = new Set(actifs.map(r => norm(r.role)).filter(Boolean));
    return { total: v.length, enFonction: actifs.length, termines: v.length - actifs.length, personnes: personnes.size, roles: roles.size,
      aCompleter: actifs.filter(r => manques(r).length).length };
  }

  racine.VigieRoles = {
    CLE: CLE, SUGGESTIONS: SUGGESTIONS, suggestions: suggestions,
    valides: valides, termine: termine, enFonction: enFonction, manques: manques, etat: etat, synthese: synthese,
  };
})(typeof window !== "undefined" ? window : this);
