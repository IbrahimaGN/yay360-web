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

/** Rôles qu'un administrateur peut créer (les patientes s'inscrivent elles-mêmes). */
export type RoleProfessionnel = 'MEDECIN' | 'SAGE_FEMME' | 'ADMIN';

export interface CreerProfessionnelRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  role: RoleProfessionnel;
}

export interface CreationProfessionnelResponse {
  utilisateur: Utilisateur;
  /** Affiché une seule fois à l'administrateur ; null si un email l'a transmis. */
  motDePasseTemporaire: string | null;
  emailEnvoye: boolean;
}
