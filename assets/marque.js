/* ============================================================================
   VIGIE HSE — Marque blanche : nom, signature, logo et couleurs réglables (toutes les pages et le serveur)
   ----------------------------------------------------------------------------
   Jalon J0 (2026-10-01). Un client qui n'est pas « VIGIE HSE / Soft Tech » voit son nom, son logo et sa
   couleur partout à l'écran et à l'impression. Le réglage se fait dans Administration → Référentiels →
   Marque ; il est rangé dans vigie_hse_referentials.marque = { nom, signature, logo, couleur, couleur2 }.

   Rien n'est personnalisé → ce composant ne fait RIEN : le HTML des pages (« VIGIE HSE », « Soft Tech »,
   l'icône bouclier, les couleurs d'origine) reste tel quel. Lire n'écrit jamais.

   Avant la connexion (page de connexion, vitrine), le serveur transmet ce réglage dans
   window.__VIGIE_SERVEUR__.marque (comme le secteur, assets/organisation.js) : aucune autre donnée.

   Ce que le composant change, quand il y a une marque :
     - les couleurs : --accent* et --accent-violet* redéclarés dans les trois blocs de thème (clair, sombre
       du système, sombre forcé) par un <style> à sélecteur plus précis que celui des pages (html:root…) —
       il gagne quel que soit l'endroit où il est inséré, et avant la première peinture ;
     - les textes : .brand-name, .brand-title, .dash-brand, .print-brand, [data-marque="nom"] (le nom),
       .brand-tag (la signature, masquée si vide) — par textContent, jamais innerHTML ;
     - le logo : dans chaque .brand-mark, par un <img> (un SVG y est inerte) ;
     - le titre de l'onglet du navigateur.
   Une marque illisible ou piégée retombe sur la valeur d'origine, champ par champ : jamais une page cassée.

   Le même fichier est lu par les pages (window.VigieMarque) et par le serveur
   (require('../assets/marque.js')) : une seule définition de ce qui est valide.
   ============================================================================ */
(function(racine){
  "use strict";

  var CLE = "vigie_hse_referentials";
  var PAR_DEFAUT = { nom: "VIGIE HSE", signature: "Soft Tech", logo: "", couleur: "#7d8fe8", couleur2: "#a991e8" };
  var LONGUEUR_MAX = 40;
  // logo : data URI d'une image de 100 Ko au plus (une fois décodée) ; un SVG s'affiche dans <img>, où ses scripts ne tournent pas
  var LOGO_VALIDE = /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+\/]+=*$/;
  var LOGO_MAX = 137000;
  var COULEUR_VALIDE = /^#[0-9a-fA-F]{6}$/;

  function texte(v){ return String(v == null ? "" : v).replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, LONGUEUR_MAX); }

  // valide chaque champ ; un champ absent ou invalide vaut sa valeur d'origine (la signature peut être vide : masquée)
  function nettoyer(o){
    o = o && typeof o === "object" ? o : {};
    var c = {};
    c.nom = texte(o.nom) || PAR_DEFAUT.nom;
    c.signature = typeof o.signature === "string" ? texte(o.signature) : PAR_DEFAUT.signature;
    c.logo = typeof o.logo === "string" && o.logo.length <= LOGO_MAX && LOGO_VALIDE.test(o.logo) ? o.logo : "";
    c.couleur = typeof o.couleur === "string" && COULEUR_VALIDE.test(o.couleur) ? o.couleur.toLowerCase() : PAR_DEFAUT.couleur;
    c.couleur2 = typeof o.couleur2 === "string" && COULEUR_VALIDE.test(o.couleur2) ? o.couleur2.toLowerCase() : PAR_DEFAUT.couleur2;
    return c;
  }

  function personnalisee(c){
    c = c || PAR_DEFAUT;
    return c.nom !== PAR_DEFAUT.nom || c.signature !== PAR_DEFAUT.signature || c.logo !== PAR_DEFAUT.logo ||
      c.couleur !== PAR_DEFAUT.couleur || c.couleur2 !== PAR_DEFAUT.couleur2;
  }

  // ---------- couleurs ----------
  function rvb(h){ return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function hex(t){ return "#" + t.map(function(x){ var s = x.toString(16); return s.length < 2 ? "0" + s : s; }).join(""); }
  function melange(h, part){ return hex(rvb(h).map(function(x){ return Math.round(x + (255 - x) * part); })); }
  // thème clair : la couleur choisie ; thème sombre : la même éclaircie de 15 % (l'original suit la même logique : #7D8FE8 → #8FA0F2)
  function variantes(h){
    var s = melange(h, 0.15);
    return { clair: { hex: h, rgb: rvb(h).join(",") }, sombre: { hex: s, rgb: rvb(s).join(",") } };
  }
  // rapport de contraste du blanc sur cette couleur (les boutons ont un texte blanc ; l'original est à ~3,1 : seuil d'avertissement 3)
  function contraste(h){
    var l = rvb(h).map(function(x){ x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 1.05 / (0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2] + 0.05);
  }
  function jetons(c, theme){
    var s = "";
    if (c.couleur !== PAR_DEFAUT.couleur){ var a = variantes(c.couleur)[theme]; s += "--accent:" + a.hex + ";--accent-rgb:" + a.rgb + ";"; }
    if (c.couleur2 !== PAR_DEFAUT.couleur2){ var v = variantes(c.couleur2)[theme]; s += "--accent-violet:" + v.hex + ";--accent-violet-rgb:" + v.rgb + ";"; }
    return s;
  }
  function feuille(c){
    var cl = jetons(c, "clair"), so = jetons(c, "sombre"), css = "";
    // « html:root » est plus précis que le « :root » des pages : la place du <script> dans la page n'a pas d'importance
    if (cl) css += "html:root{" + cl + "}\n@media (prefers-color-scheme: dark){html:root:not([data-theme=\"light\"]){" + so + "}}\nhtml:root[data-theme=\"dark\"]{" + so + "}\n";
    if (c.logo) css += ".brand-mark.marque-avec-logo{background:var(--surface-el);padding:3px;overflow:hidden}\n.brand-mark.marque-avec-logo img{width:100%;height:100%;object-fit:contain;display:block}\n";
    return css;
  }

  // ---------- lecture ----------
  function brute(){
    var raw = null;
    try { raw = racine.VigieStore ? racine.VigieStore.getItem(CLE) : null; } catch(e){}
    var ref = null; try { ref = raw ? JSON.parse(raw) : null; } catch(e){}
    if (ref && ref.marque && typeof ref.marque === "object") return ref.marque;
    // avant la connexion, le serveur ne transmet que ce réglage
    var v = racine.__VIGIE_SERVEUR__;
    return v && !v.session && v.marque && typeof v.marque === "object" ? v.marque : null;
  }
  function actuelle(){ return nettoyer(brute()); }
  function nom(){ try { return actuelle().nom; } catch(e){ return PAR_DEFAUT.nom; } }

  // ce que le serveur transmet sans session : la marque nettoyée, seulement si elle est personnalisée
  function publique(texteReferentiels){
    var ref; try { ref = JSON.parse(texteReferentiels || "{}"); } catch(e){ return null; }
    var c = nettoyer(ref && ref.marque);
    return personnalisee(c) ? c : null;
  }

  // ---------- application à la page ----------
  var SELECTEURS_NOM = ".brand-name,.dash-brand,.print-brand,.brand-title,[data-marque=\"nom\"]";
  var MASQUE = SELECTEURS_NOM + ",.brand-tag{visibility:hidden}";

  function style(id, css){
    var d = racine.document, s = d.getElementById(id);
    if (!css){ if (s) s.parentNode.removeChild(s); return; }
    if (!s){ s = d.createElement("style"); s.id = id; (d.head || d.documentElement).appendChild(s); }
    s.textContent = css;
  }
  function parTous(liste, f){ for (var i = 0; i < liste.length; i++) f(liste[i]); }

  function titre(c){
    var d = racine.document, t = d.title || "";
    if (!t || c.nom === PAR_DEFAUT.nom) return;
    if (t.toUpperCase().indexOf(PAR_DEFAUT.nom) >= 0) d.title = t.replace(/VIGIE HSE/gi, function(){ return c.nom; });
    else if (t.indexOf(c.nom) < 0) d.title = t + " — " + c.nom;
  }

  function textes(c){
    var d = racine.document;
    if (c.nom !== PAR_DEFAUT.nom){ parTous(d.querySelectorAll(SELECTEURS_NOM), function(e){ e.textContent = c.nom; }); titre(c); }
    if (c.signature !== PAR_DEFAUT.signature){ parTous(d.querySelectorAll(".brand-tag"), function(e){ e.textContent = c.signature; if (!c.signature) e.style.display = "none"; }); }
    if (c.logo){
      parTous(d.querySelectorAll(".brand-mark"), function(e){
        while (e.firstChild) e.removeChild(e.firstChild);
        var img = d.createElement("img"); img.alt = ""; img.src = c.logo;
        e.appendChild(img); e.className += " marque-avec-logo";
      });
    }
  }

  function appliquer(){
    try {
      var d = racine.document; if (!d) return;
      var c = actuelle();
      if (!personnalisee(c)){ style("vigie-marque-style", ""); style("vigie-marque-masque", ""); return; }
      style("vigie-marque-style", feuille(c));
      var touche = c.nom !== PAR_DEFAUT.nom || c.signature !== PAR_DEFAUT.signature || !!c.logo;
      if (!touche) return;
      var faire = function(){ try { textes(c); } finally { style("vigie-marque-masque", ""); } };
      if (d.readyState === "loading"){
        style("vigie-marque-masque", MASQUE);   // pas de clignotement du nom d'origine avant le remplacement
        d.addEventListener("DOMContentLoaded", faire);
      } else faire();
    } catch(e){ try { racine.document.getElementById("vigie-marque-masque") && style("vigie-marque-masque", ""); } catch(e2){} }
  }

  var M = {
    PAR_DEFAUT: PAR_DEFAUT, LONGUEUR_MAX: LONGUEUR_MAX, LOGO_MAX: LOGO_MAX,
    nettoyer: nettoyer, personnalisee: personnalisee, actuelle: actuelle, nom: nom, publique: publique,
    variantes: variantes, contraste: contraste, feuille: feuille, appliquer: appliquer
  };
  if (typeof module === "object" && module.exports) module.exports = M;
  else if (!racine.VigieMarque){ racine.VigieMarque = M; M.appliquer(); }
})(typeof window !== "undefined" ? window : globalThis);
