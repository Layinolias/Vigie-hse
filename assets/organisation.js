// Organisation : les entités de premier niveau (aujourd'hui « Ville » et « Agglomération ») et leurs services,
// et le mot qui les désigne (« Collectivité », « Site », « Usine », « Équipe »…). SOURCE UNIQUE depuis le
// 2026-09-29 (jalon J0, ROADMAP-MODULES-FUTURS.md) : aucune page ne code plus ces noms en dur.
//
// Rangé dans vigie_hse_referentials.organisation — modifié seulement par Administration :
//   { libelle:"Collectivité", pluriel:"Collectivités", genre:"f",
//     entites:[ { nom:"Ville", services:[…] }, … ],
//     anciensNoms:{ "Ville":"Usine 1" } }   // renommages et suppressions : un ancien nom → l'entité actuelle
// Absent (installation d'avant cette version) : Ville et Agglomération, avec les listes de services déjà
// enregistrées (servicesVille / servicesAgglo) ou celles livrées — lire ne réécrit jamais rien.
//
// Les enregistrements gardent leur champ `collectivite` (un nom). Un nom qui n'est plus celui d'une entité
// (données de démonstration régénérées, ancien fichier Excel, enregistrement écrit par une autre page
// pendant le renommage) est ramené par `anciensNoms` à l'entité actuelle : rien ne devient orphelin.
// À charger après assets/stockage.js.
(function(){
  var CLE = "vigie_hse_referentials";
  var SERVICES_VILLE = ["Accueil & Affaires Générales","Patrimoine Bâti","Communication Institutionnelle","Restauration Collective","Ressources Humaines & Vie au Travail","Enfance & Jeunesse","Espaces Verts & Paysage","Vie Événementielle","Atelier Mécanique","Propreté de la Ville","Affaires Financières","Police Municipale & Tranquillité","Sports & Vie Associative","Voirie & Réseaux"];
  var SERVICES_AGGLO = ["Direction Générale des Services","Ressources Humaines & Vie au Travail","Conservatoire de Musique","Enfance & Jeunesse","Réseau des Médiathèques","Petite Enfance & Familles","Collecte & Propreté","Sports & Vie Associative","Urbanisme & Aménagement"];
  // mots proposés dans Administration (un autre reste possible, avec son genre)
  var MOTS = [
    { libelle:"Collectivité", pluriel:"Collectivités", genre:"f" },
    { libelle:"Site", pluriel:"Sites", genre:"m" },
    { libelle:"Usine", pluriel:"Usines", genre:"f" },
    { libelle:"Établissement", pluriel:"Établissements", genre:"m" },
    { libelle:"Équipe", pluriel:"Équipes", genre:"f" },
    { libelle:"Agence", pluriel:"Agences", genre:"f" },
    { libelle:"Entité", pluriel:"Entités", genre:"f" }
  ];

  function norm(s){ return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
  function listeTexte(l){ return Array.isArray(l) ? l.map(function(x){ return String(x == null ? "" : x).trim(); }).filter(Boolean) : []; }
  function referentiels(){
    try { var raw = window.VigieStore && VigieStore.getItem(CLE); var r = raw ? JSON.parse(raw) : null; return r && typeof r === "object" ? r : {}; } catch(e){ return {}; }
  }
  function parDefaut(ref){
    return { libelle:"Collectivité", pluriel:"Collectivités", genre:"f", anciensNoms:{}, entites:[
      { nom:"Ville", services: listeTexte(ref.servicesVille).length ? listeTexte(ref.servicesVille) : SERVICES_VILLE.slice() },
      { nom:"Agglomération", services: listeTexte(ref.servicesAgglo).length ? listeTexte(ref.servicesAgglo) : SERVICES_AGGLO.slice() }
    ] };
  }
  // configuration lue et assainie (jamais vide : au moins une entité)
  function config(){
    var ref = referentiels(), o = ref.organisation;
    if (!o || !Array.isArray(o.entites) || !o.entites.some(function(e){ return e && String(e.nom || "").trim(); })) return parDefaut(ref);
    var vus = {}, entites = [];
    o.entites.forEach(function(e){
      var nom = String((e && e.nom) || "").trim(); if (!nom || vus[norm(nom)]) return; vus[norm(nom)] = 1;
      entites.push({ nom: nom, services: listeTexte(e.services) });
    });
    var anciens = {};
    if (o.anciensNoms && typeof o.anciensNoms === "object") Object.keys(o.anciensNoms).forEach(function(k){ anciens[k] = String(o.anciensNoms[k]); });
    var libelle = String(o.libelle || "").trim() || "Collectivité";
    return { libelle: libelle, pluriel: String(o.pluriel || "").trim() || libelle + "s", genre: o.genre === "m" ? "m" : "f", entites: entites, anciensNoms: anciens };
  }

  var O = {
    CLE: CLE, MOTS: MOTS, norm: norm, config: config, parDefaut: function(){ return parDefaut(referentiels()); },
    noms: function(){ return config().entites.map(function(e){ return e.nom; }); },
    premier: function(){ return config().entites[0].nom; },
    libelle: function(){ return config().libelle; },
    pluriel: function(){ return config().pluriel; },
    // « Toutes » / « Tous » (option de filtre), « Toutes les collectivités » / « Tous les sites »
    tous: function(){ return config().genre === "m" ? "Tous" : "Toutes"; },
    tousLes: function(){ var c = config(); return (c.genre === "m" ? "Tous les " : "Toutes les ") + c.pluriel.toLowerCase(); },
    // nom d'entité actuel pour un nom enregistré : lui-même s'il existe, sinon ce qu'il est devenu (renommé,
    // fusionné), sinon "" (inconnu). Les chaînes de renommages successifs sont suivies (sans boucle).
    actuel: function(nom){
      var c = config(), n = String(nom == null ? "" : nom).trim(), vus = {};
      var existe = function(x){ return c.entites.some(function(e){ return e.nom === x; }); };
      while (n && !existe(n) && c.anciensNoms[n] !== undefined && !vus[n]){ vus[n] = 1; n = c.anciensNoms[n]; }
      return existe(n) ? n : "";
    },
    // l'entité d'un enregistrement : son champ ramené à l'entité actuelle ; sans champ (anciens
    // enregistrements), la première — comme « Ville » l'était jusqu'ici
    de: function(rec){ var v = rec && rec.collectivite; return (v && O.actuel(v)) || (v ? String(v) : O.premier()); },
    services: function(nom){ var a = O.actuel(nom), e = config().entites.filter(function(x){ return x.nom === a; })[0]; return e ? e.services.slice() : []; },
    tousServices: function(){ var s = {}; config().entites.forEach(function(e){ e.services.forEach(function(x){ s[x] = 1; }); }); return Object.keys(s).sort(function(a, b){ return a.localeCompare(b, "fr"); }); },
    // valeur lue dans un fichier importé → entité : nom exact (sans casse ni accents), ancien nom, puis début
    // de nom (« Agglo » → « Agglomération ») ; sinon la première entité, comme avant
    reconnaitre: function(texte){
      var t = norm(texte), c = config();
      if (!t) return O.premier();
      var exact = c.entites.filter(function(e){ return norm(e.nom) === t; })[0]; if (exact) return exact.nom;
      var ancien = Object.keys(c.anciensNoms).filter(function(k){ return norm(k) === t; })[0]; if (ancien && O.actuel(ancien)) return O.actuel(ancien);
      var debut = c.entites.filter(function(e){ var n = norm(e.nom); return n.indexOf(t) === 0 || t.indexOf(n) === 0; });
      if (debut.length === 1) return debut[0].nom;
      var anciensDebut = Object.keys(c.anciensNoms).filter(function(k){ var n = norm(k); return (n.indexOf(t) === 0 || t.indexOf(n) === 0) && O.actuel(k); });
      if (anciensDebut.length === 1) return O.actuel(anciensDebut[0]);
      // un mot du texte (4 lettres au moins) qui commence un mot du nom : « Communauté d'agglo » → « Agglomération »
      var mots = t.split(" ").filter(function(w){ return w.length >= 4; });
      var parMot = function(nom){ return norm(nom).split(" ").some(function(v){ return v.length >= 4 && mots.some(function(w){ return v.indexOf(w) === 0 || w.indexOf(v) === 0; }); }); };
      var m1 = c.entites.filter(function(e){ return parMot(e.nom); });
      if (m1.length === 1) return m1[0].nom;
      var m2 = Object.keys(c.anciensNoms).filter(function(k){ return parMot(k) && O.actuel(k); }).map(O.actuel).filter(function(v, i, a){ return a.indexOf(v) === i; });
      if (!m1.length && m2.length === 1) return m2[0];
      return O.premier();
    },
    // <option> d'un <select> : { tous:true } ajoute l'option « all » ; la valeur courante est gardée si elle existe encore
    remplir: function(select, opts){
      if (!select) return;
      opts = opts || {};
      var garde = opts.valeur !== undefined ? opts.valeur : select.value;
      var esc = function(s){ return String(s).replace(/[&<>"']/g, function(ch){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]; }); };
      var html = (opts.tous ? '<option value="all">' + esc(opts.texteTous || O.tous()) + "</option>" : "") +
        O.noms().map(function(n){ return '<option value="' + esc(n) + '">' + esc(n) + "</option>"; }).join("");
      select.innerHTML = html;
      var cible = garde === "all" && opts.tous ? "all" : O.actuel(garde);
      select.value = cible || (opts.tous ? "all" : O.premier());
    },
    // un nom d'entité et tous les anciens noms qui y mènent : ce que portent ses enregistrements
    nomsDe: function(nom){
      var c = config();
      return [nom].concat(Object.keys(c.anciensNoms).filter(function(k){ return k !== nom && O.actuel(k) === nom; }));
    },
    // Administration : clés d'enregistrements touchées par un renommage ou un déplacement
    clesDonnees: function(){
      var C = (window.VigieStore && VigieStore.CLES) || {};
      return Object.keys(C).filter(function(k){ return C[k] && C[k].nature === "donnees"; });
    },
    // combien d'enregistrements portent chacun des noms donnés (noms actuels et anciens compris), par clé
    compter: function(noms){
      var cibles = {}; noms.forEach(function(n){ cibles[n] = 1; });
      var total = 0, parCle = {};
      O.clesDonnees().forEach(function(k){
        var l; try { l = JSON.parse(VigieStore.getItem(k) || "[]"); } catch(e){ return; }
        if (!Array.isArray(l)) return;
        var n = l.filter(function(r){ return r && typeof r === "object" && cibles[r.collectivite]; }).length;
        if (n){ parCle[k] = n; total += n; }
      });
      return { total: total, parCle: parCle };
    },
    // réécrit `collectivite` de chaque enregistrement portant un des noms `depuis` en `vers` ; renvoie le nombre
    reecrire: function(depuis, vers){
      var cibles = {}; depuis.forEach(function(n){ cibles[n] = 1; });
      var total = 0;
      O.clesDonnees().forEach(function(k){
        var raw = VigieStore.getItem(k), l; try { l = JSON.parse(raw || "[]"); } catch(e){ return; }
        if (!Array.isArray(l)) return;
        var n = 0;
        l.forEach(function(r){ if (r && typeof r === "object" && cibles[r.collectivite]){ r.collectivite = vers; n++; } });
        if (n){ VigieStore.setItem(k, JSON.stringify(l)); total += n; }
      });
      return total;
    },

    // ----- Administration : modifications. Chacune renvoie { ok, erreur } ou { ok, n } (enregistrements réécrits).
    // La configuration est enregistrée AVANT la réécriture des enregistrements : si celle-ci s'interrompt,
    // `anciensNoms` ramène déjà les noms restants à la bonne entité.
    sauver: function(cfg){
      var ref = referentiels();
      ref.organisation = { libelle: cfg.libelle, pluriel: cfg.pluriel, genre: cfg.genre, entites: cfg.entites, anciensNoms: cfg.anciensNoms };
      VigieStore.setItem(CLE, JSON.stringify(ref));
    },
    ajouter: function(nom){
      var c = config(), n = String(nom == null ? "" : nom).trim();
      if (!n) return { ok:false, erreur:"Donnez un nom." };
      if (c.entites.some(function(e){ return norm(e.nom) === norm(n); })) return { ok:false, erreur:"« " + n + " » existe déjà." };
      c.entites.push({ nom: n, services: [] });
      delete c.anciensNoms[n];   // un nom repris redevient une entité à part entière
      O.sauver(c); return { ok:true, n:0 };
    },
    renommer: function(ancien, nouveau){
      var c = config(), n = String(nouveau == null ? "" : nouveau).trim();
      var e = c.entites.filter(function(x){ return x.nom === ancien; })[0];
      if (!e) return { ok:false, erreur:"« " + ancien + " » n'existe plus." };
      if (!n) return { ok:false, erreur:"Donnez un nom." };
      if (n === ancien) return { ok:true, n:0 };
      if (c.entites.some(function(x){ return x !== e && norm(x.nom) === norm(n); })) return { ok:false, erreur:"« " + n + " » existe déjà." };
      var portes = O.nomsDe(ancien);   // avant la modification : le nom et ses anciens noms
      e.nom = n;
      Object.keys(c.anciensNoms).forEach(function(k){ if (c.anciensNoms[k] === ancien) c.anciensNoms[k] = n; });
      delete c.anciensNoms[n]; c.anciensNoms[ancien] = n;
      O.sauver(c); return { ok:true, n: O.reecrire(portes, n) };
    },
    // supprimer une entité : ses enregistrements et ses services passent d'abord à `vers`
    supprimer: function(nom, vers){
      var c = config();
      var e = c.entites.filter(function(x){ return x.nom === nom; })[0], cible = c.entites.filter(function(x){ return x.nom === vers; })[0];
      if (!e) return { ok:false, erreur:"« " + nom + " » n'existe plus." };
      if (c.entites.length < 2) return { ok:false, erreur:"Il faut garder au moins une entrée." };
      if (!cible || cible === e) return { ok:false, erreur:"Choisissez où déplacer ses enregistrements." };
      var portes = O.nomsDe(nom);
      e.services.forEach(function(s){ if (cible.services.indexOf(s) < 0) cible.services.push(s); });
      c.entites = c.entites.filter(function(x){ return x !== e; });
      Object.keys(c.anciensNoms).forEach(function(k){ if (c.anciensNoms[k] === nom) c.anciensNoms[k] = vers; });
      c.anciensNoms[nom] = vers;
      O.sauver(c); return { ok:true, n: O.reecrire(portes, vers) };
    },
    definirServices: function(nom, liste){
      var c = config(), e = c.entites.filter(function(x){ return x.nom === nom; })[0];
      if (!e) return { ok:false, erreur:"« " + nom + " » n'existe plus." };
      var vus = {}; e.services = listeTexte(liste).filter(function(s){ var k = norm(s); if (vus[k]) return false; vus[k] = 1; return true; });
      O.sauver(c); return { ok:true, n:0 };
    },
    definirMot: function(libelle, pluriel, genre){
      var c = config(), l = String(libelle == null ? "" : libelle).trim();
      if (!l) return { ok:false, erreur:"Donnez le mot à afficher." };
      c.libelle = l; c.pluriel = String(pluriel == null ? "" : pluriel).trim() || l + "s"; c.genre = genre === "m" ? "m" : "f";
      O.sauver(c); return { ok:true, n:0 };
    },
    // ordre d'affichage ; la première entrée reçoit aussi les enregistrements sans entité
    deplacer: function(nom, sens){
      var c = config(), i = c.entites.map(function(x){ return x.nom; }).indexOf(nom), j = i + (sens < 0 ? -1 : 1);
      if (i < 0 || j < 0 || j >= c.entites.length) return { ok:false, erreur:"" };
      var t = c.entites[i]; c.entites[i] = c.entites[j]; c.entites[j] = t;
      O.sauver(c); return { ok:true, n:0 };
    }
  };
  window.VigieOrga = O;
})();
