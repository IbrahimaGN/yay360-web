import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConseilDto } from '../models/grossesse.model';
import { ConseilRequest } from '../models/conseil-request.model';

@Injectable({ providedIn: 'root' })
export class ConseilService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/conseils`;

  listerTous(): Observable<ConseilDto[]> {
    return this.http.get<ConseilDto[]>(this.baseUrl);
  }

  creer(request: ConseilRequest): Observable<ConseilDto> {
    return this.http.post<ConseilDto>(this.baseUrl, request);
  }

  mettreAJour(id: number, request: ConseilRequest): Observable<ConseilDto> {
    return this.http.put<ConseilDto>(`${this.baseUrl}/${id}`, request);
  }

  basculerActivation(id: number): Observable<ConseilDto> {
    return this.http.put<ConseilDto>(`${this.baseUrl}/${id}/basculer-activation`, {});
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
