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
//
// Mode serveur (étape P1a, serveur/serveur.js) : servie par le serveur VIGIE, la page reçoit l'état de
// la base dans window.__VIGIE_SERVEUR__ avant ce script. VigieStore lit alors dans cet état et écrit
// par l'API — de façon synchrone, comme localStorage, pour que les 24 pages n'aient rien à changer (une
// page qui enregistre puis change d'écran ne perd pas sa saisie). Seules les préférences d'affichage
// restent dans le navigateur. Si deux personnes modifient le même registre, les modifications sont
// fusionnées enregistrement par enregistrement ; seul un même champ modifié des deux côtés est refusé.
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
    bandeau("vigie-stockage-bloque", "#8a3b12", "Ce navigateur bloque l'enregistrement des données : vous pouvez consulter et saisir, mais rien ne sera conservé à la fermeture de la page. Autorisez les cookies et le stockage de ce site pour travailler normalement.");
  }

  // Stockage plein (le navigateur accorde environ 5 millions de caractères par site) : l'écriture échoue,
  // et la plupart des pages enveloppent leur enregistrement dans un try/catch muet — la saisie était
  // perdue sans un mot. On garde l'erreur (même comportement pour la page) et on le dit à l'écran.
  // Réponse du préventeur à la question 13 : tout l'historique d'un client est à reprendre.
  function estPlein(e){
    return !!e && (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" || e.code === 22 || e.code === 1014);
  }
  function signalerPlein(){
    bandeau("vigie-stockage-plein", "#8a1c1c", "L'espace de stockage de ce navigateur est plein : la dernière modification n'a PAS été enregistrée. Exportez vos registres en Excel pour les garder, puis prévenez l'administrateur.");
  }

  function bandeau(id, fond, texte){
    var poser = function(){
      if (document.getElementById(id)) return;
      var b = document.createElement("div");
      b.id = id;
      b.setAttribute("role", "alert");
      b.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:9999;padding:10px 16px;background:" + fond + ";color:#fff;font:600 13px/1.4 system-ui,sans-serif;text-align:center;";
      b.textContent = texte;
      document.body.appendChild(b);
    };
    if (document.body) poser(); else document.addEventListener("DOMContentLoaded", poser);
  }

  // ---------- Fusion à trois : ce que la page avait lu (base), ce qu'elle écrit (mien), ce que le serveur a ----------
  // Tableaux d'enregistrements à identifiant unique (tous les registres) : fusion par id, puis champ par
  // champ — une personne ajoute un accident pendant qu'une autre en corrige un autre : les deux restent.
  // Listes de libellés (référentiels) : ajouts et retraits de chaque côté. Objets : clé par clé. Le même
  // champ changé différemment des deux côtés est un vrai conflit : rien n'est écrasé, la page le dit.
  var ABSENT = { absent: true }, CONFLIT = { conflit: true };
  var possede = function(o, k){ return Object.prototype.hasOwnProperty.call(o, k); };
  function pareil(a, b){ return a === b || (a !== ABSENT && b !== ABSENT && JSON.stringify(a) === JSON.stringify(b)); }
  function objetSimple(v){ return !!v && typeof v === "object" && !Array.isArray(v) && v !== ABSENT; }
  // index { m: clé → élément, ordre } d'un tableau, ou null si deux éléments ont la même clé
  function indexer(t, cleDe){
    var m = {}, ordre = [];
    for (var i = 0; i < t.length; i++){
      var k = cleDe(t[i]);
      if (k === null || possede(m, k)) return null;
      m[k] = t[i]; ordre.push(k);
    }
    return { m: m, ordre: ordre };
  }
  var parId = function(x){ return objetSimple(x) && x.id != null ? "#" + x.id : null; };
  var parContenu = function(x){ return JSON.stringify(x); };
  function fusionListe(B, M, A){
    var lire = function(X, k){ return possede(X.m, k) ? X.m[k] : ABSENT; };
    // mes ajouts placés avant tout élément déjà connu restent en tête (listes tenues du plus récent au plus ancien)
    var tete = [];
    for (var i = 0; i < M.ordre.length; i++){ var k0 = M.ordre[i]; if (possede(B.m, k0) || possede(A.m, k0)) break; tete.push(k0); }
    var ordre = tete.concat(A.ordre, M.ordre), vus = {}, res = [];
    for (var j = 0; j < ordre.length; j++){
      var k = ordre[j];
      if (vus[k]) continue;
      vus[k] = true;
      var v = fusion3(lire(B, k), lire(M, k), lire(A, k));
      if (v === CONFLIT) return CONFLIT;
      if (v !== ABSENT) res.push(v);
    }
    return res;
  }
  function fusion3(base, mien, autre){
    if (pareil(mien, autre)) return mien;
    if (pareil(mien, base)) return autre;
    if (pareil(autre, base)) return mien;
    if (Array.isArray(mien) && Array.isArray(autre)){
      var b = Array.isArray(base) ? base : [];
      var cleDe = [b, mien, autre].every(function(t){ return indexer(t, parId); }) ? parId : parContenu;
      var B = indexer(b, cleDe), M = indexer(mien, cleDe), A = indexer(autre, cleDe);
      return (B && M && A) ? fusionListe(B, M, A) : CONFLIT;
    }
    if (objetSimple(mien) && objetSimple(autre)){
      var bo = objetSimple(base) ? base : {}, res = {}, cles = Object.keys(autre).concat(Object.keys(mien));
      for (var i = 0; i < cles.length; i++){
        var k = cles[i];
        if (possede(res, k)) continue;
        var v = fusion3(possede(bo, k) ? bo[k] : ABSENT, possede(mien, k) ? mien[k] : ABSENT, possede(autre, k) ? autre[k] : ABSENT);
        if (v === CONFLIT) return CONFLIT;
        if (v !== ABSENT) res[k] = v;
      }
      return res;
    }
    return CONFLIT;
  }
  // sur les chaînes stockées (null : clé absente) → chaîne à écrire, null pour supprimer, ou CONFLIT
  function fusionner(base, mien, autre){
    var lireJson = function(s){ if (s == null) return ABSENT; try { return JSON.parse(s); } catch(e){ return undefined; } };
    var b = lireJson(base), m = lireJson(mien), a = lireJson(autre);
    var texte = b === undefined || m === undefined || a === undefined;
    if (texte){   // pas du JSON : texte comparé tel quel
      var brut = function(s){ return s == null ? ABSENT : s; };
      b = brut(base); m = brut(mien); a = brut(autre);
    }
    var r = fusion3(b, m, a);
    if (r === CONFLIT) return CONFLIT;
    if (r === ABSENT) return null;
    if (r === m) return mien;
    if (r === a) return autre;
    return texte ? r : JSON.stringify(r);
  }

  // ---------- Mode serveur ----------
  var SERVEUR = (window.__VIGIE_SERVEUR__ && window.__VIGIE_SERVEUR__.donnees) ? window.__VIGIE_SERVEUR__ : null;
  // par clé : serveur = dernière valeur connue du serveur, vue = ce que la page a lu ou écrit en dernier
  // (la base de la fusion), revision = révision de la valeur « serveur »
  var etat = {};
  function initialiserEtat(){
    etat = {};
    Object.keys(SERVEUR.donnees).forEach(function(k){
      var d = SERVEUR.donnees[k];
      etat[k] = { serveur: d.v, vue: d.v, revision: d.r };
    });
  }
  if (SERVEUR) initialiserEtat();
  var resteLocale = function(cle){ return !!CLES[cle] && CLES[cle].nature === "preference"; };
  var entree = function(cle){ return etat[cle] || (etat[cle] = { serveur: null, vue: null, revision: 0 }); };

  function appeler(methode, chemin, corps, revision){
    var x = new XMLHttpRequest();
    try {
      x.open(methode, SERVEUR.api + chemin, false);   // synchrone : voir l'en-tête de ce fichier
      x.setRequestHeader("X-Vigie", "1");
      if (revision != null) x.setRequestHeader("X-Vigie-Revision", String(revision));
      if (corps != null) x.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
      x.send(corps == null ? null : corps);
    } catch(e){ return { statut: 0, reponse: null }; }
    var r = null;
    try { r = JSON.parse(x.responseText); } catch(e){}
    return { statut: x.status, reponse: r };
  }
  function echec(nom, message){ var e = new Error(message); e.name = nom; return e; }
  function injoignable(){
    bandeau("vigie-serveur-injoignable", "#8a1c1c", "Le serveur VIGIE HSE ne répond pas : la dernière modification n'a PAS été enregistrée. Vérifiez qu'il est lancé, puis rechargez la page.");
    return echec("VigieServeurInjoignable", "serveur injoignable");
  }
  function conflit(cle){
    var module = CLES[cle] ? CLES[cle].module : cle;
    bandeau("vigie-conflit", "#8a3b12", "Quelqu'un a modifié les mêmes informations (" + module + ") en même temps que vous : votre dernière modification n'a PAS été enregistrée, pour ne pas écraser la sienne. Rechargez la page (F5) pour voir la version à jour, puis refaites votre modification.");
    return echec("VigieConflit", "conflit sur " + cle);
  }

  // valeur : chaîne à enregistrer, ou null pour supprimer la clé
  function ecrireDistant(cle, valeur){
    var e = entree(cle);
    if (valeur === e.serveur){ e.vue = valeur; return; }       // rien de nouveau pour le serveur
    if (valeur === e.vue) return;                               // la page réécrit ce qu'elle avait lu : rien à envoyer
    var aEnvoyer = e.serveur === e.vue ? valeur : fusionner(e.vue, valeur, e.serveur);
    for (var essai = 0; essai < 5; essai++){
      if (aEnvoyer === CONFLIT) throw conflit(cle);
      var r = aEnvoyer === null ? appeler("DELETE", "donnees/" + encodeURIComponent(cle), null, e.revision)
                                : appeler("PUT", "donnees/" + encodeURIComponent(cle), aEnvoyer, e.revision);
      if (r.statut === 200 && r.reponse){ e.serveur = aEnvoyer; e.vue = valeur; e.revision = r.reponse.revision; return; }
      if (r.statut === 409 && r.reponse){
        // quelqu'un a écrit entre-temps : on repart de sa version
        e.serveur = r.reponse.valeur; e.revision = r.reponse.revision;
        aEnvoyer = fusionner(e.vue, valeur, e.serveur);
        continue;
      }
      if (r.statut === 413){ signalerPlein(); throw echec("QuotaExceededError", "trop volumineux pour le serveur"); }
      throw injoignable();
    }
    throw conflit(cle);
  }

  var distant = {
    getItem: function(cle){ return resteLocale(cle) ? fond().getItem(cle) : (etat[cle] ? etat[cle].serveur : null); },
    setItem: function(cle, valeur){ if (resteLocale(cle)) return fond().setItem(cle, valeur); ecrireDistant(cle, String(valeur)); },
    removeItem: function(cle){ if (resteLocale(cle)) return fond().removeItem(cle); ecrireDistant(cle, null); },
    clear: function(){
      var r = appeler("POST", "effacer", null, null);
      if (r.statut !== 200) throw injoignable();
      // même règle que le serveur : seule une clé qui avait une valeur change de révision
      Object.keys(etat).forEach(function(k){ var e = etat[k]; etat[k] = { serveur: null, vue: null, revision: e.revision + (e.serveur !== null ? 1 : 0) }; });
      fond().clear();
    },
  };

  window.VigieStore = {
    CLES: CLES,
    getItem: function(cle){ return SERVEUR ? distant.getItem(cle) : fond().getItem(cle); },
    setItem: function(cle, valeur){
      if (SERVEUR) return distant.setItem(cle, valeur);
      try { fond().setItem(cle, valeur); }
      catch(e){ if (estPlein(e)) signalerPlein(); throw e; }
    },
    // caractères occupés par les clés de l'application (clé + valeur), pour suivre l'approche de la limite
    occupation: function(){
      var n = 0;
      Object.keys(CLES).forEach(function(k){ var v = window.VigieStore.getItem(k); if (v != null) n += k.length + v.length; });
      return n;
    },
    removeItem: function(cle){ if (SERVEUR) return distant.removeItem(cle); fond().removeItem(cle); },
    // « Réinitialiser les données de démonstration » : tout ce que l'application a stocké
    // (en mode serveur : pour tous les utilisateurs — le serveur garde une copie de la base avant)
    clear: function(){ if (SERVEUR) return distant.clear(); fond().clear(); },
    // false quand le navigateur refuse le stockage (données gardées le temps de la page seulement)
    persistant: function(){ return !!SERVEUR || fond() !== memoire; },
    // « serveur » (base partagée), « navigateur » (ce navigateur seulement) ou « memoire » (rien n'est conservé)
    mode: function(){ return SERVEUR ? "serveur" : (fond() === memoire ? "memoire" : "navigateur"); },
    _fusionner: fusionner,   // exposé pour les tests
  };
  // vérifié dès le chargement : la vitrine et l'écran de connexion préviennent avant toute saisie
  fond();
})();
