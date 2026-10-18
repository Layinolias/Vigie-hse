/* ============================================================================
   VIGIE HSE — Préparation ISO 45001 : la carte de couverture, lue en direct (2026-10-16)
   ----------------------------------------------------------------------------
   Pour chacune des 30 sous-clauses des chapitres 4 à 10 : ce que l'outil couvre (la carte, Documentation/
   CARTE-ISO-45001.md, tenue à la main — COUVERTURE ci-dessous) et ce que montrent aujourd'hui les enregistrements
   (calculé ici, sans rien écrire). C'est la « matrice de conformité intégrée » de la roadmap (J1, idée 5).

   L'état du jour ne juge pas : il ne dit que des faits et reprend les états que chaque module calcule déjà
   (retards, revues dépassées, éléments sans action). Aucun délai n'est inventé ici — ce qu'un auditeur attend comme
   fraîcheur des preuves est demandé au préventeur (question 31).
     « pret »       : des enregistrements, rien que leur module signale ;
     « areprendre » : des enregistrements, et des points que leur module signale (retard, revue à faire…) ;
     « rien »       : aucun enregistrement (pas forcément un défaut : aucun changement, aucune intervention…) ;
     « hors »       : hors de l'outil ;
     « partiel »    : non calculé, ce compte ne reçoit pas toutes les données nécessaires.

   À charger après dates-locales.js, organisation.js, indicateurs.js (et ses dépendances) et les composants des
   modules lus (audit-interne-ref, politique-ref, changements-ref, contexte-ref, conformite-ref) : un composant absent
   rend sa clause « partiel ».
   ========================================================================== */
(function (racine) {
  "use strict";

  const P = (f, l) => [f, l];
  // ce que l'outil couvre, clause par clause (tenu à la main, comme la carte) : couverte, partielle, hors
  const COUVERTURE = {
    "4.1": { c: "couverte", pages: [P("contexte.html", "Contexte et enjeux")] },
    "4.2": { c: "couverte", pages: [P("contexte.html", "Contexte et enjeux"), P("registre-sst.html", "Registre SST"), P("dialogue-social.html", "Dialogue social")] },
    "4.3": { c: "partielle", pages: [P("administration.html", "Administration (organisation)")], manque: "un énoncé du périmètre, daté et diffusé" },
    "4.4": { c: "hors", pages: [], manque: "l'application dans son ensemble est un outil du système" },
    "5.1": { c: "partielle", pages: [P("revue-direction.html", "Revue de direction"), P("reporting.html", "Indicateurs & Reporting")], manque: "l'engagement relève de la direction ; l'outil en garde les traces" },
    "5.2": { c: "couverte", pages: [P("politique-sante-securite.html", "Politique santé-sécurité")], manque: "la communication aux parties intéressées extérieures reste à la main" },
    "5.3": { c: "partielle", pages: [P("administration.html", "Administration (profils)"), P("gestion-rh.html", "Gestion RH"), P("urgences-exercices.html", "Situations d'urgence")], manque: "un registre des rôles de prévention, avec leur mission et leur date de désignation" },
    "5.4": { c: "couverte", pages: [P("registre-sst.html", "Registre SST"), P("dialogue-social.html", "Dialogue social"), P("signalements.html", "Signalements")] },
    "6.1.1": { c: "couverte", pages: [P("contexte.html", "Contexte et enjeux")] },
    "6.1.2": { c: "couverte", pages: [P("document-unique.html", "Document unique"), P("penibilite.html", "Pénibilité"), P("produits-chimiques.html", "Produits chimiques")] },
    "6.1.3": { c: "couverte", pages: [P("conformite.html", "Conformité réglementaire")] },
    "6.1.4": { c: "couverte", pages: [P("plan-actions.html", "Plan d'actions"), P("programme-prevention.html", "Programme annuel de prévention")] },
    "6.2": { c: "couverte", pages: [P("objectifs.html", "Objectifs santé-sécurité")] },
    "7.1": { c: "hors", pages: [], manque: "relève du budget et des moyens de l'organisation" },
    "7.2": { c: "couverte", pages: [P("formation-habilitation.html", "Formation / Habilitation")] },
    "7.3": { c: "couverte", pages: [P("accueil-poste.html", "Accueil au poste"), P("base-documentaire.html", "Base documentaire")] },
    "7.4": { c: "partielle", pages: [P("dashboard.html", "Flash Info et veille"), P("registre-sst.html", "Registre SST"), P("dialogue-social.html", "Dialogue social")], manque: "un plan de communication, et la communication externe" },
    "7.5": { c: "partielle", pages: [P("base-documentaire.html", "Base documentaire")], manque: "le stockage des fichiers eux-mêmes et un circuit d'approbation" },
    "8.1.1": { c: "couverte", pages: [P("verifications-periodiques.html", "Vérifications périodiques"), P("inspection-audit.html", "Inspection / Audit"), P("produits-chimiques.html", "Produits chimiques")] },
    "8.1.2": { c: "partielle", pages: [P("document-unique.html", "Document unique"), P("plan-actions.html", "Plan d'actions"), P("epi-dotation.html", "EPI & Dotation")], manque: "les mesures déjà en place au Document unique ne sont pas rangées par niveau (seules les actions du Plan d'actions le sont) ; rien ne signale une protection individuelle prévue seule (question 32)" },
    "8.1.3": { c: "couverte", pages: [P("changements.html", "Gestion des changements")] },
    "8.1.4": { c: "partielle", pages: [P("entreprises-exterieures.html", "Entreprises extérieures")], manque: "les critères de santé et de sécurité à l'achat" },
    "8.2": { c: "couverte", pages: [P("urgences-exercices.html", "Situations d'urgence")] },
    "9.1.1": { c: "couverte", pages: [P("reporting.html", "Indicateurs & Reporting"), P("verifications-periodiques.html", "Vérifications périodiques"), P("sante-visites.html", "Santé & Visites")] },
    "9.1.2": { c: "couverte", pages: [P("conformite.html", "Conformité réglementaire")] },
    "9.2": { c: "couverte", pages: [P("audit-interne.html", "Audit interne")] },
    "9.3": { c: "couverte", pages: [P("revue-direction.html", "Revue de direction")] },
    "10.1": { c: "hors", pages: [], manque: "la démarche dans son ensemble" },
    "10.2": { c: "couverte", pages: [P("signalements.html", "Signalements"), P("registre-at-mp.html", "Registre AT/MP"), P("accident-analyse.html", "Analyse d'accident"), P("plan-actions.html", "Plan d'actions")] },
    "10.3": { c: "partielle", pages: [P("plan-actions.html", "Plan d'actions"), P("reporting.html", "Indicateurs & Reporting"), P("revue-direction.html", "Revue de direction")], manque: "la communication des résultats au personnel" },
  };
  const LIBELLES_COUVERTURE = { couverte: "Couverte", partielle: "En partie", hors: "Hors outil" };
  const LIBELLES = { pret: "Des enregistrements", areprendre: "Des points à reprendre", rien: "Aucun enregistrement", hors: "Hors outil", partiel: "Non calculé" };
  const TONS = { pret: "bon", areprendre: "attention", rien: "neutre", hors: "neutre", partiel: "neutre" };

  const K = {
    contexte: "vigie_hse_contexte", referentiels: "vigie_hse_referentials", revues: "vigie_hse_revues_direction", politiques: "vigie_hse_politiques",
    users: "vigie_hse_users", profils: "vigie_hse_profils", rsst: "vigie_hse_rsst", dsReunions: "vigie_hse_ds_reunions", dsQuestions: "vigie_hse_ds_questions",
    duerp: "vigie_hse_duerp_dataset", changements: "vigie_hse_changements", exigences: "vigie_hse_exigences", actions: "vigie_hse_actions",
    objectifs: "vigie_hse_objectifs", habilitations: "vigie_hse_habilitations", accueils: "vigie_hse_accueils", news: "vigie_hse_news", veille: "vigie_hse_veille",
    documents: "vigie_hse_documents", verifications: "vigie_hse_verifications", inspections: "vigie_hse_inspections", epi: "vigie_hse_epi_dotations",
    ee: "vigie_hse_interventions_ee", plans: "vigie_hse_plans_urgence", exercices: "vigie_hse_exercices_urgence", atmp: "vigie_hse_dataset",
    visites: "vigie_hse_visites", audits: "vigie_hse_audits_internes", signalements: "vigie_hse_signalements",
  };
  const pl = (n, un, plusieurs) => n + " " + (n > 1 ? plusieurs : un);
  const dateFr = d => /^\d{4}-\d{2}-\d{2}$/.test(d || "") ? d.split("-").reverse().join("/") : (d || "");

  // Toutes les clauses → [{ clause, nom, couverture, manque, pages, etat, libelle, ton, faits[], audit: { dernier, prochain } }]
  function evaluer(store, aujourdhui) {
    const lire = (cle) => { try { const v = JSON.parse(store.getItem(cle) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
    const complet = (cles) => cles.every(c => !store.complet || store.complet(c) !== false);
    const VA = racine.VigieAuditInterne, VP = racine.VigiePolitique, VC = racine.VigieChangements, VX = racine.VigieContexte,
      VK = racine.VigieConformite, VI = racine.VigieIndicateurs, VO = racine.VigieOrga, VM = racine.VigieMesures;
    let I = null;
    try { I = VI ? VI.calculer(store, "", "") : null; } catch (e) { I = null; }
    const actions = lire(K.actions);
    const CHECKS = {
      "4.1": { cles: [K.contexte], f: () => {
        const s = VX.synthese(lire(K.contexte), actions), aFaire = VX.revueAFaire(lire(K.contexte), aujourdhui);
        if (!s.enjeux) return ["rien", ["aucun enjeu enregistré"]];
        return [aFaire ? "areprendre" : "pret", [pl(s.enjeux, "enjeu", "enjeux") + ` (${s.internes} interne${s.internes > 1 ? "s" : ""}, ${s.externes} externe${s.externes > 1 ? "s" : ""})`,
          s.derniereRevue ? "dernière revue annuelle du registre le " + dateFr(s.derniereRevue) + (aFaire ? " : revue annuelle à faire" : "") : "registre jamais revu : revue annuelle à faire"]];
      } },
      "4.2": { cles: [K.contexte], f: () => {
        const s = VX.synthese(lire(K.contexte), actions), aFaire = VX.revueAFaire(lire(K.contexte), aujourdhui);
        if (!s.parties) return ["rien", ["aucune partie intéressée enregistrée"]];
        return [aFaire ? "areprendre" : "pret", [pl(s.parties, "partie intéressée", "parties intéressées") + ", dont " + pl(s.exigences, "obligation à suivre", "obligations à suivre") + " en conformité"].concat(aFaire ? ["revue annuelle du registre à faire"] : [])];
      } },
      "4.3": { cles: [K.referentiels], f: () => {
        const noms = VO ? VO.noms() : [], n = noms.reduce((t, x) => t + VO.services(x).length, 0);
        return [n ? "pret" : "rien", [pl(noms.length, "entrée de l'organisation", "entrées de l'organisation") + " (" + noms.join(", ") + "), " + pl(n, "service suivi", "services suivis")]];
      } },
      "5.1": { cles: [K.revues], f: () => {
        const v = lire(K.revues).filter(r => r && r.statut === "Validée").sort((a, b) => String(b.dateRevue || "").localeCompare(String(a.dateRevue || "")));
        return v.length ? ["pret", [pl(v.length, "revue de direction validée", "revues de direction validées") + ", la dernière le " + dateFr(v[0].dateRevue)]] : ["rien", ["aucune revue de direction validée"]];
      } },
      "5.2": { cles: [K.politiques], f: () => {
        const v = VP.enVigueur(lire(K.politiques)), e = VP.etat(v, aujourdhui);
        if (!v) return ["rien", ["aucune politique en vigueur"]];
        return [e.code === "a-revoir" ? "areprendre" : "pret", ["version " + v.version + ", signée le " + dateFr(v.dateSignature),
          v.prochaineRevue ? "prochaine revue le " + dateFr(v.prochaineRevue) + (e.code === "a-revoir" ? " : dépassée" : "") : "pas de date de prochaine revue",
          VP.engagementsCouverts(v).length + " / " + VP.ENGAGEMENTS.length + " engagements attendus couverts", pl(VP.communications(v).length, "action de communication", "actions de communication")]];
      } },
      "5.3": { cles: [K.users, K.profils], f: () => {
        const u = lire(K.users).length, p = lire(K.profils).length;
        return [u ? "pret" : "rien", [pl(u, "compte", "comptes") + (p ? ", " + pl(p, "profil de droits personnalisé", "profils de droits personnalisés") : "")]];
      } },
      "5.4": { cles: [K.rsst, K.dsReunions, K.dsQuestions], f: () => {
        const r = I ? I.rsstTotal : lire(K.rsst).length, nv = I ? I.rsstNouvelle : 0, re = lire(K.dsReunions).length, q = lire(K.dsQuestions).length;
        if (!r && !re && !q) return ["rien", ["aucune observation, réunion ni question des représentants"]];
        return [nv ? "areprendre" : "pret", [pl(r, "observation au Registre SST", "observations au Registre SST") + (nv ? ", dont " + nv + " pas encore traitée" + (nv > 1 ? "s" : "") : ""), pl(re, "réunion de l'instance", "réunions de l'instance"), pl(q, "question des représentants", "questions des représentants")]];
      } },
      "6.1.1": { cles: [K.contexte, K.actions], f: () => {
        const s = VX.synthese(lire(K.contexte), actions), n = s.risques + s.opportunites;
        if (!n) return ["rien", ["aucun risque ni opportunité pour la démarche"]];
        return [s.sansAction || s.sansNiveau ? "areprendre" : "pret", [pl(s.risques, "risque", "risques") + ", " + pl(s.opportunites, "opportunité", "opportunités") + (s.elevees ? ", dont " + s.elevees + " d'importance élevée" : "")]
          .concat(s.sansAction ? [pl(s.sansAction, "élément sans action", "éléments sans action")] : []).concat(s.sansNiveau ? [pl(s.sansNiveau, "élément à évaluer", "éléments à évaluer")] : [])];
      } },
      "6.1.2": { cles: [K.duerp, K.changements, K.actions], f: () => {
        const n = I ? I.duTotal : lire(K.duerp).length, prio = I ? I.duPrio.length : 0;
        const du = VC ? lire(K.changements).filter(c => c && c.id && VC.alertes(c, actions, aujourdhui).some(a => a.code === "duerp")).length : 0;
        if (!n) return ["rien", ["aucune évaluation au Document unique"]];
        return [du ? "areprendre" : "pret", [pl(n, "évaluation au Document unique", "évaluations au Document unique") + (prio ? ", dont " + prio + " prioritaire" + (prio > 1 ? "s" : "") : "")].concat(du ? [pl(du, "changement demande", "changements demandent") + " sa mise à jour"] : [])];
      } },
      "6.1.3": { cles: [K.exigences], f: () => {
        const s = VK.synthese(lire(K.exigences), aujourdhui);
        return s.total ? ["pret", [pl(s.total, "exigence applicable", "exigences applicables") + " au registre"]] : ["rien", ["aucune exigence au registre"]];
      } },
      "6.1.4": { cles: [K.actions], f: () => {
        if (!I || !I.paTotal) return ["rien", ["aucune action au Plan d'actions"]];
        return [I.paRetard ? "areprendre" : "pret", [pl(I.paTotal, "action", "actions") + ", " + I.paFait + " faite" + (I.paFait > 1 ? "s" : "")].concat(I.paRetard ? [pl(I.paRetard, "action en retard", "actions en retard")] : [])];
      } },
      "6.2": { cles: [K.objectifs], f: () => {
        const l = lire(K.objectifs).filter(o => o && o.id), ouverts = l.filter(o => o.statut !== "Clos").length;
        return l.length ? ["pret", [pl(ouverts, "objectif en vigueur", "objectifs en vigueur") + ", " + pl(l.length - ouverts, "clos", "clos")]] : ["rien", ["aucun objectif"]];
      } },
      "7.2": { cles: [K.habilitations], f: () => {
        if (!I || !I.fhTotal) return ["rien", ["aucune habilitation enregistrée"]];
        return [I.fhExpireeTous ? "areprendre" : "pret", [pl(I.fhTotal, "habilitation", "habilitations")].concat(I.fhExpireeTous ? [pl(I.fhExpireeTous, "habilitation expirée", "habilitations expirées")] : [])];
      } },
      "7.3": { cles: [K.accueils], f: () => {
        const l = lire(K.accueils).filter(a => a && a.id), fini = l.filter(a => Array.isArray(a.items) && a.items.length && a.items.every(i => i && i.fait)).length;   // comme accueil-poste.html (statutOf)
        return l.length ? ["pret", [pl(l.length, "accueil au poste", "accueils au poste") + ", " + fini + " terminé" + (fini > 1 ? "s" : "")]] : ["rien", ["aucun accueil au poste"]];
      } },
      "7.4": { cles: [K.news, K.veille], f: () => {
        const n = lire(K.news).length, v = lire(K.veille).length;
        return n || v ? ["pret", [pl(n, "Flash Info", "Flash Info"), pl(v, "actualité de veille", "actualités de veille")]] : ["rien", ["ni Flash Info ni veille"]];
      } },
      "7.5": { cles: [K.documents], f: () => {
        const n = lire(K.documents).length;
        return n ? ["pret", [pl(n, "document au registre", "documents au registre")]] : ["rien", ["aucun document au registre de la Base documentaire"]];
      } },
      "8.1.1": { cles: [K.verifications, K.inspections], f: () => {
        if (!I || (!I.vpTotal && !I.iaTotal)) return ["rien", ["ni vérification périodique ni inspection"]];
        return [I.vpLateTous ? "areprendre" : "pret", [pl(I.vpTotal, "vérification périodique", "vérifications périodiques") + (I.vpLateTous ? ", dont " + I.vpLateTous + " en retard" : ""), pl(I.iaTotal, "inspection", "inspections") + (I.iaNonConforme ? ", dont " + I.iaNonConforme + " non conforme" + (I.iaNonConforme > 1 ? "s" : "") : "")]];
      } },
      "8.1.2": { cles: [K.duerp, K.epi, K.actions], f: () => {
        if (!I || (!I.duTotal && !I.epiTotal)) return ["rien", ["ni évaluation ni dotation d'EPI"]];
        // le niveau des actions : un fait, sans jugement (question 32)
        const b = VM.bilan(actions), niv = VM.NIVEAUX.filter(n => b.parNiveau[n.id]).map(n => b.parNiveau[n.id] + " " + n.court.toLowerCase());
        return [I.epiLateTous ? "areprendre" : "pret", [pl(I.duTotal, "évaluation et ses mesures au Document unique", "évaluations et leurs mesures au Document unique"), pl(I.epiTotal, "dotation d'EPI", "dotations d'EPI") + (I.epiLateTous ? ", dont " + I.epiLateTous + " à renouveler en retard" : ""),
          !b.total ? "aucune action au Plan d'actions" : b.rangees ? pl(b.rangees, "action rangée", "actions rangées") + " par niveau de mesure (" + niv.join(", ") + ")" + (b.nonRangees ? ", " + pl(b.nonRangees, "non rangée", "non rangées") : "") : "aucune action rangée par niveau de mesure (" + pl(b.total, "action", "actions") + " au Plan d'actions)"]];
      } },
      "8.1.3": { cles: [K.changements, K.actions], f: () => {
        const s = VC.synthese(lire(K.changements), actions, aujourdhui);
        if (!s.changements) return ["rien", ["aucun changement enregistré"]];
        const pts = [[s.mesuresEnAttente, "mesure pas faite", "mesures pas faites"], [s.duerpAMettreAJour, "changement demande la mise à jour du Document unique", "changements demandent la mise à jour du Document unique"], [s.revuesEnRetard, "revue en retard", "revues en retard"],
          [s.sansValidation, "mise en œuvre sans validation", "mises en œuvre sans validation"], [s.imprevusSansAction, "effet imprévu sans action", "effets imprévus sans action"]].filter(z => z[0]).map(z => pl(z[0], z[1], z[2]));
        return [pts.length ? "areprendre" : "pret", [pl(s.changements, "changement", "changements") + " (" + s.enCours + " à mettre en œuvre, " + s.aRevoir + " à revoir, " + s.clos + " revu" + (s.clos > 1 ? "s" : "") + ")"].concat(pts)];
      } },
      "8.1.4": { cles: [K.ee], f: () => {
        const n = lire(K.ee).length;
        return n ? ["pret", [pl(n, "intervention d'entreprise extérieure", "interventions d'entreprises extérieures")]] : ["rien", ["aucune intervention d'entreprise extérieure"]];
      } },
      "8.2": { cles: [K.plans, K.exercices], f: () => {
        const p = lire(K.plans).length, e = lire(K.exercices).length;
        return p || e ? ["pret", [pl(p, "plan d'urgence par site", "plans d'urgence par site"), pl(e, "exercice", "exercices")]] : ["rien", ["ni plan d'urgence ni exercice"]];
      } },
      "9.1.1": { cles: [K.atmp, K.verifications, K.visites], f: () => {
        if (!I || (!I.atTotal && !I.vpTotal && !I.svTotal)) return ["rien", ["ni accident au registre, ni vérification périodique, ni visite médicale"]];
        return [I.svLateTous || I.vpLateTous ? "areprendre" : "pret", [pl(I.atTotal, "accident ou maladie au registre", "accidents ou maladies au registre"), pl(I.vpTotal, "vérification périodique", "vérifications périodiques")]
          .concat(I.vpLateTous ? [pl(I.vpLateTous, "vérification en retard", "vérifications en retard")] : []).concat(I.svLateTous ? [pl(I.svLateTous, "visite médicale en retard", "visites médicales en retard")] : [])];
      } },
      "9.1.2": { cles: [K.exigences], f: () => {
        const s = VK.synthese(lire(K.exigences), aujourdhui);
        if (!s.total) return ["rien", ["aucune exigence à évaluer"]];
        const n = s.aEvaluer + s.aReevaluer;
        return [n ? "areprendre" : "pret", [s.taux === null ? "aucune exigence évaluée" : "taux de conformité " + s.taux + " %", pl(s.nonConformes + s.partiels, "écart", "écarts")]
          .concat(s.aEvaluer ? [pl(s.aEvaluer, "exigence jamais évaluée", "exigences jamais évaluées")] : []).concat(s.aReevaluer ? [pl(s.aReevaluer, "exigence à réévaluer", "exigences à réévaluer")] : [])];
      } },
      "9.2": { cles: [K.audits, K.actions], f: () => {
        const l = lire(K.audits), s = VA.synthese(l, actions, aujourdhui), jamais = VA.couverture(l, actions, aujourdhui).filter(r => !r.audits).length;
        if (!s.audits) return ["rien", ["aucun audit interne"]];
        return [s.depasses || s.ncSansAction ? "areprendre" : "pret", [pl(s.realises, "audit réalisé", "audits réalisés") + ", " + pl(s.planifies, "prévu", "prévus"), pl(jamais, "clause jamais auditée", "clauses jamais auditées")]
          .concat(s.depasses ? [pl(s.depasses, "audit à la date dépassée", "audits à la date dépassée")] : []).concat(s.ncSansAction ? [pl(s.ncSansAction, "non-conformité sans action", "non-conformités sans action")] : [])];
      } },
      "9.3": { cles: [K.revues], f: () => {
        const l = lire(K.revues).filter(r => r && r.id), v = l.filter(r => r.statut === "Validée").sort((a, b) => String(b.dateRevue || "").localeCompare(String(a.dateRevue || "")));
        if (!l.length) return ["rien", ["aucune revue de direction"]];
        return [v.length ? "pret" : "rien", [v.length ? pl(v.length, "revue validée", "revues validées") + ", la dernière le " + dateFr(v[0].dateRevue) : "aucune revue validée", pl(l.length - v.length, "revue en préparation", "revues en préparation")]];
      } },
      "10.2": { cles: [K.signalements, K.atmp, K.actions], f: () => {
        if (!I || (!I.sigTotal && !I.atTotal && !I.paTotal)) return ["rien", ["ni signalement, ni accident, ni action"]];
        return [I.paAVerifier ? "areprendre" : "pret", [pl(I.sigTotal, "signalement", "signalements"), pl(I.atTotal, "accident ou maladie", "accidents ou maladies"), pl(I.paEfficaces, "action jugée efficace", "actions jugées efficaces")]
          .concat(I.paAVerifier ? [pl(I.paAVerifier, "action faite dont l'efficacité est à vérifier", "actions faites dont l'efficacité est à vérifier")] : [])];
      } },
      "10.3": { cles: [K.actions, K.objectifs], f: () => {
        if (!I || !I.paFait) return ["rien", ["aucune action faite"]];
        return ["pret", [pl(I.paFait, "action faite", "actions faites") + ", " + pl(I.paEfficaces, "jugée efficace", "jugées efficaces"), pl(lire(K.objectifs).filter(o => o && o.id).length, "objectif", "objectifs")]];
      } },
    };
    const MODULES = { "4.1": VX, "4.2": VX, "4.3": VO, "5.2": VP, "6.1.1": VX, "6.1.2": VC, "6.1.3": VK, "8.1.2": VM, "8.1.3": VC, "9.1.2": VK, "9.2": VA };
    const audits = VA ? lire(K.audits) : [], cv = VA && complet([K.audits]) ? VA.couverture(audits, actions, aujourdhui) : [];
    const clauses = VA ? VA.CLAUSES : Object.keys(COUVERTURE).map(c => [c, c]);
    return clauses.map(([clause, nom]) => {
      const cov = COUVERTURE[clause] || { c: "hors", pages: [] }, ch = CHECKS[clause];
      let etat = "hors", faits = [];
      if (cov.c !== "hors" && ch) {
        if (!complet(ch.cles) || (clause in MODULES && !MODULES[clause]) || (!I && ["5.4", "6.1.4", "7.2", "8.1.1", "8.1.2", "9.1.1", "10.2", "10.3"].includes(clause))) {
          etat = "partiel"; faits = ["ce compte ne reçoit pas toutes les données nécessaires"];
        } else {
          try { const r = ch.f(); etat = r[0]; faits = r[1]; } catch (e) { etat = "partiel"; faits = ["calcul impossible"]; }
        }
      }
      const a = cv.find(r => r.clause === clause);
      return { clause: clause, nom: nom, couverture: cov.c, couvertureLibelle: LIBELLES_COUVERTURE[cov.c], manque: cov.manque || "", pages: cov.pages,
        etat: etat, libelle: LIBELLES[etat], ton: TONS[etat], faits: faits, audit: a ? { dernier: a.dernier || "", prochain: a.prochain || "", audits: a.audits } : null };
    });
  }

  function synthese(lignes) {
    const s = { pret: 0, areprendre: 0, rien: 0, hors: 0, partiel: 0, couvertes: 0, partielles: 0, jamaisAuditees: 0 };
    (lignes || []).forEach(l => { s[l.etat]++; if (l.couverture === "couverte") s.couvertes++; if (l.couverture === "partielle") s.partielles++; if (l.audit && !l.audit.audits) s.jamaisAuditees++; });
    return s;
  }

  racine.VigiePreparation = { COUVERTURE: COUVERTURE, LIBELLES: LIBELLES, TONS: TONS, LIBELLES_COUVERTURE: LIBELLES_COUVERTURE, CLES: K, evaluer: evaluer, synthese: synthese };
})(typeof window !== "undefined" ? window : this);
