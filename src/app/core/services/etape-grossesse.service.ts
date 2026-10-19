import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EtapeGrossesseDto, EtapeGrossesseRequest } from '../models/etape-grossesse.model';

@Injectable({ providedIn: 'root' })
export class EtapeGrossesseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/etapes-grossesse`;

  listerToutes(): Observable<EtapeGrossesseDto[]> {
    return this.http.get<EtapeGrossesseDto[]>(this.baseUrl);
  }

  creer(request: EtapeGrossesseRequest): Observable<EtapeGrossesseDto> {
    return this.http.post<EtapeGrossesseDto>(this.baseUrl, request);
  }

  mettreAJour(id: number, request: EtapeGrossesseRequest): Observable<EtapeGrossesseDto> {
    return this.http.put<EtapeGrossesseDto>(`${this.baseUrl}/${id}`, request);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
