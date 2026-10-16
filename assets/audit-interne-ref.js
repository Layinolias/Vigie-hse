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
   Un audit peut se mener à partir d'une grille de questions (question 27 : « Trames : oui ») : ses questions sont copiées
   dans l'audit (grille: { id, nom }, questions: [{ id, clause, texte, reponse (REPONSES ou vide), commentaire }]) et
   chaque réponse « Non conforme » devient un constat (questionId). Les grilles (clé vigie_hse_grilles_audit) :
   { id, nom, description, questions: [{ id, clause, texte }] } ; GRILLE_DEFAUT, une question par clause, se modifie.

   Aucune fréquence ni cycle n'est imposé (question 27) : la page montre, clause par clause, la date du dernier audit
   réalisé et celle du prochain prévu, et les clauses jamais auditées.
   Réponse du préventeur (2026-10-16) : rythme libre ; l'auditeur est le préventeur ou l'ACFI, sans justification de son
   indépendance (le champ n'est plus demandé, une valeur déjà saisie reste lisible) ; constat « Non concerné » ajouté.
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
  // ce qu'un constat relève ; « Non concerné » : ce qui est examiné ne s'applique pas (question 27, réponse du 2026-10-16)
  const TYPES = ["Non-conformité", "Observation", "Point fort", "Non concerné"];
  const TONS_TYPE = { "Non-conformité": "mauvais", "Observation": "attention", "Point fort": "bon", "Non concerné": "neutre" };
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
    const s = { audits: 0, realises: 0, planifies: 0, depasses: 0, annules: 0, nonConformites: 0, observations: 0, pointsForts: 0, nonConcernes: 0,
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
        else if (k.type === "Non concerné") s.nonConcernes++;
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

  // ---------- Grilles de questions ----------
  const CLE_GRILLES = "vigie_hse_grilles_audit";
  const REPONSES = ["Conforme", "Non conforme", "Non concerné"];
  const TONS_REPONSE = { "Conforme": "bon", "Non conforme": "mauvais", "Non concerné": "neutre" };
  // une question par clause, formulée par l'application à partir de la norme : un point de départ, à adapter
  const GRILLE_DEFAUT = { id: "grille-iso45001", nom: "Une question par clause d'ISO 45001", defaut: true,
    description: "Grille proposée par l'application : une question par sous-clause des chapitres 4 à 10. À adapter à l'organisation.",
    questions: [
      ["4.1", "Les enjeux internes et externes qui pèsent sur la santé et la sécurité sont-ils identifiés et tenus à jour ?"],
      ["4.2", "Les parties intéressées et leurs attentes sont-elles identifiées, et celles qui deviennent des obligations repérées ?"],
      ["4.3", "Le périmètre du système (sites, services, activités) est-il défini et disponible ?"],
      ["4.4", "Le système est-il établi, appliqué et tenu à jour (processus, responsabilités, documents) ?"],
      ["5.1", "La direction montre-t-elle son engagement (moyens, revue de direction, soutien de l'encadrement) ?"],
      ["5.2", "La politique est-elle signée, communiquée, comprise et revue ?"],
      ["5.3", "Les rôles et responsabilités en santé et sécurité sont-ils attribués et connus ?"],
      ["5.4", "Les travailleurs et leurs représentants sont-ils consultés et associés (instance, remontées, analyses) ?"],
      ["6.1.1", "Les risques et opportunités pour la démarche sont-ils déterminés, avec des actions décidées ?"],
      ["6.1.2", "Les dangers sont-ils identifiés et les risques évalués (Document unique à jour) ?"],
      ["6.1.3", "Les exigences légales applicables sont-elles identifiées et tenues à jour ?"],
      ["6.1.4", "Les actions sont-elles planifiées (responsable, échéance), et leur efficacité vérifiée ?"],
      ["6.2", "Les objectifs sont-ils fixés, mesurables, suivis et communiqués ?"],
      ["7.1", "Les ressources nécessaires (humaines, techniques, financières) sont-elles déterminées et fournies ?"],
      ["7.2", "Les compétences requises sont-elles définies, et les formations et habilitations à jour ?"],
      ["7.3", "Les travailleurs connaissent-ils la politique, les risques de leur poste et la conduite à tenir ?"],
      ["7.4", "La communication interne et externe en santé et sécurité est-elle organisée ?"],
      ["7.5", "Les informations documentées sont-elles à jour, disponibles et conservées ?"],
      ["8.1.1", "Les mesures de prévention sont-elles appliquées sur le terrain ?"],
      ["8.1.2", "Les mesures suivent-elles l'ordre : supprimer le danger, substituer, protéger collectivement, puis individuellement ?"],
      ["8.1.3", "Les changements sont-ils maîtrisés avant leur mise en œuvre, et leurs effets revus ?"],
      ["8.1.4", "Les achats, les entreprises extérieures et la sous-traitance sont-ils maîtrisés (plans de prévention) ?"],
      ["8.2", "Les situations d'urgence sont-elles préparées, et les exercices réalisés ?"],
      ["9.1.1", "La performance est-elle surveillée et mesurée (indicateurs, vérifications périodiques) ?"],
      ["9.1.2", "La conformité aux exigences légales est-elle évaluée ?"],
      ["9.2", "Le programme d'audit interne est-il établi et réalisé ?"],
      ["9.3", "La revue de direction est-elle tenue, et ses décisions suivies ?"],
      ["10.1", "Les possibilités d'amélioration sont-elles identifiées ?"],
      ["10.2", "Les accidents, incidents et non-conformités sont-ils analysés et corrigés, et l'efficacité des actions vérifiée ?"],
      ["10.3", "L'amélioration continue est-elle démontrée (tendances, résultats) ?"],
    ].map((q, i) => ({ id: "gq-" + (i + 1), clause: q[0], texte: q[1] })) };
  const valideGrille = g => g && typeof g === "object" && g.id && Array.isArray(g.questions);
  // les grilles : la grille par défaut (telle qu'enregistrée si elle l'a été), puis les autres (always-merge)
  function grilles(stockees) {
    const l = (Array.isArray(stockees) ? stockees : []).filter(valideGrille);
    const d = l.find(g => g.id === GRILLE_DEFAUT.id);
    return [d || GRILLE_DEFAUT].concat(l.filter(g => g.id !== GRILLE_DEFAUT.id));
  }
  const questionsDe = au => (au && Array.isArray(au.questions) ? au.questions : []).filter(q => q && typeof q === "object" && q.id);
  // ce que la grille d'un audit a donné
  function bilanQuestions(au) {
    const q = questionsDe(au);
    return { total: q.length, repondues: q.filter(x => REPONSES.includes(x.reponse)).length, conformes: q.filter(x => x.reponse === "Conforme").length,
      nonConformes: q.filter(x => x.reponse === "Non conforme").length, nonConcernes: q.filter(x => x.reponse === "Non concerné").length };
  }
  // Les constats qu'appellent les réponses : un constat « Non-conformité » par réponse « Non conforme » (créé s'il manque) ;
  // le constat d'une question qui n'est plus « Non conforme » est retiré s'il n'a pas d'action, gardé sinon.
  // → { constats, ajoutes, retires, gardes } (constats : la liste à enregistrer)
  function constatsDesReponses(questions, constatsActuels, nouvelId) {
    const q = (Array.isArray(questions) ? questions : []).filter(x => x && x.id), nc = new Set(q.filter(x => x.reponse === "Non conforme").map(x => x.id));
    let ajoutes = 0, retires = 0, gardes = 0;
    const garde = (Array.isArray(constatsActuels) ? constatsActuels : []).filter(k => {
      if (!k || !k.questionId || nc.has(k.questionId)) return true;
      if (actionsDe(k).length) { gardes++; return true; }
      retires++; return false;
    });
    q.filter(x => nc.has(x.id) && !garde.some(k => k.questionId === x.id)).forEach(x => {
      ajoutes++;
      garde.push({ id: nouvelId(), clause: x.clause || "", type: "Non-conformité", texte: String(x.texte || "") + (String(x.commentaire || "").trim() ? " — " + String(x.commentaire).trim() : ""), preuve: "", actions: [], questionId: x.id });
    });
    return { constats: garde, ajoutes: ajoutes, retires: retires, gardes: gardes };
  }

  racine.VigieAuditInterne = {
    CLE_GRILLES: CLE_GRILLES, REPONSES: REPONSES, TONS_REPONSE: TONS_REPONSE, GRILLE_DEFAUT: GRILLE_DEFAUT, grilles: grilles,
    questionsDe: questionsDe, bilanQuestions: bilanQuestions, constatsDesReponses: constatsDesReponses,
    CLE: CLE, CLAUSES: CLAUSES, CHAPITRES: CHAPITRES, TYPES: TYPES, TONS_TYPE: TONS_TYPE, LIBELLES: LIBELLES,
    nomClause: nomClause, clausesDe: clausesDe, constats: constats, actionsDe: actionsDe, idAction: idAction, annee: annee,
    etat: etat, statutAction: statutAction, ncSoldee: ncSoldee, synthese: synthese, couverture: couverture, pourPeriode: pourPeriode,
  };
})(typeof window !== "undefined" ? window : this);
