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
  nombreGrossessesARisque: number;
  repartitionGrossessesParTrimestre: Record<string, number>;

  nombreConsultations: number;
  nombreRendezVous: number;
  repartitionRendezVousParStatut: Record<string, number>;

  nombreAlertesNouvelles: number;
  nombreAlertesPrisesEnCharge: number;
  nombreAlertesResolues: number;
  nombreAlertesUrgentes: number;

  nombreEtablissementsActifs: number;
  activiteEtablissements: ActiviteEtablissement[];

  dateGeneration: string;
}
