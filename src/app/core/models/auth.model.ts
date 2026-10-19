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
