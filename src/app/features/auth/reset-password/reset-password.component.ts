import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'yay360-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly chargement = signal(false);
  readonly reussi = signal(false);
  readonly erreur = signal<string | null>(null);

  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  readonly form = this.fb.group({
    nouveauMotDePasse: ['', [Validators.required, Validators.minLength(6)]],
    confirmation: ['', [Validators.required]],
  });

  soumettre(): void {
    const { nouveauMotDePasse, confirmation } = this.form.getRawValue();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (nouveauMotDePasse !== confirmation) {
      this.erreur.set('Les deux mots de passe ne correspondent pas.');
      return;
    }

    if (!this.token) {
      this.erreur.set('Lien de réinitialisation invalide ou expiré.');
      return;
    }

    this.chargement.set(true);
    this.erreur.set(null);

    this.authService.reinitialiserMotDePasse(this.token, nouveauMotDePasse!).subscribe({
      next: () => {
        this.chargement.set(false);
        this.reussi.set(true);
      },
      error: () => {
        this.chargement.set(false);
        this.erreur.set('Lien invalide ou expiré. Refaites une demande de réinitialisation.');
      },
    });
  }
}
