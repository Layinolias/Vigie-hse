/* ============================================================================
   VIGIE HSE — Dédoublonnage d'un roster d'agents dérivé du Registre AT/MP
   ----------------------------------------------------------------------------
   Composant autonome et réutilisable : aucune dépendance, aucune étape de build,
   aucun framework. Factorise le geste identique à l'origine dans 3 modules
   (sante-visites.html, formation-habilitation.html, epi-dotation.html) qui
   dérivent chacun leur propre roster de départ à partir d'une même liste
   d'événements AT/MP, en ne gardant qu'un agent (nom+prénom+service) par clé.
   Chaque module garde son propre choix de ce qu'il seede pour un agent donné
   (combien d'enregistrements, quels champs) — seuls le hash déterministe et
   le dédoublonnage sont partagés ici.

       <script src="assets/roster.js"></script>

   puis, dans le script de la page :

       const seen = VigieRoster.dedupeByAgent(SEED_ATMP);
       seen.forEach((r, key) => {
         const h = VigieRoster.hashStr(key);
         // ... logique propre à la page (comme avant)
       });

   `hashStr(s)` est le même hash simple (base 31) utilisé partout dans ce
   projet pour dériver des identifiants stables à partir d'une clé texte —
   ne pas en écrire une seconde copie dans une page qui charge ce fichier.
   ========================================================================== */
(function () {
  "use strict";
  if (window.VigieRoster) return;

  function hashStr(s){
    var h = 0;
    for (var i = 0; i < s.length; i++){ h = (h * 31 + s.charCodeAt(i)) | 0; }
    return Math.abs(h);
  }

  /** Déduplique une liste d'événements (avec au moins nom/prenom/service) en un
   * Map agent -> premier enregistrement rencontré, clé "nom|prenom|service". */
  function dedupeByAgent(list){
    var seen = new Map();
    (list || []).forEach(function (r) {
      if (!r.nom || !r.prenom || !r.service) return;
      var key = r.nom + "|" + r.prenom + "|" + r.service;
      if (!seen.has(key)) seen.set(key, r);
    });
    return seen;
  }

  window.VigieRoster = { hashStr: hashStr, dedupeByAgent: dedupeByAgent };
})();
