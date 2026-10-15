/* ============================================================================
   VIGIE HSE — Audit interne du système de management (ISO 45001 § 9.2, 2026-10-15)
   ----------------------------------------------------------------------------
   Le programme d'audit interne : audits planifiés et réalisés, clauses auditées, auditeur et ce qui garantit son
   indépendance, constats, actions. Partagé par la page Audit interne, le Plan d'actions et la Revue de direction
   (§ 9.3 : les résultats d'audit en sont une donnée d'entrée). Aucune écriture. À charger après dates-locales.js.

   Un audit (clé vigie_hse_audits_internes) :
     { id, titre, clauses: ["9.2", …] (CLAUSES ci-dessous), criteres (autres critères : procédure interne, autre
       référentiel…), service (absent : toute l'organisation), datePrevue, dateRealisee (absente : pas encore réalisé),
       auditeur, independance (ce qui garantit que l'auditeur n'audite pas son propre travail), conclusion,
       constats: [{ id, clause, type, texte, preuve, actions: [{ id, description, responsable, echeance }] }],
       annule (avec motifAnnulation, annuleLe, annulePar), auteur, dateCreation, modifiePar, dateMaj }
   Les actions d'un constat rejoignent le Plan d'actions sous « pa-audit-<audit>-<action> » (origine « Audit interne »).

   Aucune fréquence ni cycle n'est imposé (question 27) : la page montre, clause par clause, la date du dernier audit
   réalisé et celle du prochain prévu, et les clauses jamais auditées.
   ========================================================================== */
(function (racine) {
  "use strict";

  const CLE = "vigie_hse_audits_internes";
  // Les sous-clauses des chapitres 4 à 10 d'ISO 45001, formulées par l'application (pas le texte de la norme) :
  // les mêmes que la carte de couverture (Documentation/CARTE-ISO-45001.md).
  const CLAUSES = [
    ["4.1", "Contexte de l'organisme"], ["4.2", "Attentes des travailleurs et des parties intéressées"], ["4.3", "Domaine d'application du système"], ["4.4", "Système de management"],
    ["5.1", "Leadership et engagement"], ["5.2", "Politique de santé et de sécurité"], ["5.3", "Rôles, responsabilités et autorités"], ["5.4", "Consultation et participation des travailleurs"],
    ["6.1.1", "Risques et opportunités du système"], ["6.1.2", "Identification des dangers, évaluation des risques"], ["6.1.3", "Exigences légales et autres exigences"], ["6.1.4", "Planification des actions"], ["6.2", "Objectifs de santé et de sécurité"],
    ["7.1", "Ressources"], ["7.2", "Compétences"], ["7.3", "Sensibilisation"], ["7.4", "Communication"], ["7.5", "Informations documentées"],
    ["8.1.1", "Planification et maîtrise opérationnelles"], ["8.1.2", "Élimination des dangers et réduction des risques"], ["8.1.3", "Management du changement"], ["8.1.4", "Achats, intervenants extérieurs, externalisation"], ["8.2", "Préparation et réponse aux situations d'urgence"],
    ["9.1.1", "Surveillance, mesure, analyse"], ["9.1.2", "Évaluation de la conformité"], ["9.2", "Audit interne"], ["9.3", "Revue de direction"],
    ["10.1", "Amélioration : généralités"], ["10.2", "Événements, non-conformités, actions correctives"], ["10.3", "Amélioration continue"],
  ];
  const CHAPITRES = { "4": "Contexte de l'organisme", "5": "Leadership et participation", "6": "Planification", "7": "Support", "8": "Réalisation des activités opérationnelles", "9": "Évaluation des performances", "10": "Amélioration" };
  const NOMS = {};
  CLAUSES.forEach(c => { NOMS[c[0]] = c[1]; });
  const nomClause = c => NOMS[c] ? c + " " + NOMS[c] : (c ? String(c) : "Autre critère");
  // ce qu'un constat relève (question 27 : à confirmer avec le préventeur)
  const TYPES = ["Non-conformité", "Observation", "Point fort"];
  const TONS_TYPE = { "Non-conformité": "mauvais", "Observation": "attention", "Point fort": "bon" };
  const LIBELLES = { planifie: "Planifié", depasse: "Date dépassée", realise: "Réalisé", annule: "Annulé" };
  const TONS = { planifie: "neutre", depasse: "attention", realise: "bon", annule: "neutre" };
  const dateOk = d => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);

  const constats = au => (au && Array.isArray(au.constats) ? au.constats : []).filter(k => k && typeof k === "object");
  const actionsDe = k => (k && Array.isArray(k.actions) ? k.actions : []).filter(a => a && String(a.description || "").trim());
  const idAction = (au, a) => "pa-audit-" + au.id + "-" + a.id;
  const clausesDe = au => (au && Array.isArray(au.clauses) ? au.clauses : []).filter(c => NOMS[c]);
  // l'année d'un audit : celle de sa réalisation, sinon celle où il est prévu
  const annee = au => { const d = dateOk(au && au.dateRealisee) ? au.dateRealisee : (dateOk(au && au.datePrevue) ? au.datePrevue : ""); return d ? Number(d.slice(0, 4)) : null; };

  // L'état d'un audit à une date → { code, libelle, ton }
  function etat(au, aujourdhui) {
    const code = au && au.annule ? "annule" : dateOk(au && au.dateRealisee) ? "realise"
      : (dateOk(au && au.datePrevue) && aujourdhui && aujourdhui > au.datePrevue) ? "depasse" : "planifie";
    return { code: code, libelle: LIBELLES[code], ton: TONS[code] };
  }

  // L'état d'une action d'audit : celui du Plan d'actions s'il l'a reprise, sinon « À faire »
  function statutAction(au, a, actions) {
    const p = (Array.isArray(actions) ? actions : []).find(x => x && x.id === idAction(au, a));
    return p ? (p.statut || "À faire") : "À faire";
  }
  // Une non-conformité est soldée quand elle a au moins une action et que toutes sont « Fait » au Plan d'actions
  function ncSoldee(au, k, actions) {
    const l = actionsDe(k);
    return l.length > 0 && l.every(a => statutAction(au, a, actions) === "Fait");
  }

  // Le bilan d'une liste d'audits (non annulés) : réalisés, prévus, constats par type, non-conformités sans action ou en cours.
  function synthese(liste, actions, aujourdhui) {
    const s = { audits: 0, realises: 0, planifies: 0, depasses: 0, annules: 0, nonConformites: 0, observations: 0, pointsForts: 0,
      ncSansAction: 0, ncEnCours: 0, ncSoldees: 0, clausesAuditees: [] };
    const vues = new Set();
    (Array.isArray(liste) ? liste : []).forEach(au => {
      if (!au || typeof au !== "object") return;
      const e = etat(au, aujourdhui);
      if (e.code === "annule") { s.annules++; return; }
      s.audits++;
      if (e.code === "realise") { s.realises++; clausesDe(au).forEach(c => vues.add(c)); }
      else if (e.code === "depasse") s.depasses++;
      else s.planifies++;
      constats(au).forEach(k => {
        if (k.type === "Non-conformité") {
          s.nonConformites++;
          if (!actionsDe(k).length) s.ncSansAction++;
          else if (ncSoldee(au, k, actions)) s.ncSoldees++;
          else s.ncEnCours++;
        } else if (k.type === "Observation") s.observations++;
        else if (k.type === "Point fort") s.pointsForts++;
      });
    });
    s.clausesAuditees = CLAUSES.map(c => c[0]).filter(c => vues.has(c));
    return s;
  }

  // Clause par clause : le dernier audit réalisé qui l'a couverte, le prochain prévu, et les non-conformités relevées sur elle.
  function couverture(liste, actions, aujourdhui) {
    const l = (Array.isArray(liste) ? liste : []).filter(au => au && typeof au === "object" && !au.annule);
    return CLAUSES.map(([c, nom]) => {
      const r = { clause: c, nom: nom, audits: 0, dernier: "", dernierAudit: null, prochain: "", prochainAudit: null, nonConformites: 0, ncOuvertes: 0 };
      l.forEach(au => {
        if (!clausesDe(au).includes(c)) return;
        if (dateOk(au.dateRealisee)) {
          r.audits++;
          if (au.dateRealisee > r.dernier) { r.dernier = au.dateRealisee; r.dernierAudit = au; }
        } else if (dateOk(au.datePrevue) && (!r.prochain || au.datePrevue < r.prochain)) { r.prochain = au.datePrevue; r.prochainAudit = au; }
      });
      l.forEach(au => constats(au).forEach(k => {
        if (k.clause !== c || k.type !== "Non-conformité") return;
        r.nonConformites++;
        if (!ncSoldee(au, k, actions)) r.ncOuvertes++;
      }));
      return r;
    });
  }

  // Pour la revue de direction : les audits réalisés ou prévus dans la période [debut, fin], et leurs constats.
  function pourPeriode(liste, actions, debut, fin, aujourdhui) {
    const dans = d => dateOk(d) && (!debut || d >= debut) && (!fin || d <= fin);
    const l = (Array.isArray(liste) ? liste : []).filter(au => au && typeof au === "object" && !au.annule
      && (dateOk(au.dateRealisee) ? dans(au.dateRealisee) : dans(au.datePrevue)));
    const s = synthese(l, actions, aujourdhui);
    s.nc = [];
    l.forEach(au => constats(au).filter(k => k.type === "Non-conformité").forEach(k => {
      s.nc.push({ audit: au.titre || "", date: au.dateRealisee || au.datePrevue || "", clause: k.clause || "", texte: k.texte || "",
        etat: !actionsDe(k).length ? "sans action" : ncSoldee(au, k, actions) ? "soldée" : "action en cours" });
    }));
    s.nc.sort((a, b) => (a.etat === "soldée") - (b.etat === "soldée") || String(a.date).localeCompare(String(b.date)));
    return s;
  }

  racine.VigieAuditInterne = {
    CLE: CLE, CLAUSES: CLAUSES, CHAPITRES: CHAPITRES, TYPES: TYPES, TONS_TYPE: TONS_TYPE, LIBELLES: LIBELLES,
    nomClause: nomClause, clausesDe: clausesDe, constats: constats, actionsDe: actionsDe, idAction: idAction, annee: annee,
    etat: etat, statutAction: statutAction, ncSoldee: ncSoldee, synthese: synthese, couverture: couverture, pourPeriode: pourPeriode,
  };
})(typeof window !== "undefined" ? window : this);
