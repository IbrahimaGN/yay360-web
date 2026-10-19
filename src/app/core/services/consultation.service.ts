import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConsultationDto, EnregistrerConsultationRequest } from '../models/consultation.model';

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/consultations`;

  enregistrer(request: EnregistrerConsultationRequest): Observable<ConsultationDto> {
    return this.http.post<ConsultationDto>(this.baseUrl, request);
  }

  monActivite(): Observable<ConsultationDto[]> {
    return this.http.get<ConsultationDto[]>(`${this.baseUrl}/mon-activite`);
  }

  mesConsultations(): Observable<ConsultationDto[]> {
    return this.http.get<ConsultationDto[]>(`${this.baseUrl}/mes-consultations`);
  }

  parGrossesse(grossesseId: number): Observable<ConsultationDto[]> {
    return this.http.get<ConsultationDto[]>(`${this.baseUrl}/grossesse/${grossesseId}`);
  }

  obtenirParId(id: number): Observable<ConsultationDto> {
    return this.http.get<ConsultationDto>(`${this.baseUrl}/${id}`);
  }
}
