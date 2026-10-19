export type NiveauGravite = 'URGENT' | 'ELEVE' | 'MODERE';
export type StatutAlerte = 'NOUVELLE' | 'PRISE_EN_CHARGE' | 'RESOLUE';

export interface AlerteDto {
  id: number;
  grossesseId: number;
  femmeEnceinteId: number;
  femmeEnceinteNomComplet: string;
  femmeEnceinteTelephone: string | null;
  typeSymptome: string;
  description: string | null;
  niveauGravite: NiveauGravite;
  statut: StatutAlerte;
  professionnelNomComplet: string | null;
  notesPriseEnCharge: string | null;
  dateDeclaration: string;
  dateResolution: string | null;
  recommandation: string;
  avertissement: string;
}

export interface PriseEnChargeRequest {
  notesPriseEnCharge?: string;
}

export interface DeclarerSymptomeRequest {
  typeSymptome: string;
  grossesseId?: number;
  description?: string | null;
}
