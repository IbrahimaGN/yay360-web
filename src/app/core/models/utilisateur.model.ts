export type Role = 'ADMIN' | 'ADMIN_ETABLISSEMENT' | 'FEMME_ENCEINTE' | 'CONJOINT' | 'SAGE_FEMME' | 'MEDECIN';

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
  /** Établissement géré (administrateur d'établissement uniquement). */
  etablissementAdministreId?: number | null;
  etablissementAdministreNom?: string | null;
}

/** Rôles qu'un administrateur peut créer (les patientes s'inscrivent elles-mêmes). */
export type RoleProfessionnel = 'MEDECIN' | 'SAGE_FEMME' | 'ADMIN' | 'ADMIN_ETABLISSEMENT';

export interface CreerProfessionnelRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  role: RoleProfessionnel;
  /** Obligatoire pour un administrateur d'établissement ; ignoré si l'auteur est lui-même administrateur d'établissement. */
  etablissementId?: number;
}

export interface CreationProfessionnelResponse {
  utilisateur: Utilisateur;
  /** Affiché une seule fois à l'administrateur ; null si un email l'a transmis. */
  motDePasseTemporaire: string | null;
  emailEnvoye: boolean;
}
