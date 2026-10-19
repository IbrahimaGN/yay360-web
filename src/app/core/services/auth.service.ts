import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AccepterInvitationConjointRequest,
  LoginRequest,
  LoginResponse,
} from '../models/auth.model';
import { Role } from '../models/utilisateur.model';

const STORAGE_KEY = 'yay360.session';

interface Session {
  token: string;
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly sessionSignal = signal<Session | null>(this.lireSessionStockee());

  readonly session = this.sessionSignal.asReadonly();
  readonly estConnecte = computed(() => this.sessionSignal() !== null);
  readonly role = computed(() => this.sessionSignal()?.role ?? null);
  readonly nomComplet = computed(() => {
    const s = this.sessionSignal();
    return s ? `${s.prenom} ${s.nom}` : '';
  });

  constructor(private readonly http: HttpClient) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, request).pipe(
      tap((reponse) => this.demarrerSession(reponse))
    );
  }

  accepterInvitationConjoint(
    request: AccepterInvitationConjointRequest
  ): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/accept-invitation-conjoint`, request)
      .pipe(tap((reponse) => this.demarrerSession(reponse)));
  }

  logout(): void {
    this.sessionSignal.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  motDePasseOublie(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/forgot-password`, { email });
  }

  reinitialiserMotDePasse(token: string, nouveauMotDePasse: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/reset-password`, {
      token,
      nouveauMotDePasse,
    });
  }

  changerMotDePasse(ancienMotDePasse: string, nouveauMotDePasse: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/change-password`, {
      ancienMotDePasse,
      nouveauMotDePasse,
    });
  }

  get token(): string | null {
    return this.sessionSignal()?.token ?? null;
  }

  hasRole(...roles: Role[]): boolean {
    const r = this.role();
    return r !== null && roles.includes(r);
  }

  private demarrerSession(reponse: LoginResponse): void {
    const session: Session = {
      token: reponse.token,
      id: reponse.id,
      email: reponse.email,
      nom: reponse.nom,
      prenom: reponse.prenom,
      role: reponse.role,
    };
    this.sessionSignal.set(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  private lireSessionStockee(): Session | null {
    const brut = localStorage.getItem(STORAGE_KEY);
    if (!brut) {
      return null;
    }
    try {
      return JSON.parse(brut) as Session;
    } catch {
      return null;
    }
  }
}
