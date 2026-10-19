export type StatutRendezVous = 'PLANIFIE' | 'CONFIRME' | 'TERMINE' | 'ANNULE' | 'ABSENT';

export interface RendezVousDto {
  id: number;
  grossesseId: number;
  femmeEnceinteId: number;
  femmeEnceinteNomComplet: string;
  professionnelId: number | null;
  professionnelNomComplet: string | null;
  etablissementId: number | null;
  etablissementNom: string | null;
  dateHeure: string;
  type: string;
  statut: StatutRendezVous;
  motif: string | null;
  notesAnnulation: string | null;
  dateCreation: string;
}

export interface ChangerStatutRendezVousRequest {
  statut: StatutRendezVous;
}

export interface AnnulerRendezVousRequest {
  notesAnnulation?: string;
}

export interface PrendreRendezVousRequest {
  dateHeure: string;
  grossesseId?: number;
  type: string;
  professionnelId?: number | null;
  etablissementId?: number | null;
  motif?: string | null;
}
