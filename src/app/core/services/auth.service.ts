import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AccepterInvitationConjointRequest,
  ChangementMotDePasseResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
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
  motDePasseTemporaire: boolean;
}

interface ChargeJwt {
  sub?: string;
  role?: Role;
  exp?: number;
}

/**
 * Session utilisateur. Le rôle et l'expiration sont lus dans le JWT lui-même (signé par
 * le serveur) et non dans le JSON stocké : modifier le stockage local ne change rien.
 * Le serveur reste l'autorité : ces informations ne servent qu'à adapter l'interface.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly sessionSignal = signal<Session | null>(this.lireSessionStockee());

  readonly session = this.sessionSignal.asReadonly();
  readonly estConnecte = computed(() => this.sessionSignal() !== null);
  readonly role = computed(() => this.sessionSignal()?.role ?? null);
  readonly doitChangerMotDePasse = computed(() => this.sessionSignal()?.motDePasseTemporaire === true);
  readonly nomComplet = computed(() => {
    const s = this.sessionSignal();
    return s ? `${s.prenom} ${s.nom}` : '';
  });

  constructor(private readonly http: HttpClient) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/login`, request)
      .pipe(tap((reponse) => this.demarrerSession(reponse)));
  }

  inscrire(request: RegisterRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/register`, request)
      .pipe(tap((reponse) => this.demarrerSession(reponse)));
  }

  accepterInvitationConjoint(request: AccepterInvitationConjointRequest): Observable<LoginResponse> {
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
    return this.http.post<{ message: string }>(`${this.baseUrl}/reset-password`, { token, nouveauMotDePasse });
  }

  /** Le serveur révoque les anciens jetons : on enregistre immédiatement le nouveau. */
  changerMotDePasse(ancienMotDePasse: string, nouveauMotDePasse: string): Observable<ChangementMotDePasseResponse> {
    return this.http
      .put<ChangementMotDePasseResponse>(`${this.baseUrl}/change-password`, { ancienMotDePasse, nouveauMotDePasse })
      .pipe(
        tap((reponse) => {
          const s = this.sessionSignal();
          if (s) {
            this.enregistrer({ ...s, token: reponse.token, motDePasseTemporaire: false });
          }
        })
      );
  }

  /** Après modification du profil : le nom affiché dans l'interface suit. */
  mettreAJourIdentite(nom: string, prenom: string): void {
    const s = this.sessionSignal();
    if (s) {
      this.enregistrer({ ...s, nom, prenom });
    }
  }

  /** Signalé par le serveur (403 « Mot de passe temporaire ») pour une session déjà ouverte. */
  marquerMotDePasseTemporaire(): void {
    const s = this.sessionSignal();
    if (s && !s.motDePasseTemporaire) {
      this.enregistrer({ ...s, motDePasseTemporaire: true });
    }
  }

  get token(): string | null {
    const s = this.sessionSignal();
    if (s && AuthService.estExpire(s.token)) {
      this.logout();
      return null;
    }
    return s?.token ?? null;
  }

  hasRole(...roles: Role[]): boolean {
    const r = this.role();
    return r !== null && roles.includes(r);
  }

  private demarrerSession(reponse: LoginResponse): void {
    this.enregistrer({
      token: reponse.token,
      id: reponse.id,
      email: reponse.email,
      nom: reponse.nom,
      prenom: reponse.prenom,
      role: AuthService.lireCharge(reponse.token)?.role ?? reponse.role,
      motDePasseTemporaire: reponse.motDePasseTemporaire === true,
    });
  }

  private enregistrer(session: Session): void {
    this.sessionSignal.set(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  private lireSessionStockee(): Session | null {
    try {
      const brut = localStorage.getItem(STORAGE_KEY);
      if (!brut) {
        return null;
      }
      const session = JSON.parse(brut) as Session;
      const charge = AuthService.lireCharge(session.token);
      if (!charge?.role || AuthService.estExpire(session.token)) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      // Le rôle fait foi depuis le jeton signé, pas depuis le JSON modifiable
      return { ...session, role: charge.role, motDePasseTemporaire: session.motDePasseTemporaire === true };
    } catch {
      return null;
    }
  }

  static lireCharge(token: string | undefined): ChargeJwt | null {
    try {
      const partie = token?.split('.')[1];
      if (!partie) {
        return null;
      }
      const base64 = partie.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json) as ChargeJwt;
    } catch {
      return null;
    }
  }

  static estExpire(token: string | undefined): boolean {
    const exp = AuthService.lireCharge(token)?.exp;
    return exp === undefined || exp * 1000 <= Date.now();
  }
}
