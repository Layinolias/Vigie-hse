// Point de passage unique vers le stockage des données (2026-09-23).
// Toutes les pages lisent et écrivent par VigieStore au lieu de localStorage : aujourd'hui les données
// restent dans le navigateur, exactement comme avant (mêmes clés, mêmes chaînes JSON) ; le jour où
// l'application aura un serveur, c'est ce seul fichier qui changera, pas les 24 pages.
// Voir Documentation/PLAN-MISE-EN-PRODUCTION.md.
//
// localStorage n'est touché qu'au moment de l'appel ; s'il est refusé par le navigateur, la page
// continue sur une mémoire temporaire et un bandeau prévient que rien ne sera conservé (plus bas).
// sessionStorage (session de connexion, bandeau mobile) n'y passe pas : il relève de la future
// authentification, pas des données.
(function(){
  if (window.VigieStore) return;

  // Registre des clés. nature : « donnees » (enregistrements de l'organisation — à synchroniser avec
  // le serveur), « parametres » (référentiels, modèles, réglages de l'organisation — idem),
  // « journal » (traces, en ajout seul), « preference » (confort d'affichage de l'appareil — reste
  // local). sensible : données susceptibles de relever de l'article 9 du RGPD (santé) — liste à
  // valider avec le délégué à la protection des données, elle conditionne le choix de l'hébergeur.
  var CLES = {
    vigie_hse_dataset:            { nature:"donnees",    sensible:true,  module:"Registre AT/MP" },
    vigie_hse_atmp_dossiers:      { nature:"donnees",    sensible:true,  module:"Dossiers AT/MP & CITIS" },
    vigie_hse_atmp_arretes:       { nature:"donnees",    sensible:true,  module:"Dossiers AT/MP & CITIS" },
    vigie_hse_analyses_accident:  { nature:"donnees",    sensible:true,  module:"Analyse d'accident" },
    vigie_hse_visites:            { nature:"donnees",    sensible:true,  module:"Santé & Visites" },
    vigie_hse_rdv_medicaux:       { nature:"donnees",    sensible:true,  module:"Santé & Visites" },
    vigie_hse_duerp_dataset:      { nature:"donnees",    sensible:false, module:"Document Unique" },
    vigie_hse_actions:            { nature:"donnees",    sensible:false, module:"Plan d'actions" },
    vigie_hse_rsst:               { nature:"donnees",    sensible:false, module:"Registre SST" },
    vigie_hse_verifications:      { nature:"donnees",    sensible:false, module:"Vérifications périodiques" },
    vigie_hse_inspections:        { nature:"donnees",    sensible:false, module:"Inspection / Audit" },
    vigie_hse_produits_chimiques: { nature:"donnees",    sensible:false, module:"Produits chimiques" },
    vigie_hse_habilitations:      { nature:"donnees",    sensible:false, module:"Formation / Habilitation" },
    vigie_hse_epi_stock:          { nature:"donnees",    sensible:false, module:"EPI & Dotation" },
    vigie_hse_epi_dotations:      { nature:"donnees",    sensible:false, module:"EPI & Dotation" },
    vigie_hse_epi_lavages:        { nature:"donnees",    sensible:false, module:"EPI & Dotation" },
    vigie_hse_exercices_urgence:  { nature:"donnees",    sensible:false, module:"Situations d'urgence" },
    vigie_hse_interventions_ee:   { nature:"donnees",    sensible:false, module:"Entreprises extérieures" },
    vigie_hse_accueils:           { nature:"donnees",    sensible:false, module:"Accueil au poste" },
    vigie_hse_agents:             { nature:"donnees",    sensible:false, module:"Gestion RH" },
    vigie_hse_heures_travaillees: { nature:"donnees",    sensible:false, module:"Gestion RH" },
    vigie_hse_wiki:               { nature:"donnees",    sensible:false, module:"Base documentaire" },
    vigie_hse_documents:          { nature:"donnees",    sensible:false, module:"Base documentaire" },
    vigie_hse_news:               { nature:"donnees",    sensible:false, module:"Administration (Flash Info)" },
    vigie_hse_veille:             { nature:"donnees",    sensible:false, module:"Administration (veille)" },
    vigie_hse_users:              { nature:"parametres", sensible:false, module:"Administration (comptes) — relèvera de l'authentification" },
    vigie_hse_referentials:       { nature:"parametres", sensible:false, module:"Administration (référentiels)" },
    vigie_hse_doc_types:          { nature:"parametres", sensible:false, module:"Base documentaire" },
    vigie_hse_epi_catalogue:      { nature:"parametres", sensible:false, module:"EPI & Dotation" },
    vigie_hse_inspection_trames:  { nature:"parametres", sensible:false, module:"Inspection / Audit" },
    vigie_hse_modeles_accueil:    { nature:"parametres", sensible:false, module:"Accueil au poste" },
    vigie_hse_accueil_delai:      { nature:"parametres", sensible:false, module:"Accueil au poste" },
    vigie_hse_modeles_convocation:{ nature:"parametres", sensible:false, module:"Santé & Visites" },
    vigie_hse_audit_log:          { nature:"journal",    sensible:false, module:"Journal d'audit" },
    vigie_hse_duerp_log:          { nature:"journal",    sensible:false, module:"Document Unique" },
    vigie_hse_rh_log:             { nature:"journal",    sensible:false, module:"Registre AT/MP" },
    vigie_hse_sidebar_locked:     { nature:"preference", sensible:false, module:"Menu latéral" },
    vigie_hse_weather_location:   { nature:"preference", sensible:false, module:"Météo du tableau de bord" },
  };

  // Navigateur qui refuse tout stockage (cookies bloqués, certaines navigations privées) : avant,
  // la plupart des pages s'arrêtaient sur une erreur. On bascule sur une mémoire de page — l'écran
  // fonctionne, rien n'est conservé à la fermeture — et un bandeau le dit clairement : perdre des
  // saisies sans le savoir serait pire que l'erreur.
  var memoire = null;
  function fond(){
    if (memoire) return memoire;
    try { var ls = window.localStorage; ls.getItem("vigie_hse_session"); return ls; }
    catch(e){
      var m = {};
      memoire = {
        getItem: function(k){ return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
        setItem: function(k, v){ m[k] = String(v); },
        removeItem: function(k){ delete m[k]; },
        clear: function(){ m = {}; },
      };
      avertir();
      return memoire;
    }
  }
  function avertir(){
    var poser = function(){
      if (document.getElementById("vigie-stockage-bloque")) return;
      var b = document.createElement("div");
      b.id = "vigie-stockage-bloque";
      b.setAttribute("role", "alert");
      b.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:9999;padding:10px 16px;background:#8a3b12;color:#fff;font:600 13px/1.4 system-ui,sans-serif;text-align:center;";
      b.textContent = "Ce navigateur bloque l'enregistrement des données : vous pouvez consulter et saisir, mais rien ne sera conservé à la fermeture de la page. Autorisez les cookies et le stockage de ce site pour travailler normalement.";
      document.body.appendChild(b);
    };
    if (document.body) poser(); else document.addEventListener("DOMContentLoaded", poser);
  }

  window.VigieStore = {
    CLES: CLES,
    getItem: function(cle){ return fond().getItem(cle); },
    setItem: function(cle, valeur){ fond().setItem(cle, valeur); },
    removeItem: function(cle){ fond().removeItem(cle); },
    // « Réinitialiser les données de démonstration » : tout ce que l'application a stocké
    clear: function(){ fond().clear(); },
    // false quand le navigateur refuse le stockage (données gardées le temps de la page seulement)
    persistant: function(){ return fond() !== memoire; },
  };
  // vérifié dès le chargement : la vitrine et l'écran de connexion préviennent avant toute saisie
  fond();
})();
