import { libelleRole } from '../../core/utils/libelles';
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardDto } from '../../core/models/dashboard.model';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StateComponent } from '../../shared/components/state/state.component';
import { IconName } from '../../core/models/nav-item.model';
import { Role } from '../../core/models/utilisateur.model';
import { messageErreur } from '../../core/utils/message-erreur';
import { forkJoin, of, catchError, map } from 'rxjs';
import { RendezVousService } from '../../core/services/rendez-vous.service';
import { AlerteService } from '../../core/services/alerte.service';
import { GrossesseService } from '../../core/services/grossesse.service';
import { RendezVousDto } from '../../core/models/rendez-vous.model';
import { AlerteDto } from '../../core/models/alerte.model';
import { GrossesseDto, PlanCpnDto, SuiviHebdomadaireDto } from '../../core/models/grossesse.model';
import { libelleSymptome, libelleTypeRendezVous } from '../../core/utils/libelles';
import { NiveauGraviteComponent } from '../../shared/components/niveau-gravite/niveau-gravite.component';
import { RingChartComponent, RingSegment } from '../../shared/components/ring-chart/ring-chart.component';
import { dureeEcoulee, initiales } from '../../core/utils/affichage';

interface QuickLink {
  label: string;
  description: string;
  icon: IconName;
  path: string;
  roles: Role[];
}

const QUICK_LINKS: QuickLink[] = [
  { label: 'Dossier familial', description: 'Partager et consulter le dossier maternel', icon: 'users', path: '/dossier-familial', roles: ['FEMME_ENCEINTE', 'CONJOINT'] },
  { label: 'Suivi prénatal', description: 'Étapes, rendez-vous et consultations', icon: 'calendar', path: '/suivi-prenatal', roles: ['FEMME_ENCEINTE', 'CONJOINT'] },
  { label: 'Tableau de bord', description: 'Indicateurs de pilotage de la plateforme', icon: 'grid', path: '/tableau-de-bord', roles: ['ADMIN'] },
  { label: 'Grossesses', description: 'Suivi et évolution des grossesses', icon: 'heart', path: '/grossesses', roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
  { label: 'Rendez-vous', description: 'Planning et rendez-vous', icon: 'calendar', path: '/rendez-vous', roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
  { label: 'Consultations', description: 'Enregistrer et consulter les dossiers', icon: 'clipboard', path: '/consultations', roles: ['MEDECIN', 'SAGE_FEMME'] },
  { label: 'Alertes', description: 'Situations nécessitant une vigilance', icon: 'bell', path: '/alertes', roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
  { label: 'Établissements', description: 'Centres de santé partenaires', icon: 'building', path: '/etablissements', roles: ['ADMIN'] },
  { label: 'Conseils & étapes', description: 'Contenu semaine par semaine', icon: 'book', path: '/conseils', roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
  { label: 'Utilisateurs', description: 'Comptes de la plateforme', icon: 'users', path: '/utilisateurs', roles: ['ADMIN'] },
];

@Component({
  selector: 'yay360-home',
  standalone: true,
  imports: [RouterLink, IconComponent, StateComponent, DatePipe, DecimalPipe, NiveauGraviteComponent, RingChartComponent],
  templateUrl: 'home.component.html',
  styleUrl: 'home.component.scss',
})
export class HomeComponent {
  protected readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);

  protected readonly aujourdhui = new Date();
  protected readonly estAdmin = computed(() => this.authService.role() === 'ADMIN');

  /** Indicateurs de l'admin (même source que le tableau de bord). */
  protected readonly stats = signal<DashboardDto | null>(null);
  protected readonly chargementStats = signal(false);
  protected readonly erreurStats = signal<string | null>(null);

  protected readonly salutation = computed(() => {
    const heure = new Date().getHours();
    return heure >= 5 && heure < 18 ? 'Bonjour' : 'Bonsoir';
  });

  protected readonly libelleRole = computed(() => libelleRole(this.authService.role()));

  protected readonly premierPrenom = computed(() => {
    const nom = this.authService.nomComplet();
    return nom.split(' ')[0] ?? nom;
  });

  protected readonly accesRapides = computed(() => {
    const role = this.authService.role();
    return QUICK_LINKS.filter((lien) => !role || lien.roles.includes(role));
  });

  /** Éléments à traiter en priorité par l'admin. */
  protected readonly aTraiter = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { libelle: 'Alertes urgentes non résolues', valeur: s.nombreAlertesUrgentes, icone: 'alert-triangle' as IconName, ton: 'danger', lien: '/alertes' },
      { libelle: 'Nouvelles alertes à prendre en charge', valeur: s.nombreAlertesNouvelles, icone: 'bell' as IconName, ton: 'orange', lien: '/alertes' },
      { libelle: 'Grossesses à risque en cours', valeur: s.nombreGrossessesARisque, icone: 'heart' as IconName, ton: 'teal', lien: '/grossesses' },
    ];
  });

  // ─── Espace soignant (médecin, sage-femme) ───────────────────────────
  private readonly rendezVousService = inject(RendezVousService);
  private readonly alerteService = inject(AlerteService);
  private readonly grossesseService = inject(GrossesseService);

  protected readonly estSoignant = computed(() => this.authService.hasRole('MEDECIN', 'SAGE_FEMME'));
  protected readonly libelleSymptome = libelleSymptome;
  protected readonly libelleTypeRendezVous = libelleTypeRendezVous;

  protected readonly chargementSoignant = signal(false);
  /** Erreur par bloc : un bloc en échec n'empêche pas l'affichage des autres. */
  protected readonly erreursSoignant = signal<{ planning?: boolean; alertes?: boolean; grossesses?: boolean }>({});
  protected readonly planning = signal<RendezVousDto[]>([]);
  protected readonly alertesNouvelles = signal<AlerteDto[]>([]);
  protected readonly grossessesSuivies = signal<GrossesseDto[]>([]);

  private estAujourdhui(date: string): boolean {
    const d = new Date(date), n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  }

  protected readonly rdvAujourdhui = computed(() =>
    this.planning().filter((r) => this.estAujourdhui(r.dateHeure) && (r.statut === 'PLANIFIE' || r.statut === 'CONFIRME'))
      .sort((a, b) => +new Date(a.dateHeure) - +new Date(b.dateHeure)));

  /** Prochains rendez-vous : ceux du jour, sinon les suivants. */
  protected readonly prochainsRdv = computed(() => {
    const maintenant = Date.now() - 2 * 3600e3;
    return this.planning()
      .filter((r) => (r.statut === 'PLANIFIE' || r.statut === 'CONFIRME') && +new Date(r.dateHeure) >= maintenant)
      .sort((a, b) => +new Date(a.dateHeure) - +new Date(b.dateHeure))
      .slice(0, 5);
  });

  private static readonly RANG: Record<string, number> = { URGENT: 0, ELEVE: 1, MODERE: 2 };
  protected readonly alertesATraiter = computed(() =>
    [...this.alertesNouvelles()].sort((a, b) => (HomeComponent.RANG[a.niveauGravite] ?? 3) - (HomeComponent.RANG[b.niveauGravite] ?? 3)
      || +new Date(b.dateDeclaration) - +new Date(a.dateDeclaration)).slice(0, 4));
  protected readonly nombreUrgentes = computed(() => this.alertesNouvelles().filter((a) => a.niveauGravite === 'URGENT').length);
  protected readonly nombreARisque = computed(() => this.grossessesSuivies().filter((g) => g.grossesseARisque).length);

  chargerSoignant(): void {
    this.chargementSoignant.set(true);
    this.erreursSoignant.set({});
    const erreurs: { planning?: boolean; alertes?: boolean; grossesses?: boolean } = {};
    forkJoin({
      planning: this.rendezVousService.monPlanning().pipe(catchError(() => { erreurs.planning = true; return of([] as RendezVousDto[]); })),
      alertes: this.alerteService.listerParStatut('NOUVELLE').pipe(catchError(() => { erreurs.alertes = true; return of([] as AlerteDto[]); })),
      grossesses: this.grossesseService.listerActives().pipe(catchError(() => { erreurs.grossesses = true; return of([] as GrossesseDto[]); })),
    }).pipe(map((r) => r)).subscribe((r) => {
      this.planning.set(r.planning);
      this.alertesNouvelles.set(r.alertes);
      this.grossessesSuivies.set(r.grossesses);
      this.erreursSoignant.set(erreurs);
      this.chargementSoignant.set(false);
    });
  }

  readonly initiales = initiales;

  depuis(date: string): string {
    return dureeEcoulee(date, true);
  }

  // ─── Espace patiente / conjoint ──────────────────────────────────────
  protected readonly estFamille = computed(() => this.authService.hasRole('FEMME_ENCEINTE', 'CONJOINT'));
  protected readonly estFemme = computed(() => this.authService.hasRole('FEMME_ENCEINTE'));
  protected readonly chargementFamille = signal(false);
  protected readonly erreurFamille = signal<string | null>(null);
  protected readonly grossesse = signal<GrossesseDto | null>(null);
  protected readonly suiviSemaine = signal<SuiviHebdomadaireDto | null>(null);
  protected readonly planCpn = signal<PlanCpnDto | null>(null);
  protected readonly rdvAVenir = signal<RendezVousDto[]>([]);

  protected readonly prochainRdv = computed(() =>
    [...this.rdvAVenir()]
      .filter((r) => r.statut === 'PLANIFIE' || r.statut === 'CONFIRME')
      .sort((a, b) => +new Date(a.dateHeure) - +new Date(b.dateHeure))[0] ?? null
  );

  /** Prochaine consultation prénatale du plan OMS (non réalisée). */
  protected readonly prochaineCpn = computed(() => this.planCpn()?.contacts.find((c) => c.statut !== 'REALISE') ?? null);

  protected readonly anneauGrossesse = computed<RingSegment[]>(() => {
    const g = this.grossesse();
    if (!g) return [];
    const s = Math.min(g.semaineActuelle, 40);
    return [
      { label: 'Semaines écoulées', value: s, color: 'var(--c-orange)' },
      { label: 'Semaines restantes', value: 40 - s, color: 'transparent' },
    ];
  });

  chargerFamille(): void {
    this.chargementFamille.set(true);
    this.erreurFamille.set(null);
    this.grossesseService.obtenirMonHistorique().subscribe({
      next: (liste) => {
        const g = liste.find((x) => x.statut === 'EN_COURS') ?? null;
        this.grossesse.set(g);
        this.chargementFamille.set(false);
        if (g) {
          this.grossesseService.obtenirMonSuivi().subscribe({ next: (s) => this.suiviSemaine.set(s), error: () => this.suiviSemaine.set(null) });
          this.grossesseService.monPlanCpn().subscribe({ next: (p) => this.planCpn.set(p), error: () => this.planCpn.set(null) });
          this.rendezVousService.mesRendezVousAVenir().subscribe({ next: (l) => this.rdvAVenir.set(l), error: () => this.rdvAVenir.set([]) });
        }
      },
      error: (err) => {
        this.chargementFamille.set(false);
        this.erreurFamille.set(messageErreur(err, 'Impossible de charger votre suivi.'));
      },
    });
  }

  constructor() {
    if (this.estAdmin()) this.chargerStats();
    if (this.estSoignant()) this.chargerSoignant();
    if (this.estFamille()) this.chargerFamille();
  }

  chargerStats(): void {
    this.chargementStats.set(true);
    this.erreurStats.set(null);
    this.dashboardService.obtenir().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.chargementStats.set(false);
      },
      error: (err) => {
        this.erreurStats.set(messageErreur(err, 'Impossible de charger les indicateurs.'));
        this.chargementStats.set(false);
      },
    });
  }
}
