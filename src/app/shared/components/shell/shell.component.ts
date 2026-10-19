import { Component, computed, inject, signal, HostListener } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NavItem } from '../../../core/models/nav-item.model';
import { IconComponent } from '../icon/icon.component';
import { AssistantIaComponent } from '../../../features/assistant-ia/assistant-ia.component';

const NAV_ITEMS: NavItem[] = [
  { label: 'Dossier familial', path: '/dossier-familial', icon: 'users', roles: ['FEMME_ENCEINTE', 'CONJOINT'] },
  { label: 'Suivi prénatal', path: '/suivi-prenatal', icon: 'calendar', roles: ['FEMME_ENCEINTE', 'CONJOINT'] },
  { label: 'Tableau de bord',  path: '/tableau-de-bord', icon: 'grid',      roles: ['ADMIN'] },
  { label: 'Suivi des grossesses', path: '/grossesses', icon: 'heart', roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
  { label: 'Rendez-vous',      path: '/rendez-vous',      icon: 'calendar',  roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
  { label: 'Consultations',    path: '/consultations',    icon: 'clipboard', roles: ['MEDECIN', 'SAGE_FEMME'] },
  { label: 'Alertes',          path: '/alertes',          icon: 'bell',      roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
  { label: 'Établissements',   path: '/etablissements',   icon: 'building',  roles: ['ADMIN'] },
  { label: 'Conseils & étapes',path: '/conseils',         icon: 'book',      roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
  { label: 'Utilisateurs',     path: '/utilisateurs',     icon: 'users',     roles: ['ADMIN'] },
];

@Component({
  selector: 'yay360-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, AssistantIaComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly authService  = inject(AuthService);
  private readonly router       = inject(Router);
  readonly themeService         = inject(ThemeService);

  readonly sidebarOuverte       = signal(false);
  readonly sidebarCollapsed     = signal(this.loadCollapsed());
  readonly menuUtilisateurOuvert= signal(false);

  readonly navItems = computed(() => {
    const role = this.authService.role();
    return NAV_ITEMS.filter(item => !role || item.roles.includes(role));
  });

  readonly initiales = computed(() => {
    const nom = this.authService.nomComplet();
    return nom.split(' ').filter(Boolean).map(p => p[0]?.toUpperCase()).slice(0, 2).join('');
  });

  readonly nomComplet = computed(() => this.authService.nomComplet());

  readonly libelleRole = computed(() => {
    const libelles: Record<string, string> = {
      ADMIN: 'Administrateur', MEDECIN: 'Medecin',
      SAGE_FEMME: 'Sage-femme',       FEMME_ENCEINTE: 'Femme enceinte', CONJOINT: 'Conjoint',
    };
    const role = this.authService.role();
    return role ? (libelles[role] ?? role) : '';
  });

  readonly titrePage = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.lireTitre()),
    ),
    { initialValue: '' },
  );

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (this.menuUtilisateurOuvert() && !target.closest('.topbar__user')) {
      this.menuUtilisateurOuvert.set(false);
    }
  }

  toggleSidebar()   { this.sidebarOuverte.update(v => !v); }
  fermerSidebar()   { this.sidebarOuverte.set(false); }
  toggleCollapse()  {
    this.sidebarCollapsed.update(v => {
      const next = !v;
      try { localStorage.setItem('yay360-sidebar-collapsed', String(next)); } catch {}
      return next;
    });
  }
  toggleMenuUtilisateur() { this.menuUtilisateurOuvert.update(v => !v); }
  deconnexion() { this.authService.logout(); this.router.navigate(['/connexion']); }

  private loadCollapsed(): boolean {
    try { return localStorage.getItem('yay360-sidebar-collapsed') === 'true'; } catch { return false; }
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
