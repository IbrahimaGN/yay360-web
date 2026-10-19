import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AnnulerRendezVousRequest,
  ChangerStatutRendezVousRequest,
  PrendreRendezVousRequest,
  RendezVousDto,
  StatutRendezVous,
} from '../models/rendez-vous.model';

@Injectable({ providedIn: 'root' })
export class RendezVousService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/rendez-vous`;

  monPlanning(): Observable<RendezVousDto[]> {
    return this.http.get<RendezVousDto[]>(`${this.baseUrl}/mon-planning`);
  }

  mesRendezVous(): Observable<RendezVousDto[]> {
    return this.http.get<RendezVousDto[]>(`${this.baseUrl}/mes-rendez-vous`);
  }

  prendre(request: PrendreRendezVousRequest): Observable<RendezVousDto> {
    return this.http.post<RendezVousDto>(this.baseUrl, request);
  }

  listerParStatut(statut: StatutRendezVous): Observable<RendezVousDto[]> {
    return this.http.get<RendezVousDto[]>(this.baseUrl, { params: { statut } });
  }

  listerParGrossesse(grossesseId: number): Observable<RendezVousDto[]> {
    return this.http.get<RendezVousDto[]>(`${this.baseUrl}/grossesse/${grossesseId}`);
  }

  obtenirParId(id: number): Observable<RendezVousDto> {
    return this.http.get<RendezVousDto>(`${this.baseUrl}/${id}`);
  }

  changerStatut(id: number, request: ChangerStatutRendezVousRequest): Observable<RendezVousDto> {
    return this.http.put<RendezVousDto>(`${this.baseUrl}/${id}/statut`, request);
  }

  annuler(id: number, request: AnnulerRendezVousRequest = {}): Observable<RendezVousDto> {
    return this.http.put<RendezVousDto>(`${this.baseUrl}/${id}/annuler`, request);
  }
}
