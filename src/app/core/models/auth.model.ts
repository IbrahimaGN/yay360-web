import { Role } from './utilisateur.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  /** Compte créé par un administrateur : le mot de passe doit être changé avant tout usage. */
  motDePasseTemporaire: boolean;
}

/** Réponse au changement de mot de passe : l'ancien jeton est révoqué, il faut utiliser celui-ci. */
export interface ChangementMotDePasseResponse {
  message: string;
  token: string;
}

/** Inscription publique : réservée aux femmes enceintes. */
export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone: string;
  dateNaissance: string;
  role: 'FEMME_ENCEINTE';
}

export interface AccepterInvitationConjointRequest {
  token: string;
  email: string;
  nom: string;
  prenom: string;
  password: string;
  telephone: string;
  dateNaissance: string;
}
