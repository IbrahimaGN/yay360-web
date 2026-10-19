import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EtapeGrossesseService } from '../../core/services/etape-grossesse.service';
import { ConseilService } from '../../core/services/conseil.service';
import {
  CATEGORIES_CONSEIL,
  DUREE_GROSSESSE_SEMAINES,
  EtapeGrossesseDto,
} from '../../core/models/etape-grossesse.model';
import { ConseilDto } from '../../core/models/grossesse.model';

type Vue = 'ETAPES' | 'CONSEILS';

@Component({
  selector: 'yay360-conseils-etapes',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './conseils-etapes.component.html',
  styleUrl: './conseils-etapes.component.scss',
})
export class ConseilsEtapesComponent {
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
    this.fermerSemaine();
  }

  fermerSemaine(): void {
    this.semaineOuverte.set(null);
  }

  @HostListener('document:keydown.escape')
  fermerSemaineAvecEchap(): void {
    this.fermerSemaine();
  }

  // ==================== ÉTAPES ====================

  chargerEtapes(): void {
    this.chargementEtapes.set(true);
    this.etapeService.listerToutes().subscribe({
      next: (liste) => {
        this.etapes.set(liste.sort((a, b) => a.semaine - b.semaine));
        this.chargementEtapes.set(false);
      },
      error: () => this.chargementEtapes.set(false),
    });
  }

  ouvrirSemaine(etape: EtapeGrossesseDto): void {
    if (this.semaineOuverte() === etape.semaine) {
      this.semaineOuverte.set(null);
      return;
    }
    this.semaineOuverte.set(etape.semaine);
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
        this.semaineOuverte.set(null);
      },
      error: () => this.enregistrementEtape.set(false),
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
      error: () => this.chargementConseils.set(false),
    });
  }

  ouvrirCreationConseil(): void {
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
        this.chargerConseils();
      },
      error: () => this.enregistrementConseil.set(false),
    });
  }

  basculerActivation(conseil: ConseilDto): void {
    this.conseilService.basculerActivation(conseil.id).subscribe({
      next: (miseAJour) =>
        this.conseils.update((liste) => liste.map((c) => (c.id === miseAJour.id ? miseAJour : c))),
    });
  }

  supprimerConseil(conseil: ConseilDto): void {
    if (!confirm(`Supprimer le conseil « ${conseil.titre} » ?`)) return;
    this.conseilService.supprimer(conseil.id).subscribe({
      next: () => this.chargerConseils(),
    });
  }

  libelleCategorie(valeur: string): string {
    return this.categories.find((c) => c.value === valeur)?.label ?? valeur;
  }
}
