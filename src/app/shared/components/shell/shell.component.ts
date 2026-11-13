import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, filter, map, merge, of, startWith, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NavItem } from '../../../core/models/nav-item.model';
import { libelleRole } from '../../../core/utils/libelles';
import { IconComponent } from '../icon/icon.component';

const NAV_ITEMS: NavItem[] = [
  { label: 'Accueil', court: 'Accueil', path: '/accueil', icon: 'home', section: 'general', roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME', 'FEMME_ENCEINTE', 'CONJOINT'] },
  { label: 'Tableau de bord', court: 'Tableau', path: '/tableau-de-bord', icon: 'grid', section: 'general', roles: ['ADMIN'] },
  { label: 'Suivi prénatal', court: 'Suivi', path: '/suivi-prenatal', icon: 'heart', section: 'suivi', roles: ['FEMME_ENCEINTE', 'CONJOINT'] },
  { label: 'Dossier familial', court: 'Famille', path: '/dossier-familial', icon: 'users', section: 'suivi', roles: ['FEMME_ENCEINTE', 'CONJOINT'] },
  { label: 'Grossesses', court: 'Grossesses', path: '/grossesses', icon: 'heart', section: 'suivi', roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
  { label: 'Rendez-vous', court: 'Rendez-vous', path: '/rendez-vous', icon: 'calendar', section: 'suivi', roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
  { label: 'Consultations', court: 'Consultations', path: '/consultations', icon: 'clipboard', section: 'suivi', roles: ['MEDECIN', 'SAGE_FEMME'] },
  { label: 'Alertes', court: 'Alertes', path: '/alertes', icon: 'alert-triangle', section: 'suivi', roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
  { label: 'Établissements', court: 'Structures', path: '/etablissements', icon: 'building', section: 'gestion', roles: ['ADMIN'] },
  { label: 'Conseils & étapes', court: 'Conseils', path: '/conseils', icon: 'book', section: 'gestion', roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
  { label: 'Utilisateurs', court: 'Utilisateurs', path: '/utilisateurs', icon: 'user', section: 'gestion', roles: ['ADMIN'] },
];

const CLE_REPLIE = 'yay360.sidebar.repliee';

@Component({
  selector: 'yay360-shell',
  standalone: true,
  imports: [ThemeToggleComponent, RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  /** Notifications non lues, rafraîchies à chaque navigation et après lecture. */
  readonly nonLues = toSignal(
    merge(this.router.events.pipe(filter((e) => e instanceof NavigationEnd)), this.notificationService.changement$).pipe(
      startWith(null),
      switchMap(() =>
        this.notificationService.compterNonLues().pipe(
          map((r) => r.nombre),
          catchError(() => of(0)),
        ),
      ),
    ),
    { initialValue: 0 },
  );

  readonly menuOuvert = signal(false);
  readonly compteOuvert = signal(false);

  readonly navItems = computed(() => {
    const role = this.authService.role();
    return NAV_ITEMS.filter((item) => !role || item.roles.includes(role));
  });

  /** Entrées regroupées par section, avec un titre adapté au rôle. */
  readonly sections = computed(() => {
    const role = this.authService.role();
    const titres: Record<NavItem['section'], string> = {
      general: 'Général',
      suivi: role === 'FEMME_ENCEINTE' ? 'Ma grossesse' : role === 'CONJOINT' ? 'Grossesse' : 'Suivi',
      gestion: role === 'ADMIN' ? 'Administration' : 'Ressources',
    };
    return (['general', 'suivi', 'gestion'] as const)
      .map((cle) => ({ cle, titre: titres[cle], items: this.navItems().filter((i) => i.section === cle) }))
      .filter((s) => s.items.length > 0);
  });

  /** Barre latérale repliée en rail d'icônes (ordinateur uniquement), choix mémorisé. */
  readonly repliee = signal(this.lireRepliee());

  basculerRepliee(): void {
    this.repliee.update((v) => !v);
    try { localStorage.setItem(CLE_REPLIE, String(this.repliee())); } catch { /* stockage indisponible */ }
  }

  private lireRepliee(): boolean {
    try { return localStorage.getItem(CLE_REPLIE) === 'true'; } catch { return false; }
  }

  readonly nomComplet = computed(() => this.authService.nomComplet());
  readonly initiales = computed(() =>
    this.nomComplet().split(' ').filter(Boolean).map((p) => p[0]?.toUpperCase()).slice(0, 2).join(''),
  );
  readonly libelleRole = computed(() => libelleRole(this.authService.role()));

  readonly titrePage = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.lireTitre()),
    ),
    { initialValue: '' },
  );

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (this.compteOuvert() && !(e.target as HTMLElement).closest('.account')) {
      this.compteOuvert.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEchap(): void {
    this.compteOuvert.set(false);
    this.menuOuvert.set(false);
  }

  basculerMenu(): void { this.menuOuvert.update((v) => !v); }
  fermerMenu(): void { this.menuOuvert.set(false); }
  basculerCompte(): void { this.compteOuvert.update((v) => !v); }

  deconnexion(): void {
    this.authService.logout();
    void this.router.navigate(['/connexion']);
  }

  private lireTitre(): string {
    let route = this.router.routerState.snapshot.root;
    let titre = '';
    while (route.firstChild) {
      route = route.firstChild;
      if (route.data['pageTitle']) titre = route.data['pageTitle'];
    }
    return titre;
  }
}
