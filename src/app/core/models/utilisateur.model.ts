export type Role = 'ADMIN' | 'FEMME_ENCEINTE' | 'CONJOINT' | 'SAGE_FEMME' | 'MEDECIN';

export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  role: Role;
  actif: boolean;
  dateCreation: string;
}
