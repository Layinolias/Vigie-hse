/* ============================================================================
   VIGIE HSE — Droits : catalogue des modules, profils, résolution (toutes les pages et le serveur)
   ----------------------------------------------------------------------------
   Remplace les quatre rôles codés en dur (admin / rh / manager / ag) et les clés « modulePermissions »
   ajoutées module par module. Un compte reçoit un ou plusieurs PROFILS ; chaque profil donne, pour
   chaque module, un niveau d'accès ; les niveaux de plusieurs profils se CUMULENT (le plus haut gagne).
   Les droits ne s'éditent que sur les profils (Administration → Profils).

   Le même fichier est lu par les pages (window.VigieDroits) et par le serveur
   (require('../assets/droits.js')) : une seule définition de ce que chaque niveau permet.

   Niveaux : chaque module a une liste ORDONNÉE ; un niveau inclut tous les précédents
   (ex. atmp : aucun < consulter < declarer < gerer).

   Compatibilité : un compte sans « profils » (ancien format : role + modulePermissions) et une session
   sans « droits » (harnais, session ouverte avant la mise à jour) se résolvent à la volée en les mêmes
   droits qu'avant — le préréglage de leur rôle, plus leurs permissions de module.

   Un nouveau module s'ajoute ICI (MODULES), puis à la liste MENU de menu-lateral.js : jamais page par page.
   Documentation/ETAT-DU-PROJET.md §7.
   ========================================================================== */
(function (racine) {
  "use strict";

  var STD = [["consulter", "Consulter"], ["gerer", "Gérer"]];
  function mod(id, section, nom, niveaux) {
    var ordre = ["aucun"], libelles = { aucun: "Aucun accès" };
    niveaux.forEach(function (n) { ordre.push(n[0]); libelles[n[0]] = n[1]; });
    return { id: id, section: section, nom: nom, niveaux: ordre, libelles: libelles };
  }

  // Dans l'ordre du menu (assets/menu-lateral.js). Les identifiants reprennent les anciennes clés de
  // modulePermissions quand elles existaient.
  var MODULES = [
    mod("atmp", "Santé au travail", "Registre AT/MP", [["consulter", "Consulter"], ["declarer", "Consulter et déclarer"], ["gerer", "Gérer"]]),
    mod("rsst", "Santé au travail", "Registre SST", [["deposer", "Déposer une observation"], ["auteurs", "Déposer et voir les auteurs"], ["repondre", "Répondre et clôturer"]]),
    mod("duerp", "Sécurité & Risques", "Document unique", STD),
    mod("produits", "Sécurité & Risques", "Produits chimiques", STD),
    mod("actions", "Suivi", "Plan d'actions", STD),
    mod("sante-visites", "Suivi", "Santé & Visites", STD),
    mod("verifications", "Suivi", "Vérifications périodiques", STD),
    mod("inspections", "Suivi", "Inspection / Audit", STD),
    mod("formations", "Suivi", "Formation / Habilitation", STD),
    mod("epi", "Suivi", "EPI & Dotation", STD),
    mod("penibilite", "Suivi", "Pénibilité", STD),
    mod("atmp-admin", "Administratif", "Dossiers AT/MP & CITIS", STD),
    mod("accident-analyse", "Administratif", "Analyse d'accident", STD),
    mod("urgences", "Administratif", "Situations d'urgence", STD),
    mod("gestion-rh", "Administratif", "Gestion RH", STD),
    mod("entreprises-ext", "Administratif", "Entreprises extérieures", STD),
    mod("accueil-poste", "Administratif", "Accueil au poste", STD),
    mod("documentation", "Ressources", "Base documentaire", [["consulter", "Consulter"], ["rediger", "Rédiger"]]),
    mod("dialogue-social", "Ressources", "Dialogue social", [["consulter", "Consulter"], ["participer", "Participer (représentant)"], ["direction", "Direction (répondre, clôturer)"]]),
    mod("reporting", "Pilotage", "Indicateurs & Reporting", [["consulter", "Consulter"]]),
    mod("administration", "Pilotage", "Administration", [["gerer", "Gérer"]])
  ];
  var PAR_ID = {};
  MODULES.forEach(function (m) { PAR_ID[m.id] = m; });

  function rang(m, niveau) {
    var def = PAR_ID[m];
    var i = def ? def.niveaux.indexOf(niveau) : -1;
    return i < 0 ? 0 : i;
  }
  function plusHaut(m) { return PAR_ID[m].niveaux[PAR_ID[m].niveaux.length - 1]; }
  function toutAuMax(sauf) {
    var d = {};
    MODULES.forEach(function (m) { d[m.id] = (sauf && sauf.indexOf(m.id) >= 0) ? "aucun" : plusHaut(m.id); });
    return d;
  }

  // Préréglages : identifiants stables, renommables et modifiables dans Administration, jamais supprimés.
  var PREREGLES = [
    { id: "p-admin", nom: "Administrateur", libelle: "Administrateur", pastille: "ADMIN", droits: toutAuMax() },
    { id: "p-rh", nom: "RH", libelle: "Compte RH", pastille: "RH", droits: toutAuMax(["administration"]) },
    { id: "p-manager", nom: "Manager", libelle: "Manager", pastille: "MANAGER", droits: {
      atmp: "consulter", rsst: "auteurs", duerp: "consulter", actions: "consulter", verifications: "consulter",
      inspections: "consulter", produits: "consulter", formations: "consulter", epi: "consulter",
      documentation: "consulter", "sante-visites": "consulter" } },
    { id: "p-agent", nom: "Agent", libelle: "Compte Agent", pastille: "AG", droits: {
      atmp: "consulter", rsst: "deposer", duerp: "consulter", actions: "consulter", verifications: "consulter",
      inspections: "consulter", produits: "consulter", formations: "consulter", epi: "consulter",
      documentation: "consulter" } },
    { id: "p-preventeur", nom: "Préventeur", libelle: "Préventeur", pastille: "PRÉVENTEUR", droits: {
      atmp: "declarer", "atmp-admin": "gerer", "accident-analyse": "gerer", urgences: "gerer", "sante-visites": "consulter" } },
    { id: "p-representant", nom: "Représentant du personnel", libelle: "Représentant du personnel", pastille: "REPRÉSENTANT", droits: {
      "dialogue-social": "participer" } }
  ];
  var PREREGLE_PAR_ID = {};
  PREREGLES.forEach(function (p) { PREREGLE_PAR_ID[p.id] = p; });

  // Droits d'un profil, complets : un niveau valide pour CHAQUE module (le reste de la graine pour un préréglage,
  // « aucun » pour un profil personnalisé : un module ajouté plus tard n'ouvre rien tout seul).
  function droitsComplets(graine, stockes) {
    var d = {};
    MODULES.forEach(function (m) {
      var v = stockes && stockes[m.id];
      if (m.niveaux.indexOf(v) < 0) v = graine && graine[m.id];
      d[m.id] = m.niveaux.indexOf(v) < 0 ? "aucun" : v;
    });
    return d;
  }
  function texte(v, defaut) { return typeof v === "string" && v.trim() ? v : defaut; }

  // La liste complète des profils : les préréglages (fusionnés clé par clé avec ce qui est enregistré), puis les
  // profils personnalisés enregistrés. « stockes » : la liste lue dans vigie_hse_profils (ou rien).
  function fusionnerProfils(stockes) {
    var liste = Array.isArray(stockes) ? stockes : [], vus = {}, sortie = [];
    liste.forEach(function (p) { if (p && typeof p === "object" && typeof p.id === "string" && !vus[p.id]) vus[p.id] = p; });
    PREREGLES.forEach(function (g) {
      var s = vus[g.id] || {};
      sortie.push({ id: g.id, nom: texte(s.nom, g.nom), libelle: texte(s.libelle, g.libelle), pastille: texte(s.pastille, g.pastille),
        droits: droitsComplets(g.droits, s.droits), prereglage: true });
    });
    liste.forEach(function (p) {
      if (!p || typeof p !== "object" || typeof p.id !== "string" || PREREGLE_PAR_ID[p.id] || vus[p.id] !== p) return;
      var nom = texte(p.nom, "Profil sans nom");
      sortie.push({ id: p.id, nom: nom, libelle: texte(p.libelle, nom), pastille: texte(p.pastille, nom.toUpperCase()),
        droits: droitsComplets(null, p.droits), prereglage: false });
    });
    return sortie;
  }
  function parId(profils) { var o = {}; profils.forEach(function (p) { o[p.id] = p; }); return o; }

  // ---- ancien format --------------------------------------------------------------------------------------
  // clé de modulePermissions → [module, niveau pour « read », niveau pour « write »]
  var ANCIENNES = {
    "atmp-admin": ["atmp-admin", "consulter", "gerer"],
    "atmp-declare": ["atmp", null, "declarer"],
    "accident-analyse": ["accident-analyse", "consulter", "gerer"],
    "urgences": ["urgences", "consulter", "gerer"],
    "gestion-rh": ["gestion-rh", "consulter", "gerer"],
    "entreprises-ext": ["entreprises-ext", "consulter", "gerer"],
    "accueil-poste": ["accueil-poste", "consulter", "gerer"],
    "penibilite": ["penibilite", "consulter", "gerer"],
    "sante-visites": ["sante-visites", "consulter", "gerer"],
    "dialogue-social": ["dialogue-social", "consulter", "participer"],
    "documentation": ["documentation", "consulter", "rediger"]
  };
  var PROFIL_DU_ROLE = { admin: "p-admin", rh: "p-rh", manager: "p-manager" };

  // Un compte à l'ancien format → { profil: préréglage de son rôle, extras: { module: niveau } }
  function depuisAncien(u) {
    var extras = {}, mp = (u && u.modulePermissions) || {};
    Object.keys(ANCIENNES).forEach(function (cle) {
      var v = mp[cle], a = ANCIENNES[cle], n = v === "read" ? a[1] : v === "write" ? a[2] : null;
      if (n && rang(a[0], n) > rang(a[0], extras[a[0]])) extras[a[0]] = n;
    });
    return { profil: PROFIL_DU_ROLE[u && u.role] || "p-agent", extras: extras };
  }

  // ---- résolution -----------------------------------------------------------------------------------------
  function absorber(droits, autres) {
    MODULES.forEach(function (m) {
      var n = autres && autres[m.id];
      if (n && rang(m.id, n) > rang(m.id, droits[m.id])) droits[m.id] = n;
    });
  }

  // Les droits d'un compte → { droits: { module: niveau } (un niveau pour chaque module), profils: [noms],
  // libelle, pastille } ; libellé et pastille viennent du premier profil.
  function resoudre(u, stockes) {
    var profils = fusionnerProfils(stockes), index = parId(profils), droits = {}, noms = [], premier = null;
    MODULES.forEach(function (m) { droits[m.id] = "aucun"; });
    if (u && Array.isArray(u.profils)) {
      u.profils.forEach(function (id) {
        var p = index[id];
        if (!p) return;
        absorber(droits, p.droits);
        noms.push(p.nom);
        if (!premier) premier = p;
      });
    } else {
      var h = depuisAncien(u), base = index[h.profil];
      absorber(droits, base.droits);
      absorber(droits, h.extras);
      noms.push(base.nom);
      premier = base;
    }
    return { droits: droits, profils: noms, libelle: premier ? premier.libelle : "Compte sans profil", pastille: premier ? premier.pastille : "—" };
  }

  function niveauDe(droits, m) {
    var n = droits && droits[m];
    return PAR_ID[m] && PAR_ID[m].niveaux.indexOf(n) >= 0 ? n : "aucun";
  }
  // « droits » donne-t-il au moins ce niveau sur ce module ? (niveau inconnu : non)
  function atteint(droits, m, niveau) {
    var def = PAR_ID[m];
    if (!def || def.niveaux.indexOf(niveau) < 0) return false;
    return rang(m, niveauDe(droits, m)) >= rang(m, niveau);
  }

  // ---- conversion des comptes à l'ancien format (Administration, une fois) -------------------------------
  function empreinte(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  function nonNuls(d) {
    var o = {};
    MODULES.forEach(function (m) { if (d[m.id] && d[m.id] !== "aucun") o[m.id] = d[m.id]; });
    return o;
  }
  function memesDroits(a, b) {
    var ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
    return ka.length === kb.length && ka.every(function (k, i) { return k === kb[i] && a[k] === b[k]; });
  }
  function copie(o) { var c = {}; Object.keys(o).forEach(function (k) { c[k] = o[k]; }); return c; }

  // Chaque compte sans « profils » reçoit le préréglage de son rôle, plus — si ses permissions de module vont
  // au-delà — « Préventeur » (mêmes droits en plus) ou un profil « Droits particuliers » partagé par les comptes
  // qui ont les mêmes. role et modulePermissions restent sur l'enregistrement, ignorés une fois « profils » posé.
  // → { users, profils (la liste complète à enregistrer), convertis, crees }
  function convertirComptes(users, stockes) {
    var profils = fusionnerProfils(stockes), index = parId(profils), convertis = 0, crees = 0;
    var sortie = (users || []).map(function (u) {
      if (!u || typeof u !== "object" || Array.isArray(u.profils)) return u;
      var h = depuisAncien(u), base = index[h.profil], reste = {};
      Object.keys(h.extras).forEach(function (m) { if (rang(m, h.extras[m]) > rang(m, base.droits[m])) reste[m] = h.extras[m]; });
      var ids = [h.profil];
      if (Object.keys(reste).length) {
        if (memesDroits(reste, nonNuls(index["p-preventeur"].droits))) ids.push("p-preventeur");
        else {
          var cle = Object.keys(reste).sort().map(function (m) { return m + "=" + reste[m]; }).join(","), id = "p-part-" + empreinte(cle);
          if (!index[id]) {
            var nom = "Droits particuliers — " + (u.username || u.email || u.id);
            var p = { id: id, nom: nom, libelle: nom, pastille: nom.toUpperCase(), droits: droitsComplets(null, reste), prereglage: false };
            profils.push(p);
            index[id] = p;
            crees++;
          }
          ids.push(id);
        }
      }
      convertis++;
      var n = copie(u);
      n.profils = ids;
      return n;
    });
    return { users: sortie, profils: profils, convertis: convertis, crees: crees };
  }

  // Combien de comptes actifs, non anonymisés, peuvent encore administrer ? (garde anti-verrouillage : il en faut au moins un)
  function administrateurs(users, stockes) {
    var n = 0;
    (users || []).forEach(function (u) {
      if (u && u.active !== false && u.anonymise !== true && atteint(resoudre(u, stockes).droits, "administration", "gerer")) n++;
    });
    return n;
  }

  // Un « role » indicatif pour un compte créé sans (affichage hérité, anciens harnais) : jamais utilisé pour décider d'un droit.
  function roleDepuis(droits) {
    return atteint(droits, "administration", "gerer") ? "admin" : atteint(droits, "atmp", "gerer") ? "rh" : "ag";
  }

  // ---- côté page : ce que la session ouverte a le droit de faire ------------------------------------------
  // session.droits (posé à la connexion) ; sinon — session ouverte avant la mise à jour, harnais — résolu à la volée
  // depuis son rôle et ses permissions de module.
  function pour(session) {
    var r = (session && session.droits && typeof session.droits === "object") ? null : resoudre(session || {}, null);
    var droits = r ? r.droits : session.droits;
    var compte = (session && session.compte) || {};
    return {
      droits: droits,
      libelle: compte.libelle || (r && r.libelle) || "Compte",
      pastille: compte.pastille || (r && r.pastille) || "",
      profils: (session && session.profils) || (r && r.profils) || [],
      niveau: function (m) { return niveauDe(droits, m); },
      peut: function (m, niveau) { return atteint(droits, m, niveau); }
    };
  }

  var D = {
    MODULES: MODULES, PREREGLES: PREREGLES, ANCIENNES: ANCIENNES,
    module: function (id) { return PAR_ID[id] || null; },
    rang: rang, niveauDe: niveauDe, atteint: atteint,
    fusionnerProfils: fusionnerProfils, depuisAncien: depuisAncien, resoudre: resoudre,
    convertirComptes: convertirComptes, administrateurs: administrateurs, roleDepuis: roleDepuis, pour: pour
  };
  if (typeof module === "object" && module.exports) module.exports = D;
  else if (!racine.VigieDroits) racine.VigieDroits = D;
})(typeof window !== "undefined" ? window : globalThis);
