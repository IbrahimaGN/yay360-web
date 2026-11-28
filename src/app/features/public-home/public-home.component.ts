import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconName } from '../../core/models/nav-item.model';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { FeuillageComponent } from '../../shared/components/feuillage/feuillage.component';

interface Profil {
  cle: string;
  titre: string;
  icone: IconName;
  support: string;
  description: string;
  points: string[];
}

interface Module {
  icone: IconName;
  titre: string;
  texte: string;
}

/** Contenu issu du cahier des charges YAY360 (rôles et modules réellement implémentés). */
const PROFILS: Profil[] = [
  {
    cle: 'patiente',
    titre: 'Femme enceinte',
    icone: 'heart',
    support: 'Mobile et web',
    description: 'Suit sa grossesse semaine après semaine et garde le lien avec son équipe de santé.',
    points: [
      'Calendrier personnalisé sur 40 semaines',
      'Demande de rendez-vous et rappels',
      'Signalement d’un symptôme inhabituel',
      'Conseils adaptés au stade de la grossesse',
    ],
  },
  {
    cle: 'conjoint',
    titre: 'Conjoint',
    icone: 'users',
    support: 'Mobile et web',
    description: 'Rejoint le dossier familial sur invitation et accompagne la future maman.',
    points: [
      'Invitation par code sécurisé (valable 72 h)',
      'Dates de rendez-vous partagées',
      'Notifications en cas d’alerte',
    ],
  },
  {
    cle: 'sage-femme',
    titre: 'Sage-femme',
    icone: 'clipboard',
    support: 'Portail web',
    description: 'Assure les consultations prénatales et la prise en charge des alertes.',
    points: [
      'Saisie des constantes de consultation',
      'Planification des rendez-vous',
      'Prise en charge et résolution des alertes',
    ],
  },
  {
    cle: 'medecin',
    titre: 'Médecin',
    icone: 'activity',
    support: 'Portail web',
    description: 'Valide les situations complexes et décide du statut des grossesses.',
    points: [
      'Classement ou retrait du statut « à risque »',
      'Diagnostic et prescriptions',
      'Clôture d’une grossesse',
    ],
  },
  {
    cle: 'admin',
    titre: 'Administration',
    icone: 'building',
    support: 'Portail web',
    description: 'Pilote la plateforme et la carte des structures de santé.',
    points: [
      'Gestion des comptes professionnels',
      'Référencement des établissements',
      'Tableau de bord décisionnel',
    ],
  },
];

const MODULES: Module[] = [
  { icone: 'heart', titre: 'Dossier maternel', texte: 'Date prévue d’accouchement, âge gestationnel et trimestre calculés automatiquement à partir de la date des dernières règles.' },
  { icone: 'book', titre: 'Calendrier & conseils', texte: 'Repères semaine par semaine : développement du bébé, changements chez la mère, examens recommandés.' },
  { icone: 'clipboard', titre: 'Consultations prénatales', texte: 'Plan des 8 contacts recommandés par l’OMS et dossier des constantes saisies par les soignants.' },
  { icone: 'calendar', titre: 'Rendez-vous & rappels', texte: 'Consultations, échographies, vaccinations et bilans, avec un rappel automatique dans les 24 h qui précèdent.' },
  { icone: 'bell', titre: 'Signalement des symptômes', texte: 'Un symptôme signalé est classé selon des règles validées puis transmis aux soignants. Ce n’est jamais un diagnostic.' },
  { icone: 'users', titre: 'Espace familial', texte: 'Le conjoint rejoint le dossier sur invitation et suit les rendez-vous et les alertes.' },
];

const SECTIONS = [
  { id: 'profils', libelle: 'Pour qui ?' },
  { id: 'modules', libelle: 'Fonctionnalités' },
  { id: 'parcours', libelle: 'Comment ça marche' },
  { id: 'confiance', libelle: 'Confiance' },
];

@Component({
  selector: 'yay360-public-home',
  standalone: true,
  imports: [ThemeToggleComponent, RouterLink, IconComponent, FeuillageComponent],
  templateUrl: './public-home.component.html',
  styleUrl: './public-home.component.scss',
})
export class PublicHomeComponent {
  protected readonly authService = inject(AuthService);

  readonly profils = PROFILS;
  readonly modules = MODULES;
  readonly profilActif = signal(PROFILS[0].cle);
  readonly profil = computed(() => PROFILS.find((p) => p.cle === this.profilActif()) ?? PROFILS[0]);
  readonly menuOuvert = signal(false);

  readonly sections = SECTIONS;
  /** Section visible à l'écran, soulignée dans le menu. */
  readonly sectionActive = signal<string | null>(null);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') return;
      const obs = new IntersectionObserver(
        (entrees) => {
          const visible = entrees.find((e) => e.isIntersecting);
          if (visible) this.sectionActive.set(visible.target.id);
        },
        { rootMargin: '-45% 0px -50% 0px' },
      );
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el) obs.observe(el);
      }
      destroyRef.onDestroy(() => obs.disconnect());
    });
  }

  choisirProfil(cle: string): void {
    this.profilActif.set(cle);
  }
}
