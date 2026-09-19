// Table des types d'habilitation & durées de validité standard, partagée entre
// formation-habilitation.html (référentiel source) et sante-visites.html (plafond de
// périodicité pour la « surveillance renforcée », Q4 du Cahier du préventeur, répondue
// le 2026-09-16).
window.VigieHabilitations = {
  HAB_TYPES: [
    ["CACES", 60],
    ["Habilitation électrique", 36],
    ["SST (Sauveteur Secouriste du Travail)", 24],
    ["Permis de conduire poids lourd / remorque", 60],
    ["AIPR (Autorisation d'Intervention à Proximité des Réseaux)", 60],
    ["Habilitation travail en hauteur", 12],
  ],
  get HAB_DUREE(){ return Object.fromEntries(this.HAB_TYPES); },
};
