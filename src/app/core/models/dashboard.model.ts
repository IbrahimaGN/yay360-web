export interface ActiviteEtablissement {
  etablissementId: number;
  nom: string;
  ville: string | null;
  nombreRendezVous: number;
}

export interface DashboardDto {
  nombreFemmesEnceintes: number;
  nombreMedecins: number;
  nombreSagesFemmes: number;
  nombreAdmins: number;

  nombreGrossessesActives: number;
  nombreGrossessesTerminees: number;
  nombreGrossessesInterrompues: number;
  /** Grossesses à risque EN COURS (les grossesses clôturées ne sont pas comptées). */
  nombreGrossessesARisque: number;
  repartitionGrossessesParTrimestre: Record<string, number>;

  nombreConsultations: number;
  nombreRendezVous: number;
  repartitionRendezVousParStatut: Record<string, number>;

  nombreAlertesNouvelles: number;
  nombreAlertesPrisesEnCharge: number;
  nombreAlertesResolues: number;
  /** Alertes urgentes non résolues. */
  nombreAlertesUrgentes: number;
  repartitionAlertesNonResoluesParGravite: Record<string, number>;

  // --- Indicateurs de pilotage (cahier des charges §4.8) ---
  /** Grossesses à risque en cours / grossesses en cours, en %. */
  ratioGrossessesARisque: number;
  /** Alertes résolues / alertes déclarées, en %. */
  tauxResolutionAlertes: number;
  /** Délai moyen déclaration → prise en charge, en minutes (null si aucune donnée). */
  delaiMoyenPriseEnChargeMinutes: number | null;

  nombreEtablissementsActifs: number;
  activiteEtablissements: ActiviteEtablissement[];

  dateGeneration: string;
}
