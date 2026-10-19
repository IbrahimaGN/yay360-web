import { Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConsultationService } from '../../../core/services/consultation.service';

@Component({
  selector: 'yay360-nouvelle-consultation',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './nouvelle-consultation.component.html',
  styleUrl: './nouvelle-consultation.component.scss',
})
export class NouvelleConsultationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly consultationService = inject(ConsultationService);
  private readonly router = inject(Router);

  // Liés automatiquement aux query params ?grossesseId=&rendezVousId= (withComponentInputBinding)
  readonly grossesseId = input<string>();
  readonly rendezVousId = input<string>();

  readonly enregistrement = signal(false);
  readonly erreur = signal<string | null>(null);

  readonly form = this.fb.group({
    grossesseId: [null as number | null, [Validators.required]],
    poidsKg: [null as number | null],
    tensionArterielle: [''],
    temperatureC: [null as number | null],
    hauteurUterineCm: [null as number | null],
    battementsCoeurFoetal: [null as number | null],
    observations: [''],
    diagnostic: [''],
    traitement: [''],
    prescriptions: [''],
  });

  constructor() {
    effect(() => {
      const gId = this.grossesseId();
      if (gId) {
        this.form.patchValue({ grossesseId: Number(gId) });
      }
    });
  }

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enregistrement.set(true);
    this.erreur.set(null);

    const valeurs = this.form.getRawValue();
    const rdvId = this.rendezVousId();

    this.consultationService
      .enregistrer({
        grossesseId: valeurs.grossesseId!,
        rendezVousId: rdvId ? Number(rdvId) : null,
        poidsKg: valeurs.poidsKg,
        tensionArterielle: valeurs.tensionArterielle || null,
        temperatureC: valeurs.temperatureC,
        hauteurUterineCm: valeurs.hauteurUterineCm,
        battementsCoeurFoetal: valeurs.battementsCoeurFoetal,
        observations: valeurs.observations || null,
        diagnostic: valeurs.diagnostic || null,
        traitement: valeurs.traitement || null,
        prescriptions: valeurs.prescriptions || null,
      })
      .subscribe({
        next: (consultation) => {
          this.enregistrement.set(false);
          this.router.navigate(['/consultations', consultation.id]);
        },
        error: () => {
          this.enregistrement.set(false);
          this.erreur.set("Impossible d'enregistrer la consultation. Vérifiez les informations.");
        },
      });
  }
}
