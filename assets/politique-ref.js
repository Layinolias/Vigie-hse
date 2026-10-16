/* ============================================================================
   VIGIE HSE — Politique de santé et de sécurité (ISO 45001 § 5.2, 2026-10-15)
   ----------------------------------------------------------------------------
   La politique écrite par l'organisation, ses versions, ses revues, sa communication et la prise de connaissance de
   chaque compte. Partagé par la page Politique santé-sécurité, le tableau de bord (rappel à lire) et la Revue de
   direction (§ 9.3). Aucune écriture. À charger après dates-locales.js.

   Une version (clé vigie_hse_politiques) :
     { id, version (numéro donné à la mise en vigueur), statut (« Brouillon », « En vigueur », « Remplacée »), texte,
       engagements: [clés de ENGAGEMENTS cochées par le rédacteur], signataire, fonction, dateSignature,
       prochaineRevue (AAAA-MM-JJ, facultative), demanderLecture (rappel au tableau de bord de chaque compte),
       publieLe, publiePar, remplaceeLe, revues: [{ id, date, conclusion, commentaire, par }],
       communications: [{ id, date, moyen, destinataires, par }], auteur, dateCreation, modifiePar, dateMaj }
   Une prise de connaissance (clé vigie_hse_politique_lectures) : { id: "lu-<version>-<compte>", versionId, auteur, le }
   — chacun ajoute la sienne ; le serveur ne transmet à un compte que les siennes, sauf à qui gère la politique.

   Rythme (question 28, réponse du 2026-10-16) : la prochaine revue est proposée un an après la signature, ou après la
   dernière revue, et reste modifiable. Engagement « risques psychosociaux » ajouté aux six de la norme. La remise de la
   politique aux agents se trace à l'Accueil au poste (point du parcours par défaut).
   ========================================================================== */
(function (racine) {
  "use strict";

  const CLE = "vigie_hse_politiques";
  const CLE_LECTURES = "vigie_hse_politique_lectures";
  // Ce qu'ISO 45001 attend d'une politique (§ 5.2), formulé par l'application : le rédacteur coche ce que son texte couvre.
  const ENGAGEMENTS = [
    ["conditions", "Offrir des conditions de travail sûres et saines, pour prévenir les accidents et les atteintes à la santé"],
    ["objectifs", "Donner un cadre pour fixer les objectifs de santé et de sécurité"],
    ["exigences", "Respecter les exigences légales et les autres exigences"],
    ["dangers", "Éliminer les dangers et réduire les risques"],
    ["amelioration", "Améliorer en continu le système de management de la santé et de la sécurité"],
    ["participation", "Consulter les travailleurs et leurs représentants, et les faire participer"],
    ["rps", "Prévenir les risques psychosociaux"],
  ];
  const CONCLUSIONS = ["Maintenue", "À modifier"];
  const dateOk = d => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
  const valides = liste => (Array.isArray(liste) ? liste : []).filter(v => v && typeof v === "object" && v.id);

  // la version en vigueur (la plus récente si, par accident, il y en avait deux), le brouillon, l'historique
  function enVigueur(liste) {
    return valides(liste).filter(v => v.statut === "En vigueur")
      .sort((a, b) => (Number(b.version) || 0) - (Number(a.version) || 0) || String(b.publieLe || "").localeCompare(String(a.publieLe || "")))[0] || null;
  }
  const brouillon = liste => valides(liste).find(v => v.statut === "Brouillon") || null;
  const historique = liste => valides(liste).filter(v => v.statut === "En vigueur" || v.statut === "Remplacée")
    .sort((a, b) => (Number(b.version) || 0) - (Number(a.version) || 0));
  const prochainNumero = liste => valides(liste).reduce((m, v) => Math.max(m, Number(v.version) || 0), 0) + 1;

  const engagementsCouverts = v => ENGAGEMENTS.map(e => e[0]).filter(k => v && Array.isArray(v.engagements) && v.engagements.includes(k));
  const engagementsManquants = v => ENGAGEMENTS.filter(e => !engagementsCouverts(v).includes(e[0]));

  // les revues valides, de la plus ancienne à la plus récente
  function revues(v) {
    return (v && Array.isArray(v.revues) ? v.revues : []).map((r, i) => ({ r, i }))
      .filter(x => x.r && dateOk(x.r.date)).sort((a, b) => a.r.date.localeCompare(b.r.date) || a.i - b.i).map(x => x.r);
  }
  function derniereRevue(v) { const l = revues(v); return l.length ? l[l.length - 1] : null; }
  const communications = v => (v && Array.isArray(v.communications) ? v.communications : []).filter(c => c && dateOk(c.date))
    .sort((a, b) => b.date.localeCompare(a.date));

  // L'état de la politique à une date → { code, libelle, ton }
  function etat(v, aujourdhui) {
    if (!v) return { code: "aucune", libelle: "Aucune politique en vigueur", ton: "neutre" };
    if (dateOk(v.prochaineRevue) && aujourdhui && aujourdhui > v.prochaineRevue) return { code: "a-revoir", libelle: "À revoir", ton: "attention" };
    return { code: "a-jour", libelle: "En vigueur", ton: "bon" };
  }

  // ---------- Prises de connaissance ----------
  const idLecture = (versionId, compte) => "lu-" + versionId + "-" + compte;
  // celles d'une version, une par compte (la première), de la plus récente à la plus ancienne
  function lectures(liste, versionId) {
    const vus = {}, out = [];
    (Array.isArray(liste) ? liste : []).filter(l => l && typeof l === "object" && l.versionId === versionId && l.auteur)
      .sort((a, b) => String(a.le || "").localeCompare(String(b.le || "")))
      .forEach(l => { if (!vus[l.auteur]) { vus[l.auteur] = true; out.push(l); } });
    return out.reverse();
  }
  const aLu = (liste, versionId, compte) => !!compte && lectures(liste, versionId).some(l => l.auteur === compte);
  // la version que ce compte est invité à lire (rappel demandé, pas encore lue), sinon null
  function aLire(politiques, liste, compte) {
    const v = enVigueur(politiques);
    return v && v.demanderLecture && compte && !aLu(liste, v.id, compte) ? v : null;
  }

  // Pour la revue de direction : la politique en vigueur à la date du calcul. « lecturesCompletes » : faux si ce
  // compte ne reçoit pas toutes les prises de connaissance (leur nombre n'est alors pas calculé).
  function pourRevue(politiques, liste, aujourdhui, lecturesCompletes) {
    const v = enVigueur(politiques);
    if (!v) return { aucune: true };
    const d = derniereRevue(v), e = etat(v, aujourdhui);
    return { version: Number(v.version) || null, signataire: v.signataire || "", fonction: v.fonction || "", dateSignature: v.dateSignature || "",
      publieLe: v.publieLe || "", prochaineRevue: dateOk(v.prochaineRevue) ? v.prochaineRevue : "", aRevoir: e.code === "a-revoir",
      derniereRevue: d ? { date: d.date, conclusion: d.conclusion || "" } : null, communications: communications(v).length,
      demandee: !!v.demanderLecture, lectures: lecturesCompletes ? lectures(liste, v.id).length : null,
      engagements: engagementsCouverts(v).length, engagementsTotal: ENGAGEMENTS.length };
  }

  // un an après une date « AAAA-MM-JJ », à l'heure locale (le rythme proposé par défaut)
  function unAnApres(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "") || !racine.VigieDates) return "";
    const d = racine.VigieDates.lire(iso); d.setFullYear(d.getFullYear() + 1);
    return racine.VigieDates.iso(d);
  }

  racine.VigiePolitique = {
    unAnApres: unAnApres,
    CLE: CLE, CLE_LECTURES: CLE_LECTURES, ENGAGEMENTS: ENGAGEMENTS, CONCLUSIONS: CONCLUSIONS,
    enVigueur: enVigueur, brouillon: brouillon, historique: historique, prochainNumero: prochainNumero,
    engagementsCouverts: engagementsCouverts, engagementsManquants: engagementsManquants,
    revues: revues, derniereRevue: derniereRevue, communications: communications, etat: etat,
    idLecture: idLecture, lectures: lectures, aLu: aLu, aLire: aLire, pourRevue: pourRevue,
  };
})(typeof window !== "undefined" ? window : this);
