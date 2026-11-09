import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConsultationService } from '../../../core/services/consultation.service';
import { GrossesseService } from '../../../core/services/grossesse.service';
import { EtablissementService } from '../../../core/services/etablissement.service';
import { GrossesseDto } from '../../../core/models/grossesse.model';
import { EtablissementDto } from '../../../core/models/etablissement.model';
import { RESULTATS_BANDELETTE } from '../../../core/utils/libelles';
import { champsInvalides, messageErreur } from '../../../core/utils/message-erreur';
import { validateurTension } from '../../../core/validators/validateurs';

@Component({
  selector: 'yay360-nouvelle-consultation',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './nouvelle-consultation.component.html',
  styleUrl: './nouvelle-consultation.component.scss',
})
export class NouvelleConsultationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly consultationService = inject(ConsultationService);
  private readonly grossesseService = inject(GrossesseService);
  private readonly etablissementService = inject(EtablissementService);
  private readonly router = inject(Router);

  // Liés automatiquement aux query params ?grossesseId=&rendezVousId= (withComponentInputBinding)
  readonly grossesseId = input<string>();
  readonly rendezVousId = input<string>();

  readonly patientes = signal<GrossesseDto[]>([]);
  readonly etablissements = signal<EtablissementDto[]>([]);
  readonly enregistrement = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly erreursServeur = signal<Record<string, string>>({});

  readonly resultatsBandelette = RESULTATS_BANDELETTE;

  // Bornes identiques au DTO du backend (EnregistrerConsultationRequest)
  readonly form = this.fb.group({
    grossesseId: [null as number | null, [Validators.required]],
    etablissementId: [null as number | null],
    poidsKg: [null as number | null, [Validators.min(20), Validators.max(250)]],
    tensionArterielle: ['', [validateurTension]],
    temperatureC: [null as number | null, [Validators.min(25), Validators.max(45)]],
    hauteurUterineCm: [null as number | null, [Validators.min(0), Validators.max(50)]],
    battementsCoeurFoetal: [null as number | null, [Validators.min(0), Validators.max(300)]],
    frequenceCardiaqueMaternelle: [null as number | null, [Validators.min(30), Validators.max(250)]],
    proteinurie: [null as string | null],
    glycosurie: [null as string | null],
    observations: [''],
    diagnostic: [''],
    traitement: [''],
    prescriptions: [''],
  });

  private readonly valeurs = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  /** Dossier choisi, résumé dans le panneau latéral. */
  readonly patiente = computed(() => {
    const id = Number(this.valeurs().grossesseId);
    return id ? this.patientes().find((g) => g.id === id) ?? null : null;
  });

  /** Constantes renseignées (sur 8), pour le récapitulatif. */
  readonly constantes = computed(() => {
    const v = this.valeurs();
    return [
      { libelle: 'Tension artérielle', ok: !!(v.tensionArterielle ?? '').toString().trim() },
      { libelle: 'Poids', ok: v.poidsKg !== null && v.poidsKg !== undefined && `${v.poidsKg}` !== '' },
      { libelle: 'Température', ok: v.temperatureC !== null && v.temperatureC !== undefined && `${v.temperatureC}` !== '' },
      { libelle: 'Hauteur utérine', ok: v.hauteurUterineCm !== null && v.hauteurUterineCm !== undefined && `${v.hauteurUterineCm}` !== '' },
      { libelle: 'BCF', ok: v.battementsCoeurFoetal !== null && v.battementsCoeurFoetal !== undefined && `${v.battementsCoeurFoetal}` !== '' },
      { libelle: 'FC maternelle', ok: v.frequenceCardiaqueMaternelle !== null && v.frequenceCardiaqueMaternelle !== undefined && `${v.frequenceCardiaqueMaternelle}` !== '' },
      { libelle: 'Protéinurie', ok: !!v.proteinurie },
      { libelle: 'Glycosurie', ok: !!v.glycosurie },
    ];
  });
  readonly nombreConstantes = computed(() => this.constantes().filter((c) => c.ok).length);

  initiales(nom: string): string {
    return nom.replace(/\(.*\)/, '').trim().split(/\s+/).slice(0, 2).map((m) => m.charAt(0).toUpperCase()).join('');
  }

  constructor() {
    // Patientes suivies par le soignant connecté (cloisonnement côté serveur)
    this.grossesseService.listerActives().subscribe({
      next: (liste) => this.patientes.set(liste),
      error: (err) => this.erreur.set(messageErreur(err, 'Impossible de charger vos patientes.')),
    });
    this.etablissementService.mesEtablissements().subscribe({
      next: (liste) => this.etablissements.set(liste),
    });
    effect(() => {
      const gId = this.grossesseId();
      if (gId) {
        this.form.patchValue({ grossesseId: Number(gId) });
      }
    });
  }

  invalide(nom: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[nom];
    return (c.invalid && c.touched) || !!this.erreursServeur()[nom];
  }

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enregistrement.set(true);
    this.erreur.set(null);
    this.erreursServeur.set({});

    const v = this.form.getRawValue();
    const rdvId = this.rendezVousId();
    this.consultationService
      .enregistrer({
        grossesseId: Number(v.grossesseId),
        rendezVousId: rdvId ? Number(rdvId) : null,
        etablissementId: v.etablissementId,
        poidsKg: v.poidsKg,
        tensionArterielle: v.tensionArterielle?.trim() || null,
        temperatureC: v.temperatureC,
        hauteurUterineCm: v.hauteurUterineCm,
        battementsCoeurFoetal: v.battementsCoeurFoetal,
        frequenceCardiaqueMaternelle: v.frequenceCardiaqueMaternelle,
        proteinurie: v.proteinurie || null,
        glycosurie: v.glycosurie || null,
        observations: v.observations?.trim() || null,
        diagnostic: v.diagnostic?.trim() || null,
        traitement: v.traitement?.trim() || null,
        prescriptions: v.prescriptions?.trim() || null,
      })
      .subscribe({
        next: (consultation) => {
          this.enregistrement.set(false);
          this.router.navigate(['/consultations', consultation.id]);
        },
        error: (err) => {
          this.enregistrement.set(false);
          this.erreursServeur.set(champsInvalides(err));
          this.erreur.set(messageErreur(err, "Impossible d'enregistrer la consultation. Vérifiez les informations."));
        },
      });
  }
}
