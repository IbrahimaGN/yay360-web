export interface ConsultationDto {
  id: number;
  grossesseId: number;
  femmeEnceinteId: number;
  femmeEnceinteNomComplet: string;
  professionnelId: number;
  professionnelNomComplet: string;
  rendezVousId: number | null;
  etablissementNom: string | null;
  dateConsultation: string;

  poidsKg: number | null;
  tensionArterielle: string | null;
  temperatureC: number | null;
  hauteurUterineCm: number | null;
  battementsCoeurFoetal: number | null;

  observations: string | null;
  diagnostic: string | null;
  traitement: string | null;
  prescriptions: string | null;
  dateCreation: string;
  /** Signaux détectés automatiquement par le moteur de règles sur les constantes. */
  signauxCliniques: string[];
}

export interface EnregistrerConsultationRequest {
  grossesseId: number;
  rendezVousId?: number | null;
  etablissementId?: number | null;
  poidsKg?: number | null;
  tensionArterielle?: string | null;
  temperatureC?: number | null;
  hauteurUterineCm?: number | null;
  battementsCoeurFoetal?: number | null;
  observations?: string | null;
  diagnostic?: string | null;
  traitement?: string | null;
  prescriptions?: string | null;
}
