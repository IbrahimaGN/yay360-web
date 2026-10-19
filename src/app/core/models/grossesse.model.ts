export interface GrossesseDto {
  id: number;
  femmeEnceinteId: number;
  femmeEnceinteNomComplet: string;
  dateDernieresRegles: string;
  datePrevueAccouchement: string;
  ageGestationnelJours: number;
  semaineActuelle: number;
  trimestre: string;
  joursRestants: number;
  statut: 'EN_COURS' | 'TERMINEE' | 'INTERROMPUE';
  grossesseARisque: boolean;
  motifRisque: string | null;
  nombreGrossessesPrecedentes: number | null;
  antecedents: string | null;
  dateAccouchementReelle: string | null;
  dateCreation: string;
}

export interface CalendrierSemaineDto {
  semaine: number;
  trimestre: string;
  statutSemaine: 'PASSEE' | 'ACTUELLE' | 'A_VENIR';
  developpementBebe: string | null;
  changementsMere: string | null;
  examensRecommandes: string | null;
  objectifsSante: string | null;
}

export interface CalendrierGrossesseDto {
  grossesseId: number;
  semaineActuelle: number;
  datePrevueAccouchement: string;
  semaines: CalendrierSemaineDto[];
}

export interface ConseilDto {
  id: number;
  semaineDebut: number;
  semaineFin: number;
  trimestre: string;
  categorie: string;
  titre: string;
  contenu: string;
  actif: boolean;
  auteurNomComplet: string | null;
  dateCreation: string;
}

export interface SuiviHebdomadaireDto {
  grossesseId: number;
  semaineActuelle: number;
  trimestre: string;
  ageGestationnelJours: number;
  datePrevueAccouchement: string;
  joursRestants: number;
  grossesseARisque: boolean;
  developpementBebe: string | null;
  changementsMere: string | null;
  objectifsSante: string | null;
  conseilsAlimentation: string | null;
  conseilsHydratation: string | null;
  exercicesPhysiques: string | null;
  conseilsSommeil: string | null;
  precautions: string | null;
  examensRecommandes: string | null;
  signesAlerte: string | null;
  conseilsPersonnalises: ConseilDto[];
  avertissement: string;
}

export interface DeclarerRisqueRequest {
  motif: string;
}

export interface TerminerGrossesseRequest {
  statut: 'TERMINEE' | 'INTERROMPUE';
  dateAccouchementReelle?: string;
}

export interface DeclarerGrossesseRequest {
  dateDernieresRegles: string;
  nombreGrossessesPrecedentes?: number;
  antecedents?: string;
}
