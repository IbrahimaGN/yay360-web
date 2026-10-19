export interface EtapeGrossesseDto {
  id: number;
  semaine: number;
  trimestre: string;
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
}

export const DUREE_GROSSESSE_SEMAINES = 40;

export interface EtapeGrossesseRequest {
  semaine: number;
  developpementBebe?: string | null;
  changementsMere?: string | null;
  objectifsSante?: string | null;
  conseilsAlimentation?: string | null;
  conseilsHydratation?: string | null;
  exercicesPhysiques?: string | null;
  conseilsSommeil?: string | null;
  precautions?: string | null;
  examensRecommandes?: string | null;
  signesAlerte?: string | null;
}

export const CATEGORIES_CONSEIL = [
  { value: 'NUTRITION', label: 'Nutrition' },
  { value: 'ACTIVITE_PHYSIQUE', label: 'Activité physique' },
  { value: 'SOMMEIL', label: 'Sommeil' },
  { value: 'PREVENTION', label: 'Prévention' },
  { value: 'PREPARATION_ACCOUCHEMENT', label: 'Préparation accouchement' },
  { value: 'ALLAITEMENT', label: 'Allaitement' },
  { value: 'SANTE_MENTALE', label: 'Santé mentale' },
];