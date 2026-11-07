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

/** Statuts qu'un soignant peut appliquer (ANNULE, TERMINE et ABSENT sont finaux). */
export type StatutCibleRendezVous = 'CONFIRME' | 'ANNULE' | 'TERMINE' | 'ABSENT';

export interface ChangerStatutRendezVousRequest {
  statut: StatutCibleRendezVous;
}

/** Rendez-vous planifié par un soignant pour une patiente qu'il suit. */
export interface PlanifierRendezVousRequest {
  grossesseId: number;
  dateHeure: string;
  type: string;
  etablissementId?: number | null;
  motif?: string | null;
}

export interface ModifierRendezVousRequest {
  dateHeure: string;
  motif?: string | null;
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
