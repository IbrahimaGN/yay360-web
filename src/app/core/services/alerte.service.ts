import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AlerteDto,
  DeclarerSymptomeRequest,
  PriseEnChargeRequest,
  StatutAlerte,
} from '../models/alerte.model';

@Injectable({ providedIn: 'root' })
export class AlerteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/alertes`;

  listerParStatut(statut: StatutAlerte): Observable<AlerteDto[]> {
    return this.http.get<AlerteDto[]>(this.baseUrl, { params: { statut } });
  }

  mesAlertes(): Observable<AlerteDto[]> {
    return this.http.get<AlerteDto[]>(`${this.baseUrl}/mes-alertes`);
  }

  declarer(request: DeclarerSymptomeRequest): Observable<AlerteDto> {
    return this.http.post<AlerteDto>(this.baseUrl, request);
  }

  listerUrgentes(): Observable<AlerteDto[]> {
    return this.http.get<AlerteDto[]>(`${this.baseUrl}/urgentes`);
  }

  obtenirParId(id: number): Observable<AlerteDto> {
    return this.http.get<AlerteDto>(`${this.baseUrl}/${id}`);
  }

  prendreEnCharge(id: number): Observable<AlerteDto> {
    return this.http.put<AlerteDto>(`${this.baseUrl}/${id}/prendre-en-charge`, {});
  }

  resoudre(id: number, request: PriseEnChargeRequest): Observable<AlerteDto> {
    return this.http.put<AlerteDto>(`${this.baseUrl}/${id}/resoudre`, request);
  }
}
