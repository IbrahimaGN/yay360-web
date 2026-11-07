import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InvitationConjointResponse } from '../models/famille.model';

@Injectable({ providedIn: 'root' })
export class FamilleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/famille`;

  inviterConjoint(email: string): Observable<InvitationConjointResponse> {
    return this.http.post<InvitationConjointResponse>(`${this.baseUrl}/inviter-conjoint`, { email });
  }
}
