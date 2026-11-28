import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AffecterProfessionnelRequest,
  EtablissementDto,
  EtablissementRequest,
} from '../models/etablissement.model';

@Injectable({ providedIn: 'root' })
export class EtablissementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/etablissements`;

  /** Établissements actifs (tout utilisateur connecté), éventuellement filtrés par ville. */
  listerActifs(ville?: string): Observable<EtablissementDto[]> {
    return this.http.get<EtablissementDto[]>(this.baseUrl, ville ? { params: { ville } } : {});
  }

  /** Établissements où exerce le soignant connecté. */
  mesEtablissements(): Observable<EtablissementDto[]> {
    return this.http.get<EtablissementDto[]>(`${this.baseUrl}/mes-etablissements`);
  }

  listerTous(): Observable<EtablissementDto[]> {
    return this.http.get<EtablissementDto[]>(`${this.baseUrl}/tous`);
  }

  obtenirParId(id: number): Observable<EtablissementDto> {
    return this.http.get<EtablissementDto>(`${this.baseUrl}/${id}`);
  }

  creer(request: EtablissementRequest): Observable<EtablissementDto> {
    return this.http.post<EtablissementDto>(this.baseUrl, request);
  }

  mettreAJour(id: number, request: EtablissementRequest): Observable<EtablissementDto> {
    return this.http.put<EtablissementDto>(`${this.baseUrl}/${id}`, request);
  }

  affecterProfessionnel(id: number, request: AffecterProfessionnelRequest): Observable<EtablissementDto> {
    return this.http.post<EtablissementDto>(`${this.baseUrl}/${id}/professionnels`, request);
  }

  retirerProfessionnel(id: number, professionnelId: number): Observable<EtablissementDto> {
    return this.http.delete<EtablissementDto>(`${this.baseUrl}/${id}/professionnels/${professionnelId}`);
  }

  desactiver(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/desactiver`, {});
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
