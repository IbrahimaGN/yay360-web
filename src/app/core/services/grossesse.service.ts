import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CalendrierGrossesseDto,
  DeclarerGrossesseRequest,
  DeclarerRisqueRequest,
  ChoisirEtablissementRequest,
  EvaluationRisqueDto,
  GrossesseDto,
  PatienteRechercheDto,
  PlanCpnDto,
  RattacherGrossesseRequest,
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

  /** La patiente choisit ou change son établissement de suivi. */
  choisirEtablissement(request: ChoisirEtablissementRequest): Observable<GrossesseDto> {
    return this.http.put<GrossesseDto>(`${this.baseUrl}/ma-grossesse/etablissement`, request);
  }

  /** Recherche exacte (téléphone OU email) d'une patiente qui se présente. */
  rechercher(critere: { telephone: string } | { email: string }): Observable<PatienteRechercheDto[]> {
    return this.http.get<PatienteRechercheDto[]>(`${this.baseUrl}/recherche`, { params: critere });
  }

  rattacher(id: number, request: RattacherGrossesseRequest): Observable<GrossesseDto> {
    return this.http.put<GrossesseDto>(`${this.baseUrl}/${id}/rattacher`, request);
  }

  monPlanCpn(): Observable<PlanCpnDto> {
    return this.http.get<PlanCpnDto>(`${this.baseUrl}/mon-plan-cpn`);
  }

  planCpn(id: number): Observable<PlanCpnDto> {
    return this.http.get<PlanCpnDto>(`${this.baseUrl}/${id}/plan-cpn`);
  }

  evaluationRisque(id: number): Observable<EvaluationRisqueDto> {
    return this.http.get<EvaluationRisqueDto>(`${this.baseUrl}/${id}/evaluation-risque`);
  }
}
