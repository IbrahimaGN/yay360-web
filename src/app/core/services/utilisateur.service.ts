import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreationProfessionnelResponse, CreerProfessionnelRequest, Role, Utilisateur } from '../models/utilisateur.model';

export interface UpdateProfileRequest {
  nom: string;
  prenom: string;
  telephone: string;
}

@Injectable({ providedIn: 'root' })
export class UtilisateurService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/utilisateurs`;

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
   * Création d'un compte médecin, sage-femme ou administrateur (réservé à l'admin).
   * Le mot de passe temporaire n'est renvoyé que si aucun email n'a pu le transmettre.
   */
  creerProfessionnel(request: CreerProfessionnelRequest): Observable<CreationProfessionnelResponse> {
    return this.http.post<CreationProfessionnelResponse>(`${this.baseUrl}/professionnels`, request);
  }

  obtenirMonProfil(): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.baseUrl}/profil`);
  }

  mettreAJourMonProfil(request: UpdateProfileRequest): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.baseUrl}/profil`, request);
  }
}
