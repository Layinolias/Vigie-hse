/* ============================================================================
   VIGIE HSE — Conformité réglementaire (ISO 45001 § 6.1.3 et § 9.1.2, 2026-10-15)
   ----------------------------------------------------------------------------
   Le registre des exigences légales et autres exigences qui s'appliquent à l'organisation, et l'évaluation de
   leur respect : l'état d'une exigence est celui de sa dernière évaluation. Partagé par la page Conformité
   réglementaire et la Revue de direction (§ 9.3 : les résultats de l'évaluation de la conformité en sont une
   donnée d'entrée). Aucune écriture. À charger après dates-locales.js.

   Une exigence (clé vigie_hse_exigences) :
     { id, intitule (ce qu'il faut faire), reference (le texte : article, décret, arrêté, norme…), lien, theme,
       service (absent : toute l'organisation), responsable, prochaineEvaluation (AAAA-MM-JJ, facultative),
       veilleId (l'actualité de la veille réglementaire dont elle vient, facultatif),
       evaluations: [{ id, date, etat, par, preuve, constat }], actions: [{ id, description, responsable, echeance }],
       statut ("En vigueur" ou « Retirée », avec retireeLe et retireePar), auteur, dateCreation, modifiePar, dateMaj }
   Ses actions rejoignent le Plan d'actions sous l'identifiant « pa-conf-<exigence>-<action> » (origine « Conformité »).

   Aucune périodicité n'est imposée : la date de la prochaine évaluation se fixe exigence par exigence, et une
   exigence dont la date est passée est « à réévaluer » (question 26 au préventeur).
   ========================================================================== */
(function (racine) {
  "use strict";

  const CLE = "vigie_hse_exigences";
  // ce qu'une évaluation constate ; « Non applicable » se garde : on sait pourquoi le texte a été écarté
  const ETATS = ["Conforme", "Partiellement conforme", "Non conforme", "Non applicable"];
  const CODES = { "Conforme": "conforme", "Partiellement conforme": "partiel", "Non conforme": "non-conforme", "Non applicable": "na" };
  const LIBELLES = { "a-evaluer": "À évaluer", conforme: "Conforme", partiel: "Partiellement conforme", "non-conforme": "Non conforme", na: "Non applicable" };
  const TONS = { "a-evaluer": "neutre", conforme: "bon", partiel: "attention", "non-conforme": "mauvais", na: "neutre" };
  const dateOk = d => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);

  // les évaluations valides, de la plus ancienne à la plus récente (à date égale, dans l'ordre d'enregistrement)
  function evaluations(ex) {
    return (ex && Array.isArray(ex.evaluations) ? ex.evaluations : []).map((e, i) => ({ e, i }))
      .filter(x => x.e && ETATS.includes(x.e.etat) && dateOk(x.e.date))
      .sort((a, b) => a.e.date.localeCompare(b.e.date) || a.i - b.i).map(x => x.e);
  }
  function derniere(ex) { const l = evaluations(ex); return l.length ? l[l.length - 1] : null; }
  const enVigueur = ex => !!ex && typeof ex === "object" && ex.statut !== "Retirée";

  // L'état d'une exigence à une date (AAAA-MM-JJ) → { code, libelle, ton, date et par (dernière évaluation), aReevaluer }
  function etat(ex, aujourdhui) {
    const d = derniere(ex), code = d ? CODES[d.etat] : "a-evaluer";
    const p = ex && dateOk(ex.prochaineEvaluation) ? ex.prochaineEvaluation : "";
    return { code: code, libelle: LIBELLES[code], ton: TONS[code], date: d ? d.date : "", par: d ? (d.par || "") : "",
      aReevaluer: !!d && !!p && !!aujourdhui && aujourdhui > p };
  }

  // Le bilan des exigences en vigueur à une date : comptes par état, taux de conformité (exigences conformes parmi
  // celles qui ont été évaluées et s'appliquent), et les écarts (non conformes d'abord, puis partiellement).
  function synthese(liste, aujourdhui) {
    const s = { total: 0, conformes: 0, partiels: 0, nonConformes: 0, nonApplicables: 0, aEvaluer: 0, aReevaluer: 0, taux: null, ecarts: [] };
    (Array.isArray(liste) ? liste : []).filter(enVigueur).forEach(ex => {
      const e = etat(ex, aujourdhui);
      s.total++;
      if (e.code === "conforme") s.conformes++;
      else if (e.code === "partiel") s.partiels++;
      else if (e.code === "non-conforme") s.nonConformes++;
      else if (e.code === "na") s.nonApplicables++;
      else s.aEvaluer++;
      if (e.aReevaluer) s.aReevaluer++;
      if (e.code === "partiel" || e.code === "non-conforme")
        s.ecarts.push({ intitule: ex.intitule || "", reference: ex.reference || "", service: ex.service || "", code: e.code, libelle: e.libelle, date: e.date });
    });
    const evaluees = s.conformes + s.partiels + s.nonConformes;
    s.taux = evaluees ? Math.round(s.conformes * 100 / evaluees) : null;
    s.ecarts.sort((a, b) => (a.code === b.code ? 0 : a.code === "non-conforme" ? -1 : 1) || String(a.date).localeCompare(String(b.date)));
    return s;
  }

  const idAction = (ex, a) => "pa-conf-" + ex.id + "-" + a.id;

  racine.VigieConformite = {
    CLE: CLE, ETATS: ETATS, LIBELLES: LIBELLES,
    evaluations: evaluations, derniere: derniere, enVigueur: enVigueur, etat: etat, synthese: synthese, idAction: idAction,
  };
})(typeof window !== "undefined" ? window : this);
