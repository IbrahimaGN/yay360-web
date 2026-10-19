import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CalendrierGrossesseDto,
  DeclarerGrossesseRequest,
  DeclarerRisqueRequest,
  GrossesseDto,
  SuiviHebdomadaireDto,
  TerminerGrossesseRequest,
} from '../models/grossesse.model';

@Injectable({ providedIn: 'root' })
export class GrossesseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/grossesses`;

  listerActives(): Observable<GrossesseDto[]> {
    return this.http.get<GrossesseDto[]>(this.baseUrl);
  }

  obtenirMaGrossesse(): Observable<GrossesseDto> {
    return this.http.get<GrossesseDto>(`${this.baseUrl}/ma-grossesse`);
  }

  declarer(request: DeclarerGrossesseRequest): Observable<GrossesseDto> {
    return this.http.post<GrossesseDto>(this.baseUrl, request);
  }

  obtenirMonHistorique(): Observable<GrossesseDto[]> {
    return this.http.get<GrossesseDto[]>(`${this.baseUrl}/mon-historique`);
  }

  obtenirMonCalendrier(): Observable<CalendrierGrossesseDto> {
    return this.http.get<CalendrierGrossesseDto>(`${this.baseUrl}/mon-calendrier`);
  }

  obtenirMonSuivi(): Observable<SuiviHebdomadaireDto> {
    return this.http.get<SuiviHebdomadaireDto>(`${this.baseUrl}/mon-suivi`);
  }

  listerARisque(): Observable<GrossesseDto[]> {
    return this.http.get<GrossesseDto[]>(`${this.baseUrl}/a-risque`);
  }

  obtenirParId(id: number): Observable<GrossesseDto> {
    return this.http.get<GrossesseDto>(`${this.baseUrl}/${id}`);
  }

  obtenirCalendrier(id: number): Observable<CalendrierGrossesseDto> {
    return this.http.get<CalendrierGrossesseDto>(`${this.baseUrl}/${id}/calendrier`);
  }

  obtenirSuivi(id: number): Observable<SuiviHebdomadaireDto> {
    return this.http.get<SuiviHebdomadaireDto>(`${this.baseUrl}/${id}/suivi`);
  }

  declarerARisque(id: number, request: DeclarerRisqueRequest): Observable<GrossesseDto> {
    return this.http.put<GrossesseDto>(`${this.baseUrl}/${id}/risque`, request);
  }

  retirerRisque(id: number): Observable<GrossesseDto> {
    return this.http.put<GrossesseDto>(`${this.baseUrl}/${id}/risque/retirer`, {});
  }

  terminer(id: number, request: TerminerGrossesseRequest): Observable<GrossesseDto> {
    return this.http.put<GrossesseDto>(`${this.baseUrl}/${id}/terminer`, request);
  }
}
