/* ============================================================================
   VIGIE HSE — Menu latéral (toutes les pages à menu) : contenu et comportement
   ----------------------------------------------------------------------------
   Composant autonome : dépend de VigieStore (assets/stockage.js) et de VigieIcones
   (assets/icones.js), chargés avant ; aucune étape de build, aucun framework.

       <script src="assets/icones.js"></script>
       <script src="assets/menu-lateral.js"></script>

   puis, dans le script de la page, une fois la session lue :

       VigieMenu.init(session);

   Contenu : la liste MENU ci-dessous est la seule — un nouveau module s'y ajoute
   une fois, avec sa règle de visibilité dans voir(), et apparaît sur toutes les
   pages. Le lien de la page ouverte est marqué « actif » et toujours affiché ;
   une section dont aucun lien n'est permis n'est pas affichée. Ses icônes, comme
   toutes celles de la page, viennent d'assets/icones.js.
   Comportement :
   - téléphone : le bouton ☰ (#menuToggle) ouvre le menu, le voile (#scrim) le ferme ;
   - bureau (plus de 980 px) : le menu se replie quand la souris le quitte, que l'on
     survole ou fait défiler la page, et se déplie au survol ou au clavier ;
   - l'épingle (#sidebarPin) le garde ouvert, choix retenu sur ce poste
     (clé « vigie_hse_sidebar_locked », préférence : jamais envoyée au serveur).
   Jusqu'au 2026-09-30, menu et comportement étaient recopiés dans chaque page :
   trois pages avaient perdu des liens, une montrait des liens interdits à son
   compte, une avait perdu l'épingle.
   Ce que le menu cache n'est pas une protection : chaque page garde sa propre
   garde d'accès, et le serveur ses droits (serveur/droits.js, lecture.js).
   ========================================================================== */
(function () {
  "use strict";
  if (window.VigieMenu) return;

  // [page, icône, libellé (HTML fixe, jamais de donnée)]
  var MENU = [
    { liens: [["dashboard.html", "i-grid", "Accueil"]] },
    { titre: "Santé au travail", liens: [
      ["registre-at-mp.html", "i-activity", "Registre AT/MP"],
      ["registre-sst.html", "i-message-square", "Registre SST"]] },
    { titre: "Sécurité &amp; Risques", liens: [
      ["document-unique.html", "i-alert-triangle", "Document Unique"],
      ["produits-chimiques.html", "i-flask", "Produits chimiques"]] },
    { titre: "Suivi", liens: [
      ["plan-actions.html", "i-clipboard", "Plan d'Actions"],
      ["sante-visites.html", "i-shield-check", "Santé &amp; Visites"],
      ["verifications-periodiques.html", "i-check-circle", "Vérifications Périodiques"],
      ["inspection-audit.html", "i-search", "Inspection / Audit"],
      ["formation-habilitation.html", "i-award", "Formation / Habilitation"],
      ["epi-dotation.html", "i-package", "EPI &amp; Dotation"],
      ["penibilite.html", "i-gauge", "Pénibilité"]] },
    { titre: "Espace RH", liens: [
      ["saisie-rh.html", "i-plus", "Déclarer un AT/MP"],
      ["saisie-duerp.html", "i-plus", "Évaluer un risque"]] },
    { titre: "Administratif", liens: [
      ["dossiers-atmp-citis.html", "i-shield", "Dossiers AT/MP &amp; CITIS"],
      ["accident-analyse.html", "i-git-branch", "Analyse d'accident"],
      ["urgences-exercices.html", "i-life-buoy", "Situations d'urgence"],
      ["gestion-rh.html", "i-users", "Gestion RH"],
      ["entreprises-exterieures.html", "i-briefcase", "Entreprises extérieures"],
      ["accueil-poste.html", "i-user-plus", "Accueil au poste"]] },
    { titre: "Ressources", liens: [
      ["base-documentaire.html", "i-book", "Base documentaire"],
      ["dialogue-social.html", "i-messages", "Dialogue social"]] },
    { titre: "Pilotage", liens: [
      ["reporting.html", "i-bar-chart", "Indicateurs &amp; Reporting"],
      ["administration.html", "i-settings", "Administration"]] }
  ];

  // Qui voit quel lien (un lien absent d'ici est pour tous) — mêmes règles que les gardes d'accès des pages
  // (Documentation/ETAT-DU-PROJET.md §7) : RH et administrateurs voient tout le métier ; les autres, les
  // modules dont ils ont la permission (lecture ou écriture).
  function voir(session){
    var role = (session && session.role) || "ag";
    var rhAdmin = role === "rh" || role === "admin";
    var niveau = function (m) { return (session && session.modulePermissions && session.modulePermissions[m]) || "none"; };
    var module = function (m) { return rhAdmin || niveau(m) !== "none"; };
    return {
      "sante-visites.html": rhAdmin || role === "manager" || niveau("sante-visites") !== "none",   // encadrement (question 17)
      "penibilite.html": module("penibilite"),
      "saisie-rh.html": rhAdmin || niveau("atmp-declare") === "write",
      "saisie-duerp.html": rhAdmin,
      "dossiers-atmp-citis.html": module("atmp-admin"),
      "accident-analyse.html": module("accident-analyse"),
      "urgences-exercices.html": module("urgences"),
      "gestion-rh.html": module("gestion-rh"),
      "entreprises-exterieures.html": module("entreprises-ext"),
      "accueil-poste.html": module("accueil-poste"),
      "dialogue-social.html": module("dialogue-social"),
      "reporting.html": rhAdmin,
      "administration.html": role === "admin"
    };
  }

  function pageCourante(){
    try { return decodeURIComponent(location.pathname.split("/").pop() || ""); } catch (e) { return ""; }
  }

  function rendreMenu(nav, session){
    var permis = voir(session), ici = pageCourante();
    nav.innerHTML = MENU.map(function (section) {
      var liens = section.liens.filter(function (l) { return l[0] === ici || permis[l[0]] !== false; });
      if (!liens.length) return "";
      return '<div class="nav-section">' + (section.titre ? '<div class="nav-label">' + section.titre + "</div>" : "") +
        liens.map(function (l) {
          return '<a class="nav-item' + (l[0] === ici ? " active" : "") + '" href="' + l[0] + '"><svg class="icon"><use href="#' + l[1] + '"/></svg> ' + l[2] + "</a>";
        }).join("") + "</div>";
    }).join("");
  }

  function init(session){
    if (window.VigieIcones) VigieIcones.inserer();   // sprite des icônes (assets/icones.js), avant de dessiner
    var sidebar = document.getElementById("sidebar"), scrim = document.getElementById("scrim");
    var appShell = document.querySelector(".app-shell");
    var pinBtn = document.getElementById("sidebarPin");
    var mainEl = document.querySelector(".main");
    var collapseTimer = null;
    var sidebarLocked = VigieStore.getItem("vigie_hse_sidebar_locked") === "true";

    rendreMenu(sidebar.querySelector("nav"), session);

    document.getElementById("menuToggle").addEventListener("click", function () { sidebar.classList.add("open"); scrim.classList.add("show"); });
    scrim.addEventListener("click", function () { sidebar.classList.remove("open"); scrim.classList.remove("show"); });

    function applyPinVisual(){ if (pinBtn) pinBtn.classList.toggle("active", sidebarLocked); }
    function isDesktopWidth(){ return window.innerWidth > 980; }
    function sidebarExpand(){
      clearTimeout(collapseTimer);
      if (appShell) appShell.classList.remove("sidebar-collapsed");
    }
    function sidebarCollapse(delay){
      clearTimeout(collapseTimer);
      if (!isDesktopWidth() || sidebarLocked) return;
      collapseTimer = setTimeout(function () { if (appShell) appShell.classList.add("sidebar-collapsed"); }, delay || 0);
    }

    sidebar.addEventListener("mouseenter", sidebarExpand);
    sidebar.addEventListener("mouseleave", function () { sidebarCollapse(150); });
    sidebar.addEventListener("focusin", sidebarExpand);
    sidebar.addEventListener("focusout", function (e) { if (!sidebar.contains(e.relatedTarget)) sidebarCollapse(150); });
    if (mainEl){
      mainEl.addEventListener("mouseenter", function () { sidebarCollapse(200); });
      mainEl.addEventListener("scroll", function () { sidebarCollapse(0); }, { passive: true });
    }
    window.addEventListener("scroll", function () { sidebarCollapse(0); }, { passive: true });

    if (sidebarLocked) sidebarExpand();
    applyPinVisual();
    if (pinBtn) pinBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      sidebarLocked = !sidebarLocked;
      VigieStore.setItem("vigie_hse_sidebar_locked", sidebarLocked ? "true" : "false");
      applyPinVisual();
      if (sidebarLocked) sidebarExpand(); else sidebarCollapse(150);
    });
  }

  window.VigieMenu = { init: init, MENU: MENU, voir: voir };
})();
