// Formule TF/TG partagée entre reporting.html et registre-at-mp.html (Question 2 du Cahier
// du préventeur, répondue le 2026-09-15, option B : prorata de la durée réelle de la période).
// Chaque page reste responsable du calcul de sa propre durée (dureeAtJours) — les bornes de
// période ne se déterminent pas de la même façon selon la page (filtres de dates libres ici,
// filtre par année là) — seule la formule finale, identique, est mutualisée ici.
window.VigieFormules = {
  EFFECTIF: 850,
  HEURES_AN: 1607,
  heuresTravaillees(dureeAtJours){
    return this.EFFECTIF * this.HEURES_AN * (dureeAtJours / 365);
  },
  tauxFrequence(atAvecArret, dureeAtJours){
    const heures = this.heuresTravaillees(dureeAtJours);
    return heures ? (atAvecArret * 1000000 / heures) : 0;
  },
  tauxGravite(joursArretSum, dureeAtJours){
    const heures = this.heuresTravaillees(dureeAtJours);
    return heures ? (joursArretSum * 1000 / heures) : 0;
  },
};
