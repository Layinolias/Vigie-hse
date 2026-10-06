// Libellés en français des champs enregistrés (2026-09-29) — pour montrer un enregistrement brut à quelqu'un
// qui ne connaît pas le code : Administration → « Données d'une personne » (droit d'accès, RGPD art. 15),
// dont l'export Excel est remis à la personne. Libellés repris des exports Excel des modules, harmonisés.
//
//   VigieLibelles.libelle(cle, champ)  → le libellé du champ dans ce registre (clé VigieStore.CLES)
//   VigieLibelles.valeur(v)            → la valeur lisible : Oui/Non, liste « a, b », date « JJ/MM/AAAA »,
//                                        horodatage à l'heure locale, sinon texte (JSON pour un objet imbriqué)
//
// Un champ absent de la table n'est jamais perdu : son nom technique est découpé (« dateArrivee » →
// « Date arrivee »). Un champ nouveau dans un module mérite une ligne ici.
(function(){
  "use strict";
  var COMMUNS = {
    id:"Identifiant", collectivite:"Collectivité", service:"Service", serviceDetail:"Service (détail)",
    nom:"Nom", prenom:"Prénom", civilite:"Civilité", dateNaissance:"Date de naissance", age:"Âge",
    statut:"Statut", categorie:"Catégorie", filiere:"Filière", cadreEmploi:"Cadre d'emploi", grade:"Grade", poste:"Poste",
    date:"Date", dateCreation:"Créé le", dateMaj:"Mis à jour le", auteur:"Auteur", createur:"Créé par",
    commentaire:"Commentaire", notes:"Notes", description:"Description", titre:"Titre", type:"Type", nature:"Nature",
    site:"Site", responsable:"Responsable", echeance:"Échéance", priorite:"Priorité", origine:"Origine",
    risque:"Risque", risqueLie:"Risque lié", periodiciteMois:"Périodicité (mois)", dateDerniere:"Dernière réalisation",
    actions:"Actions", points:"Points", reference:"Référence", ref:"Référence", source:"Source", url:"Lien", lien:"Lien",
    // comptes et journaux
    email:"Adresse électronique ou identifiant", username:"Identifiant", role:"Rôle", profils:"Profils de droits", services:"Services",
    active:"Compte actif", modulePermissions:"Permissions par module (ancien format)", anonymise:"Compte anonymisé",
    timestamp:"Date et heure", utilisateur:"Utilisateur", module:"Module", action:"Opération", record:"Enregistrement",
    // Registre AT/MP
    dateAT:"Date de l'accident", dateMois:"Mois de l'accident", jour:"Jour", typeAtMp:"Type (accident de travail, de trajet, maladie professionnelle)",
    arret:"Arrêt de travail", statutArret:"Arrêt en cours", joursArret:"Jours d'arrêt", circonstances:"Circonstances",
    etat:"État du dossier", siege:"Siège de la lésion", elementMateriel:"Élément matériel",
    mpTableau:"N° de tableau de maladie professionnelle", mpDateConstatation:"Date de première constatation médicale",
    mpDateDeclaration:"Date de déclaration", mpAvisMedecinTravail:"Avis du médecin du travail",
    mpAvisConseilMedical:"Avis du conseil médical", mpDecisionCollectivite:"Décision de la collectivité",
    // Dossiers AT/MP & CITIS, arrêtés
    atmpId:"Accident (identifiant)", cmi:"Certificat médical initial", prolongations:"Prolongations",
    certificatFinal:"Certificat final", ipp:"Incapacité permanente (IPP)", enquete:"Enquête",
    coutTotal:"Coût total", coutDetail:"Coût (détail)", autorite:"Autorité", dateSignature:"Signé le", dateTransmission:"Transmis le",
    // Analyse d'accident
    dateAnalyse:"Date de l'analyse", methode:"Méthode", faits:"Faits", pourquoi:"Les 5 pourquoi", ishikawa:"Diagramme d'Ishikawa", conclusion:"Conclusion",
    // Santé & Visites
    typeVisite:"Type de visite", visiteId:"Fiche de suivi (identifiant)", heure:"Heure", lieu:"Lieu", medecin:"Médecin",
    statutConvocation:"Statut de la convocation",
    // Gestion RH, accueil, pénibilité
    managerId:"Responsable (identifiant)", dateEntree:"Date d'entrée", actif:"Actif", periode:"Période", heures:"Heures",
    typeAccueil:"Type d'accueil", dateArrivee:"Date d'arrivée", dateCloture:"Accueil réalisé le", referent:"Référent", modeleNom:"Modèle",
    posteId:"Poste (identifiant)", intitule:"Intitulé", annee:"Année",
    // Formation, EPI
    typeHabilitation:"Type d'habilitation", organismeFormateur:"Organisme de formation", dateObtention:"Date d'obtention",
    dureeValiditeMois:"Durée de validité (mois)", dateExpiration:"Date d'expiration",
    articleId:"Article (identifiant)", taille:"Taille", dateRemise:"Date de remise", dateRenouvellement:"Date de renouvellement",
    dotationId:"Dotation (identifiant)", dateLavage:"Date de lavage", nombreLavagesCumules:"Lavages cumulés",
    // Registre santé & sécurité, dialogue social
    gravite:"Gravité", suiteDonnee:"Suite donnée", traitePar:"Traité par",
    objet:"Objet", messages:"Échanges", close:"Close", participants:"Participants", ordreDuJour:"Ordre du jour",
    compteRendu:"Compte rendu", constats:"Constats", direction:"Direction",
    // Entreprises extérieures, exercices, inspections
    entrepriseNom:"Entreprise", entrepriseContact:"Contact", natureIntervention:"Nature de l'intervention",
    dateDebut:"Date de début", dateFin:"Date de fin", heuresEstimees:"Heures estimées", travauxDangereux:"Travaux dangereux",
    inspection:"Inspection commune préalable", planPrevention:"Plan de prévention", constatations:"Constatations",
    dateExercice:"Date de l'exercice", dureeMinutes:"Durée (minutes)", participation:"Participation",
    consignes:"Consignes de sécurité", alerte:"Donner l'alerte", contacts:"Numéros d'urgence",
    rassemblement:"Points de rassemblement", designes:"Personnes désignées", moyens:"Moyens de secours",
    dateRevue:"Dernière revue du plan", numero:"Numéro", personne:"Personne", telephone:"Téléphone",
    emplacement:"Emplacement", quantite:"Quantité",
    dateInspection:"Date de l'inspection", inspecteur:"Inspecteur", trameId:"Grille (identifiant)", trameNom:"Grille",
    reponses:"Réponses", statutGlobal:"Statut global",
    // Document unique, produits, vérifications, documentation
    taches:"Tâches", danger:"Danger", frequence:"Fréquence", moyensPrevention:"Moyens de prévention existants",
    mesuresProposees:"Mesures de prévention proposées", maitrise:"Maîtrise du risque",
    fournisseur:"Fournisseur", quantiteStockee:"Quantité stockée", unite:"Unité", pictogrammes:"Pictogrammes",
    dateMajFDS:"Mise à jour de la fiche de données de sécurité", lienFDS:"Fiche de données de sécurité", mesuresPrevention:"Mesures de prévention",
    equipement:"Équipement", organisme:"Organisme", conformite:"Conformité",
    theme:"Thème", motsCles:"Mots-clés", contenu:"Contenu", resume:"Résumé"
  };
  // Même nom de champ, autre sens selon le registre
  var PAR_REGISTRE = {
    vigie_hse_dataset:      { nature:"Nature de la lésion", statut:"Statut de l'agent" },
    vigie_hse_rh_log:       { record:"Déclaration" },
    vigie_hse_visites:      { dateDerniere:"Date de la dernière visite" },
    vigie_hse_verifications:{ dateDerniere:"Date de la dernière vérification" },
    vigie_hse_rsst:         { nature:"Nature de l'observation" },
    vigie_hse_audit_log:    { type:"Type d'action" }
  };
  function decouper(champ){
    var s = String(champ).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ").toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function libelle(cle, champ){
    // l'entrée de l'organisation : le mot choisi dans Administration (« Collectivité », « Site »…)
    if (champ === "collectivite" && window.VigieOrga) return VigieOrga.libelle();
    var p = PAR_REGISTRE[cle];
    if (p && Object.prototype.hasOwnProperty.call(p, champ)) return p[champ];
    if (Object.prototype.hasOwnProperty.call(COMMUNS, champ)) return COMMUNS[champ];
    return decouper(champ);
  }
  function valeur(v){
    if (v === true) return "Oui";
    if (v === false) return "Non";
    if (v == null) return "";
    if (Array.isArray(v) && v.every(function(x){ return x == null || typeof x !== "object"; })) return v.join(", ");
    if (typeof v === "object") return JSON.stringify(v);
    var s = String(v), m;
    // date calendaire « AAAA-MM-JJ » : réécrite telle quelle, sans passer par Date (pas de décalage UTC)
    if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s))) return m[3] + "/" + m[2] + "/" + m[1];
    // horodatage complet (journal d'audit) : à l'heure locale
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(s)){
      var d = new Date(s), deux = function(n){ return (n < 10 ? "0" : "") + n; };
      if (!isNaN(d)) return deux(d.getDate()) + "/" + deux(d.getMonth() + 1) + "/" + d.getFullYear() + " " + deux(d.getHours()) + ":" + deux(d.getMinutes());
    }
    return s;
  }
  window.VigieLibelles = { libelle: libelle, valeur: valeur, COMMUNS: COMMUNS, PAR_REGISTRE: PAR_REGISTRE };
})();
