export interface EtablissementDto {
  id: number;
  nom: string;
  type: string;
  adresse: string;
  ville: string | null;
  telephone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  actif: boolean;
  professionnels: string[];
}

export interface EtablissementRequest {
  nom: string;
  type: string;
  adresse: string;
  ville?: string;
  telephone: string;
  email?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface AffecterProfessionnelRequest {
  professionnelId: number;
}

export const TYPES_ETABLISSEMENT = [
  { value: 'HOPITAL', label: 'Hôpital' },
  { value: 'CLINIQUE', label: 'Clinique' },
  { value: 'CENTRE_DE_SANTE', label: 'Centre de santé' },
  { value: 'POSTE_DE_SANTE', label: 'Poste de santé' },
];
