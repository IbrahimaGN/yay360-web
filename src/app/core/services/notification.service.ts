import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationDto } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  lister(): Observable<NotificationDto[]> {
    return this.http.get<NotificationDto[]>(this.baseUrl);
  }

  marquerLue(id: number): Observable<NotificationDto> {
    return this.http.put<NotificationDto>(`${this.baseUrl}/${id}/lue`, {});
  }

  toutMarquerLu(): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/tout-marquer-lu`, {});
  }
}
