import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse } from '../models/auth.model';
import { Role, Utilisateur } from '../models/utilisateur.model';

export interface CreerCompteRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone: string;
  dateNaissance: string;
  role: Role;
}

export interface UpdateProfileRequest {
  nom: string;
  prenom: string;
  telephone: string;
}

@Injectable({ providedIn: 'root' })
export class UtilisateurService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/utilisateurs`;
  private readonly authUrl = `${environment.apiUrl}/auth`;

  listerTous(role?: Role): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(this.baseUrl, role ? { params: { role } } : {});
  }

  obtenirParId(id: number): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.baseUrl}/${id}`);
  }

  activer(id: number): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.baseUrl}/${id}/activer`, {});
  }

  desactiver(id: number): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.baseUrl}/${id}/desactiver`, {});
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crée un compte via /auth/register SANS passer par AuthService,
   * pour ne pas remplacer la session de l'admin actuellement connecté
   * (l'endpoint public renvoie normalement un token de connexion).
   */
  creerCompte(request: CreerCompteRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/register`, request);
  }

  obtenirMonProfil(): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.baseUrl}/profil`);
  }

  mettreAJourMonProfil(request: UpdateProfileRequest): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.baseUrl}/profil`, request);
  }
}
