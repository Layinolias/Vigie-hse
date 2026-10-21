/* ============================================================================
   VIGIE HSE — Registre des documents officiels (ISO 45001 § 7.5, circuit du 2026-10-21)
   ----------------------------------------------------------------------------
   Le registre de la Base documentaire référence les documents (le fichier reste où l'organisation le range : le lien
   y mène). Depuis le 2026-10-21, un document suit un circuit — brouillon, à approuver, en vigueur, obsolète —, garde
   qui l'a approuvé et quand, son origine (interne ou externe), sa date de revue, sa durée de conservation, et ses
   versions : une nouvelle version, mise en vigueur, rend la précédente obsolète. Partagé par la Base documentaire et
   la Préparation ISO 45001. Aucune écriture.

   Un document (clé vigie_hse_documents) :
     { id, titre, categorie (type), reference, version, dateDocument, statut (STATUTS), masque, lien, description,
       origine ("Interne" | "Externe" ; absent : non précisée, documents d'avant le circuit), approuvePar, dateApprobation,
       soumisPar, dateSoumission, revue (date de revue prévue), conservation (texte libre), remplace (id de la version
       précédente), remplacePar, dateObsolete, auteur, dateCreation }

   Des faits, sans jugement : aucune périodicité de revue ni durée de conservation n'est imposée, l'approbation se note
   (qui, quand) sans compte désigné — question 38 au préventeur.
============================================================================ */
(function (racine) {
  "use strict";

  const CLE = "vigie_hse_documents";
  const STATUTS = ["Brouillon", "À approuver", "En vigueur", "Obsolète"];
  // un document pas encore approuvé : caché aux lecteurs, comme un article en brouillon
  const enPreparation = (d) => !!d && (d.statut === "Brouillon" || d.statut === "À approuver");
  const date = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || "") ? d : "";
  const liste = (l) => (Array.isArray(l) ? l : []).filter(d => d && typeof d === "object" && d.id);
  const approuve = (d) => !!(d && String(d.approuvePar || "").trim() && date(d.dateApprobation));
  // la date de revue prévue est passée (document en vigueur seulement)
  const aRevoir = (d, jour) => !!d && d.statut === "En vigueur" && !!date(d.revue) && d.revue < jour;

  // Les versions d'un document, de la plus ancienne à la plus récente (liens remplace / remplacePar), sans boucle
  function versions(l, id) {
    const v = liste(l), par = {};
    v.forEach(d => { par[d.id] = d; });
    let d = par[id], vus = new Set();
    if (!d) return [];
    while (d.remplace && par[d.remplace] && !vus.has(d.remplace)) { vus.add(d.id); d = par[d.remplace]; }
    const chaine = [], deja = new Set();
    while (d && !deja.has(d.id)) {
      chaine.push(d); deja.add(d.id);
      const cur = d;
      d = cur.remplacePar && par[cur.remplacePar] ? par[cur.remplacePar] : v.find(x => x.remplace === cur.id && !deja.has(x.id));
    }
    return chaine;
  }

  // Le compte du registre au jour donné
  function synthese(l, jour) {
    const v = liste(l), ev = v.filter(d => d.statut === "En vigueur");
    return {
      total: v.length,
      enVigueur: ev.length,
      approuves: ev.filter(approuve).length,
      aApprouver: v.filter(d => d.statut === "À approuver").length,
      brouillons: v.filter(d => d.statut === "Brouillon").length,
      obsoletes: v.filter(d => d.statut === "Obsolète").length,
      aRevoir: ev.filter(d => aRevoir(d, jour)).length,
      externes: v.filter(d => d.origine === "Externe" && d.statut !== "Obsolète").length,
    };
  }

  racine.VigieDocuments = {
    CLE: CLE, STATUTS: STATUTS, enPreparation: enPreparation, approuve: approuve, aRevoir: aRevoir,
    versions: versions, synthese: synthese,
  };
})(typeof window !== "undefined" ? window : this);
