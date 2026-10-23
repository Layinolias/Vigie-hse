/* ============================================================================
   VIGIE HSE — Communication santé-sécurité (ISO 45001 § 7.4, 2026-10-21)
   ----------------------------------------------------------------------------
   Le plan de communication dit qui doit savoir quoi, quand, comment et par qui, en interne et vers l'extérieur ;
   les communications notées en gardent la trace, et celles reçues de l'extérieur la suite qui leur a été donnée.
   Partagé par la page Communication, la Préparation ISO 45001 et la Revue de direction. Aucune écriture.
   À charger après dates-locales.js.

   Un registre, une clé (vigie_hse_communication), deux sortes d'enregistrements :
     un sujet du plan : { id, registre:"sujet", sujet (quoi), sens: "interne"|"externe", public (à qui), quand,
       canal (comment), responsable (par qui), adaptations (langues, pictogrammes, accessibilité…), resultats (true : porte sur les résultats de la
       démarche, § 10.3), statut (absent :
       en cours ; "arrete"), service (absent : toute l'organisation), auteur, dateCreation, modifiePar, dateMaj }
     une communication notée : { id, registre:"trace", date, sens: "interne"|"externe"|"recue", sujetId (sujet du plan,
       facultatif), objet, public (à qui, ou de qui pour une communication reçue), canal, qui (par qui, ou reçue par),
       suite (suite donnée à une communication reçue), preuve, service, auteur, dateCreation, modifiePar, dateMaj }

   Des faits, sans jugement : « quand » est un texte libre, aucun rythme n'est vérifié, aucun sujet n'est exigé ;
   la page dit la dernière communication de chaque sujet, et les communications reçues sans suite notée —
   question 37 : comme aujourd'hui, réponse du préventeur du 2026-10-23.
   Les résultats au personnel (§ 10.3) : un sujet du plan peut porter sur les résultats de la démarche ; ses
   communications internes en sont la trace, reprise comme un fait (sans rythme) — question 40 au préventeur.
============================================================================ */
(function (racine) {
  "use strict";

  const CLE = "vigie_hse_communication";
  const SENS_SUJET = [["interne", "Interne"], ["externe", "Externe"]];
  const SENS_TRACE = [["interne", "Émise en interne"], ["externe", "Émise vers l'extérieur"], ["recue", "Reçue de l'extérieur"]];
  const libelleSens = (s) => (SENS_TRACE.concat(SENS_SUJET).find(x => x[0] === s) || ["", ""])[1];
  // des propositions à la saisie, pas des listes fermées (les mots du secteur passent par VigieOrga.mots() à l'affichage)
  const PUBLICS = ["Tous les agents", "L'encadrement", "Les membres de la F3SCT", "Les nouveaux arrivants",
    "Les intérimaires, stagiaires et saisonniers", "Les entreprises extérieures", "Les visiteurs",
    "La médecine du travail", "Les organismes de contrôle et d'inspection", "L'assureur", "Les usagers et le public", "Les riverains"];
  const QUAND = ["À l'arrivée d'une personne", "À chaque nouvelle version", "Chaque mois", "Chaque trimestre", "Chaque année",
    "Après un accident ou un presque-accident", "Avant des travaux ou une intervention", "En cas d'urgence"];
  const CANAUX = ["Affichage", "Réunion de service", "Note de service", "Courriel", "Intranet", "Flash Info du tableau de bord",
    "Entretien individuel", "Accueil au poste", "Réunion de la F3SCT", "Formation", "Livret ou guide", "Courrier", "Site Internet"];

  const date = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || "") ? d : "";
  const liste = (l) => (Array.isArray(l) ? l : []).filter(x => x && typeof x === "object" && x.id);
  const sujets = (l) => liste(l).filter(s => s.registre === "sujet" && String(s.sujet || "").trim());
  const traces = (l) => liste(l).filter(t => t.registre === "trace" && date(t.date));
  const actif = (s) => !!s && s.statut !== "arrete";
  const recue = (t) => !!t && t.sens === "recue";
  const sansSuite = (t) => recue(t) && !String(t.suite || "").trim();
  // les communications, la plus récente d'abord
  const triees = (l) => traces(l).slice().sort((a, b) => b.date.localeCompare(a.date) || String(b.dateCreation || "").localeCompare(String(a.dateCreation || "")));
  const tracesDe = (l, sujetId) => triees(l).filter(t => t.sujetId === sujetId);
  const derniere = (l, sujetId) => { const t = tracesDe(l, sujetId)[0]; return t ? t.date : ""; };
  const surResultats = (s) => !!s && s.resultats === true;

  // Le compte : sujets en cours (internes, externes), arrêtés, communications (de l'année), reçues et sans suite,
  // sujets en cours sans communication notée
  function synthese(l, annee) {
    const s = sujets(l), en = s.filter(actif), t = traces(l), an = String(annee || "");
    const avec = new Set(t.map(x => x.sujetId).filter(Boolean));
    return {
      sujets: en.length,
      internes: en.filter(x => x.sens !== "externe").length,
      externes: en.filter(x => x.sens === "externe").length,
      arretes: s.length - en.length,
      traces: t.length,
      annee: an ? t.filter(x => x.date.slice(0, 4) === an).length : 0,
      recues: t.filter(recue).length,
      recuesSansSuite: t.filter(sansSuite).length,
      sujetsSansTrace: en.filter(x => !avec.has(x.id)).map(x => x.id),
      derniere: t.map(x => x.date).sort().pop() || "",
    };
  }
  // Les résultats de la démarche portés à la connaissance du personnel (§ 10.3) : les communications internes des
  // sujets « résultats » — un sujet arrêté garde ses communications passées
  function resultatsAuPersonnel(l, annee) {
    const s = sujets(l).filter(surResultats), ids = new Set(s.map(x => x.id)), an = String(annee || "");
    const t = traces(l).filter(x => x.sens !== "externe" && !recue(x) && ids.has(x.sujetId));
    return {
      sujets: s.filter(actif).length,
      traces: t.length,
      annee: an ? t.filter(x => x.date.slice(0, 4) === an).length : 0,
      derniere: t.map(x => x.date).sort().pop() || "",
    };
  }
  // Les communications d'une période (bornes comprises), la plus ancienne d'abord
  const pourPeriode = (l, debut, fin) => traces(l).filter(t => t.date >= debut && t.date <= fin).sort((a, b) => a.date.localeCompare(b.date));
  // Pour la revue de direction (§ 9.3) : les communications avec l'extérieur de la période, émises et reçues
  function pourRevue(l, debut, fin) {
    const p = pourPeriode(l, debut, fin).filter(t => t.sens === "externe" || recue(t));
    return {
      emises: p.filter(t => t.sens === "externe").length,
      recues: p.filter(recue).length,
      sansSuite: p.filter(sansSuite).length,
      liste: p.map(t => ({ date: t.date, sens: t.sens, public: t.public || "", objet: String(t.objet || "").slice(0, 300), suite: String(t.suite || "").slice(0, 300) })),
    };
  }

  racine.VigieCommunication = {
    CLE: CLE, SENS_SUJET: SENS_SUJET, SENS_TRACE: SENS_TRACE, libelleSens: libelleSens, PUBLICS: PUBLICS, QUAND: QUAND, CANAUX: CANAUX,
    sujets: sujets, traces: traces, actif: actif, recue: recue, sansSuite: sansSuite, triees: triees, tracesDe: tracesDe, derniere: derniere,
    surResultats: surResultats, resultatsAuPersonnel: resultatsAuPersonnel, synthese: synthese, pourPeriode: pourPeriode, pourRevue: pourRevue,
  };
})(typeof window !== "undefined" ? window : this);
