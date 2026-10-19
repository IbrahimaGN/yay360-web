import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'yay360-dossier-familial',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './dossier-familial.component.html',
  styleUrl: './dossier-familial.component.scss',
})
export class DossierFamilialComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly estFemme = computed(() => this.auth.hasRole('FEMME_ENCEINTE'));
  readonly chargement = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  inviter(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.chargement.set(true);
    this.erreur.set(null);
    this.message.set(null);

    this.http.post<{ message: string }>(`${environment.apiUrl}/famille/inviter-conjoint`, {
      email: this.form.getRawValue().email?.trim(),
    }).subscribe({
      next: (response) => {
        this.chargement.set(false);
        this.message.set(response.message);
        this.form.reset();
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(err?.error?.message ?? "Impossible de créer l'invitation. Vérifiez l'adresse et réessayez.");
      },
    });
  }
}
