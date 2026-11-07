import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationDto } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  /** Émis après un changement d'état de lecture : le compteur de la barre se met à jour. */
  readonly changement$ = new Subject<void>();

  compterNonLues(): Observable<{ nombre: number }> {
    return this.http.get<{ nombre: number }>(`${this.baseUrl}/non-lues/nombre`);
  }

  lister(): Observable<NotificationDto[]> {
    return this.http.get<NotificationDto[]>(this.baseUrl);
  }

  marquerLue(id: number): Observable<NotificationDto> {
    return this.http.put<NotificationDto>(`${this.baseUrl}/${id}/lue`, {}).pipe(tap(() => this.changement$.next()));
  }

  toutMarquerLu(): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/tout-marquer-lu`, {}).pipe(tap(() => this.changement$.next()));
  }
}
