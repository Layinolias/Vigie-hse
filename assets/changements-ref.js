/* ============================================================================
   VIGIE HSE — Gestion des changements (ISO 45001 § 8.1.3, 2026-10-15)
   ----------------------------------------------------------------------------
   Un changement prévu (organisation du travail, équipement, produit, locaux, méthode, exigence nouvelle…) : ce qui
   change et qui est concerné, les risques qu'il crée ou modifie et les mesures à prendre avant sa mise en œuvre,
   l'avis de l'instance si elle est consultée, la validation, la mise en œuvre, puis la revue de ses effets, imprévus
   compris. Partagé par la page Gestion des changements, le Plan d'actions et la Revue de direction (§ 9.3 b : les
   changements internes en sont une donnée d'entrée). Aucune écriture. À charger après dates-locales.js.

   Un changement (clé vigie_hse_changements) :
     { id, titre, nature (NATURES), description, service (absent : toute l'organisation), concernes, responsable,
       datePrevue (mise en œuvre prévue), risques: [{ id, texte, imprevu (vrai : effet imprévu relevé après la mise
       en œuvre), actions: [{ id, description, responsable, echeance }] }], duerp (vrai : le Document unique est à
       mettre à jour), duerpLe (mis à jour le), consulteLe, avis, valideLe, validePar, dateMiseEnOeuvre, revueLe,
       revuePrevue (revue prévue le), revuePar, revueConstat, annule (avec motifAnnulation, annuleLe, annulePar), auteur, dateCreation, modifiePar, dateMaj }
   Les actions rejoignent le Plan d'actions sous « pa-chg-<changement>-<action> » (origine « Changement »).

   Rien n'est imposé (question 29, réponse du 2026-10-16) : le préventeur valide ; tout ce qui touche à la sécurité au
   travail passe par une fiche ; le Document unique est coché « à mettre à jour » par défaut et rappelé au tableau de bord ;
   la revue se planifie librement (une semaine à quelques mois). Ce qui manque est dit (points d'attention) : mesures pas
   faites, mise en œuvre sans validation, Document unique pas mis à jour, effet imprévu sans action, revue en retard.
   ========================================================================== */
(function (racine) {
  "use strict";

  const CLE = "vigie_hse_changements";
  const NATURES = ["Organisation du travail", "Équipement, machine, véhicule", "Produit ou substance", "Locaux, aménagement",
    "Méthode ou procédé de travail", "Exigence légale nouvelle", "Autre"];
  const LIBELLES = { etude: "À l'étude", depasse: "Mise en œuvre prévue dépassée", valide: "Validé, à mettre en œuvre",
    arevoir: "Mis en œuvre, revue à faire", clos: "Revu", abandonne: "Abandonné" };
  const TONS = { etude: "neutre", depasse: "attention", valide: "neutre", arevoir: "attention", clos: "bon", abandonne: "neutre" };
  const dateOk = d => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);

  const risques = c => (c && Array.isArray(c.risques) ? c.risques : []).filter(r => r && typeof r === "object");
  const prevus = c => risques(c).filter(r => !r.imprevu);
  const imprevus = c => risques(c).filter(r => !!r.imprevu);
  const actionsDe = r => (r && Array.isArray(r.actions) ? r.actions : []).filter(a => a && String(a.description || "").trim());
  const idAction = (c, a) => "pa-chg-" + c.id + "-" + a.id;
  function statutAction(c, a, actions) {
    const p = (Array.isArray(actions) ? actions : []).find(x => x && x.id === idAction(c, a));
    return p ? (p.statut || "À faire") : "À faire";
  }
  // les mesures décidées avant la mise en œuvre (risques prévus), et celles qui ne sont pas faites au Plan d'actions
  const mesures = c => prevus(c).flatMap(actionsDe);
  const mesuresEnAttente = (c, actions) => mesures(c).filter(a => statutAction(c, a, actions) !== "Fait");
  // la date qui situe un changement : sa mise en œuvre réelle, sinon prévue
  const quand = c => dateOk(c && c.dateMiseEnOeuvre) ? c.dateMiseEnOeuvre : (dateOk(c && c.datePrevue) ? c.datePrevue : "");

  // L'état d'un changement à une date → { code, libelle, ton }
  function etat(c, aujourdhui) {
    const code = c && c.annule ? "abandonne" : dateOk(c && c.revueLe) ? "clos" : dateOk(c && c.dateMiseEnOeuvre) ? "arevoir"
      : (dateOk(c && c.datePrevue) && aujourdhui && aujourdhui > c.datePrevue) ? "depasse" : dateOk(c && c.valideLe) ? "valide" : "etude";
    return { code: code, libelle: LIBELLES[code], ton: TONS[code] };
  }

  // Ce qui manque, sans rien imposer → [{ code, texte }] ; rien pour un changement abandonné (aujourdhui : pour la revue en retard)
  function alertes(c, actions, aujourdhui) {
    if (!c || c.annule) return [];
    const l = [], n = mesuresEnAttente(c, actions).length, mo = dateOk(c.dateMiseEnOeuvre);
    if (n && !dateOk(c.revueLe)) l.push({ code: "mesures", texte: n + " mesure" + (n > 1 ? "s" : "") + " pas faite" + (n > 1 ? "s" : "") + (mo ? " (changement mis en œuvre)" : "") });
    if (mo && !dateOk(c.valideLe)) l.push({ code: "sansValidation", texte: "Mis en œuvre sans validation" });
    if (c.duerp && !dateOk(c.duerpLe)) l.push({ code: "duerp", texte: "Document unique à mettre à jour" });
    const sans = imprevus(c).filter(r => String(r.texte || "").trim() && !actionsDe(r).length).length;
    if (sans) l.push({ code: "imprevu", texte: sans + " effet" + (sans > 1 ? "s" : "") + " imprévu" + (sans > 1 ? "s" : "") + " sans action" });
    if (mo && !dateOk(c.revueLe) && dateOk(c.revuePrevue) && aujourdhui && aujourdhui > c.revuePrevue) l.push({ code: "revueRetard", texte: "Revue en retard (prévue le " + c.revuePrevue.split("-").reverse().join("/") + ")" });
    return l;
  }

  // Le compte d'une liste de changements à une date
  function synthese(liste, actions, aujourdhui) {
    const s = { changements: 0, enCours: 0, etude: 0, depasses: 0, valides: 0, aRevoir: 0, clos: 0, abandonnes: 0,
      mesuresEnAttente: 0, sansValidation: 0, duerpAMettreAJour: 0, imprevus: 0, imprevusSansAction: 0, revuesEnRetard: 0 };
    (Array.isArray(liste) ? liste : []).forEach(c => {
      if (!c || typeof c !== "object") return;
      const e = etat(c, aujourdhui).code;
      if (e === "abandonne") { s.abandonnes++; return; }
      s.changements++;
      if (e === "etude") s.etude++; else if (e === "depasse") s.depasses++; else if (e === "valide") s.valides++;
      else if (e === "arevoir") s.aRevoir++; else if (e === "clos") s.clos++;
      if (e === "etude" || e === "depasse" || e === "valide") s.enCours++;
      const al = alertes(c, actions, aujourdhui);
      if (e !== "clos") s.mesuresEnAttente += mesuresEnAttente(c, actions).length;
      if (al.some(a => a.code === "sansValidation")) s.sansValidation++;
      if (al.some(a => a.code === "duerp")) s.duerpAMettreAJour++;
      if (al.some(a => a.code === "revueRetard")) s.revuesEnRetard++;
      s.imprevus += imprevus(c).filter(r => String(r.texte || "").trim()).length;
      s.imprevusSansAction += imprevus(c).filter(r => String(r.texte || "").trim() && !actionsDe(r).length).length;
    });
    return s;
  }

  // Les changements d'une période (mise en œuvre réelle, sinon prévue, entre debut et fin ; abandonnés exclus), pour la
  // revue de direction → synthese + liste [{ titre, service, date, misEnOeuvre, etat, alertes }]
  function pourPeriode(liste, actions, debut, fin, aujourdhui) {
    const l = (Array.isArray(liste) ? liste : []).filter(c => c && typeof c === "object" && !c.annule && quand(c) && quand(c) >= debut && quand(c) <= fin);
    const s = synthese(l, actions, aujourdhui);
    s.misEnOeuvre = l.filter(c => dateOk(c.dateMiseEnOeuvre)).length;
    s.liste = l.slice().sort((a, b) => quand(a).localeCompare(quand(b))).map(c => ({ titre: c.titre || "", service: c.service || "", date: quand(c),
      misEnOeuvre: dateOk(c.dateMiseEnOeuvre), etat: etat(c, aujourdhui).libelle, alertes: alertes(c, actions, aujourdhui).map(a => a.texte) }));
    return s;
  }

  racine.VigieChangements = {
    CLE: CLE, NATURES: NATURES, LIBELLES: LIBELLES,
    risques: risques, prevus: prevus, imprevus: imprevus, actionsDe: actionsDe, idAction: idAction, statutAction: statutAction,
    mesures: mesures, mesuresEnAttente: mesuresEnAttente, quand: quand, etat: etat, alertes: alertes, synthese: synthese, pourPeriode: pourPeriode,
  };
})(typeof window !== "undefined" ? window : this);
