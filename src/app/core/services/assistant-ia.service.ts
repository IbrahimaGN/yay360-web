import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AssistantChatRequest,
  AssistantChatResponse,
} from '../models/assistant-ia.model';

@Injectable({ providedIn: 'root' })
export class AssistantIaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/assistant-ia`;

  discuter(request: AssistantChatRequest): Observable<AssistantChatResponse> {
    return this.http.post<AssistantChatResponse>(`${this.baseUrl}/chat`, request);
  }
}
