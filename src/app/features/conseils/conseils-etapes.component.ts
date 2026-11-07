import { messageErreur } from '../../core/utils/message-erreur';
import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { StateComponent } from '../../shared/components/state/state.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EtapeGrossesseService } from '../../core/services/etape-grossesse.service';
import { ConseilService } from '../../core/services/conseil.service';
import {
  CATEGORIES_CONSEIL,
  DUREE_GROSSESSE_SEMAINES,
  EtapeGrossesseDto,
} from '../../core/models/etape-grossesse.model';
import { ConseilDto } from '../../core/models/grossesse.model';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { IconName } from '../../core/models/nav-item.model';

const CHAMPS_ETAPE = ['developpementBebe', 'changementsMere', 'objectifsSante', 'conseilsAlimentation', 'conseilsHydratation',
  'exercicesPhysiques', 'conseilsSommeil', 'precautions', 'examensRecommandes', 'signesAlerte'] as const;

type Vue = 'ETAPES' | 'CONSEILS';

@Component({
  selector: 'yay360-conseils-etapes',
  standalone: true,
  imports: [StateComponent, ReactiveFormsModule, IconComponent],
  templateUrl: './conseils-etapes.component.html',
  styleUrl: './conseils-etapes.component.scss',
})
export class ConseilsEtapesComponent {
  /** Échec d'une action : toujours affiché à l'utilisateur. */
  readonly erreurAction = signal<string | null>(null);

  private readonly etapeService = inject(EtapeGrossesseService);
  private readonly conseilService = inject(ConseilService);
  private readonly fb = inject(FormBuilder);

  readonly categories = CATEGORIES_CONSEIL;
  readonly dureeGrossesseSemaines = DUREE_GROSSESSE_SEMAINES;
  readonly vue = signal<Vue>('ETAPES');
  // --- Étapes ---
  readonly chargementEtapes = signal(true);
  readonly etapes = signal<EtapeGrossesseDto[]>([]);
  readonly semaineOuverte = signal<number | null>(null);
  readonly enregistrementEtape = signal(false);

  readonly etapeActive = computed(() => {
    const sem = this.semaineOuverte();
    return sem !== null ? this.etapes().find((e) => e.semaine === sem) ?? null : null;
  });

  readonly formEtape = this.fb.group({
    developpementBebe: [''],
    changementsMere: [''],
    objectifsSante: [''],
    conseilsAlimentation: [''],
    conseilsHydratation: [''],
    exercicesPhysiques: [''],
    conseilsSommeil: [''],
    precautions: [''],
    examensRecommandes: [''],
    signesAlerte: [''],
  });

  // --- Conseils ---
  readonly chargementConseils = signal(true);
  readonly conseils = signal<ConseilDto[]>([]);
  readonly formulaireConseilOuvert = signal(false);
  readonly idConseilEnEdition = signal<number | null>(null);
  readonly enregistrementConseil = signal(false);

  readonly formConseil = this.fb.group({
    semaineDebut: [1, [Validators.required, Validators.min(1), Validators.max(DUREE_GROSSESSE_SEMAINES)]],
    semaineFin: [13, [Validators.required, Validators.min(1), Validators.max(DUREE_GROSSESSE_SEMAINES)]],
    categorie: ['NUTRITION', [Validators.required]],
    titre: ['', [Validators.required]],
    contenu: ['', [Validators.required]],
  });

  constructor() {
    this.chargerEtapes();
    this.chargerConseils();
  }

  changerVue(v: Vue): void {
    this.vue.set(v);
    this.succes.set(null);
  }

  fermerSemaine(): void {
    this.semaineOuverte.set(null);
  }

  @HostListener('document:keydown.escape')
  fermerSemaineAvecEchap(): void {
    if (this.conseilASupprimer()) this.conseilASupprimer.set(null);
    else if (this.formulaireConseilOuvert()) this.fermerFormulaireConseil();
  }

  // --- Présentation ---
  readonly succes = signal<string | null>(null);
  readonly nombreChamps = CHAMPS_ETAPE.length;

  /** Nombre de rubriques renseignées pour une semaine (indicateur de complétude). */
  remplissage(etape: EtapeGrossesseDto): number {
    return CHAMPS_ETAPE.filter((c) => (etape[c] ?? '').toString().trim().length > 0).length;
  }

  readonly trimestres = computed(() => [
    { cle: 'T1', titre: '1er trimestre', plage: 'Semaines 1 à 13', etapes: this.etapes().filter((e) => e.semaine <= 13) },
    { cle: 'T2', titre: '2e trimestre', plage: 'Semaines 14 à 27', etapes: this.etapes().filter((e) => e.semaine >= 14 && e.semaine <= 27) },
    { cle: 'T3', titre: '3e trimestre', plage: `Semaines 28 à ${DUREE_GROSSESSE_SEMAINES}`, etapes: this.etapes().filter((e) => e.semaine >= 28) },
  ]);
  readonly semainesCompletes = computed(() => this.etapes().filter((e) => this.remplissage(e) === CHAMPS_ETAPE.length).length);

  /** Sur petit écran, l'éditeur est sous la grille : on le fait défiler à l'écran. */
  allerEditeur(): void {
    if (typeof window === 'undefined' || window.innerWidth >= 1024) return;
    setTimeout(() => document.querySelector('.editor')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start',
    }));
  }

  semaineVoisine(delta: number): void {
    const sem = this.semaineOuverte();
    if (sem === null) return;
    const cible = this.etapes().find((e) => e.semaine === sem + delta);
    if (cible) this.ouvrirSemaine(cible);
  }

  // --- Filtres des conseils ---
  readonly recherche = signal('');
  readonly filtreCategorie = signal('');
  readonly filtreStatut = signal<'TOUS' | 'ACTIFS' | 'INACTIFS'>('TOUS');
  readonly conseilsFiltres = computed(() => {
    const terme = this.recherche().trim().toLowerCase();
    const cat = this.filtreCategorie();
    const st = this.filtreStatut();
    return this.conseils()
      .filter((c) => (!cat || c.categorie === cat) && (st === 'TOUS' || (st === 'ACTIFS' ? c.actif : !c.actif)) &&
        (!terme || c.titre.toLowerCase().includes(terme) || c.contenu.toLowerCase().includes(terme)))
      .sort((a, b) => a.semaineDebut - b.semaineDebut || a.titre.localeCompare(b.titre, 'fr'));
  });
  readonly filtresActifs = computed(() => !!this.recherche().trim() || !!this.filtreCategorie() || this.filtreStatut() !== 'TOUS');
  reinitialiserFiltres(): void { this.recherche.set(''); this.filtreCategorie.set(''); this.filtreStatut.set('TOUS'); }

  iconeCategorie(cat: string): IconName {
    return ({ NUTRITION: 'heart', ACTIVITE_PHYSIQUE: 'activity', SOMMEIL: 'moon', PREVENTION: 'shield', PREPARATION_ACCOUCHEMENT: 'calendar', ALLAITEMENT: 'users', SANTE_MENTALE: 'sun' } as Record<string, IconName>)[cat] ?? 'book';
  }
  tonCategorie(cat: string): string {
    return ({ NUTRITION: 'orange', ACTIVITE_PHYSIQUE: 'teal', SOMMEIL: 'lilac', PREVENTION: 'teal', PREPARATION_ACCOUCHEMENT: 'orange', ALLAITEMENT: 'lilac', SANTE_MENTALE: 'teal' } as Record<string, string>)[cat] ?? 'teal';
  }

  /** Suppression confirmée dans une fenêtre (remplace la boîte native). */
  readonly conseilASupprimer = signal<ConseilDto | null>(null);
  readonly suppressionEnCours = signal(false);

  invalideConseil(nom: 'semaineDebut' | 'semaineFin' | 'categorie' | 'titre' | 'contenu'): boolean {
    const c = this.formConseil.controls[nom];
    return c.invalid && c.touched;
  }

  // ==================== ÉTAPES ====================

  chargerEtapes(): void {
    this.chargementEtapes.set(true);
    this.etapeService.listerToutes().subscribe({
      next: (liste) => {
        this.etapes.set(liste.sort((a, b) => a.semaine - b.semaine));
        this.chargementEtapes.set(false);
        if (this.semaineOuverte() === null && liste.length) this.ouvrirSemaine(liste[0]);
      },
      error: (err) => {
        this.chargementEtapes.set(false);
        this.erreurAction.set(messageErreur(err, "Impossible de charger les étapes de grossesse."));
      },
    });
  }

  ouvrirSemaine(etape: EtapeGrossesseDto): void {
    this.semaineOuverte.set(etape.semaine);
    this.erreurAction.set(null);
    this.formEtape.reset({
      developpementBebe: etape.developpementBebe ?? '',
      changementsMere: etape.changementsMere ?? '',
      objectifsSante: etape.objectifsSante ?? '',
      conseilsAlimentation: etape.conseilsAlimentation ?? '',
      conseilsHydratation: etape.conseilsHydratation ?? '',
      exercicesPhysiques: etape.exercicesPhysiques ?? '',
      conseilsSommeil: etape.conseilsSommeil ?? '',
      precautions: etape.precautions ?? '',
      examensRecommandes: etape.examensRecommandes ?? '',
      signesAlerte: etape.signesAlerte ?? '',
    });
  }

  enregistrerEtape(etape: EtapeGrossesseDto): void {
    this.enregistrementEtape.set(true);
    const valeurs = this.formEtape.getRawValue();

    this.etapeService.mettreAJour(etape.id, { semaine: etape.semaine, ...valeurs }).subscribe({
      next: (miseAJour) => {
        this.etapes.update((liste) => liste.map((e) => (e.id === miseAJour.id ? miseAJour : e)));
        this.enregistrementEtape.set(false);
        this.formEtape.markAsPristine();
        this.succes.set(`Semaine ${miseAJour.semaine} enregistrée.`);
      },
      error: (err) => {
        this.enregistrementEtape.set(false);
        this.erreurAction.set(messageErreur(err, "Impossible d'enregistrer cette étape."));
      },
    });
  }

  trimestreDe(semaine: number): string {
    if (semaine <= 13) return 'T1';
    if (semaine <= 27) return 'T2';
    return 'T3';
  }

  // ==================== CONSEILS ====================

  chargerConseils(): void {
    this.chargementConseils.set(true);
    this.conseilService.listerTous().subscribe({
      next: (liste) => {
        this.conseils.set(liste);
        this.chargementConseils.set(false);
      },
      error: (err) => {
        this.chargementConseils.set(false);
        this.erreurAction.set(messageErreur(err, "Impossible de charger les conseils."));
      },
    });
  }

  ouvrirCreationConseil(): void {
    this.erreurAction.set(null);
    this.idConseilEnEdition.set(null);
    this.formConseil.reset({ semaineDebut: 1, semaineFin: 13, categorie: 'NUTRITION' });
    this.formulaireConseilOuvert.set(true);
  }

  ouvrirEditionConseil(conseil: ConseilDto): void {
    this.idConseilEnEdition.set(conseil.id);
    this.formConseil.reset({
      semaineDebut: conseil.semaineDebut,
      semaineFin: conseil.semaineFin,
      categorie: conseil.categorie,
      titre: conseil.titre,
      contenu: conseil.contenu,
    });
    this.formulaireConseilOuvert.set(true);
  }

  fermerFormulaireConseil(): void {
    this.formulaireConseilOuvert.set(false);
  }

  soumettreConseil(): void {
    if (this.formConseil.invalid) {
      this.formConseil.markAllAsTouched();
      return;
    }

    this.enregistrementConseil.set(true);
    const valeurs = this.formConseil.getRawValue();
    const request = {
      semaineDebut: valeurs.semaineDebut!,
      semaineFin: valeurs.semaineFin!,
      categorie: valeurs.categorie!,
      titre: valeurs.titre!,
      contenu: valeurs.contenu!,
    };

    const idEdition = this.idConseilEnEdition();
    const requete = idEdition
      ? this.conseilService.mettreAJour(idEdition, request)
      : this.conseilService.creer(request);

    requete.subscribe({
      next: () => {
        this.enregistrementConseil.set(false);
        this.formulaireConseilOuvert.set(false);
        this.succes.set(idEdition ? 'Conseil mis à jour.' : 'Conseil créé.');
        this.chargerConseils();
      },
      error: (err) => {
        this.enregistrementConseil.set(false);
        this.erreurAction.set(messageErreur(err, "Impossible d'enregistrer ce conseil."));
      },
    });
  }

  basculerActivation(conseil: ConseilDto): void {
    this.conseilService.basculerActivation(conseil.id).subscribe({
      next: (miseAJour) =>
        this.conseils.update((liste) => liste.map((c) => (c.id === miseAJour.id ? miseAJour : c))),
      error: (err) => this.erreurAction.set(messageErreur(err, 'Impossible de modifier ce conseil.')),
    });
  }

  supprimerConseil(conseil: ConseilDto): void {
    this.conseilASupprimer.set(conseil);
  }

  confirmerSuppression(): void {
    const conseil = this.conseilASupprimer();
    if (!conseil) return;
    this.suppressionEnCours.set(true);
    this.conseilService.supprimer(conseil.id).subscribe({
      next: () => {
        this.suppressionEnCours.set(false);
        this.conseilASupprimer.set(null);
        this.succes.set(`Conseil « ${conseil.titre} » supprimé.`);
        this.chargerConseils();
      },
      error: (err) => {
        this.suppressionEnCours.set(false);
        this.conseilASupprimer.set(null);
        this.erreurAction.set(messageErreur(err, 'Impossible de supprimer ce conseil.'));
      },
    });
  }

  libelleCategorie(valeur: string): string {
    return this.categories.find((c) => c.value === valeur)?.label ?? valeur;
  }
}
