import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { IconName } from '../../core/models/nav-item.model';
import { Role } from '../../core/models/utilisateur.model';

interface QuickLink {
  label: string;
  description: string;
  icon: IconName;
  path: string;
  roles: Role[];
}

const QUICK_LINKS: QuickLink[] = [
  { label: 'Dossier familial', description: 'Partager et consulter le dossier maternel', icon: 'users', path: '/dossier-familial', roles: ['FEMME_ENCEINTE', 'CONJOINT'] },
  { label: 'Suivi prénatal', description: 'Consulter les étapes, rendez-vous et consultations', icon: 'calendar', path: '/suivi-prenatal', roles: ['FEMME_ENCEINTE', 'CONJOINT'] },
  { label: 'Tableau de bord', description: "Vue d'ensemble des indicateurs clés", icon: 'grid', path: '/tableau-de-bord', roles: ['ADMIN'] },
  { label: 'Suivi des grossesses', description: 'Suivre la santé maternelle et l’évolution des grossesses', icon: 'heart', path: '/grossesses', roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
  { label: 'Rendez-vous', description: 'Gérer le planning et les rendez-vous', icon: 'calendar', path: '/rendez-vous', roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
  { label: 'Consultations', description: 'Enregistrer et consulter les dossiers', icon: 'clipboard', path: '/consultations', roles: ['MEDECIN', 'SAGE_FEMME'] },
  { label: 'Alertes', description: 'Suivre les situations nécessitant une vigilance', icon: 'bell', path: '/alertes', roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
  { label: 'Établissements', description: 'Gérer les centres de santé partenaires', icon: 'building', path: '/etablissements', roles: ['ADMIN'] },
  { label: 'Conseils & étapes', description: 'Administrer le contenu semaine par semaine', icon: 'book', path: '/conseils', roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
  { label: 'Utilisateurs', description: 'Gérer les comptes de la plateforme', icon: 'users', path: '/utilisateurs', roles: ['ADMIN'] },
];

@Component({
  selector: 'yay360-home',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: 'home.component.html',
  styleUrl: 'home.component.scss',
})
export class HomeComponent {
  protected readonly authService = inject(AuthService);

  protected readonly salutation = computed(() => {
    const heure = new Date().getHours();
    if (heure < 5) return 'Bonsoir';
    if (heure < 18) return 'Bonjour';
    return 'Bonsoir';
  });

  protected readonly libelleRole = computed(() => {
    const libelles: Record<string, string> = {
      ADMIN: 'Administrateur',
      MEDECIN: 'Médecin',
      SAGE_FEMME: 'Sage-femme',
      FEMME_ENCEINTE: 'Femme enceinte',
      CONJOINT: 'Conjoint',
    };
    const role = this.authService.role();
    return role ? (libelles[role] ?? role) : '';
  });

  protected readonly premierPrenom = computed(() => {
    const nom = this.authService.nomComplet();
    return nom.split(' ')[0] ?? nom;
  });

  protected readonly accesRapides = computed(() => {
    const role = this.authService.role();
    return QUICK_LINKS.filter((lien) => !role || lien.roles.includes(role));
  });
}