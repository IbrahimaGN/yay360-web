import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { FeuillageComponent } from '../../../shared/components/feuillage/feuillage.component';

@Component({
  selector: 'yay360-forgot-password',
  standalone: true,
  imports: [ThemeToggleComponent, ReactiveFormsModule, RouterLink, IconComponent, FeuillageComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly chargement = signal(false);
  readonly envoye = signal(false);
  readonly erreur = signal<string | null>(null);
  /** Adresse saisie, rappelée sur l'écran de confirmation. */
  readonly emailEnvoye = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get emailInvalide(): boolean {
    const c = this.form.controls.email;
    return c.invalid && c.touched;
  }

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.getRawValue().email.trim();
    this.chargement.set(true);
    this.erreur.set(null);

    this.authService.motDePasseOublie(email).subscribe({
      next: () => {
        this.chargement.set(false);
        this.emailEnvoye.set(email);
        this.envoye.set(true);
      },
      error: () => {
        this.chargement.set(false);
        this.erreur.set('Une erreur est survenue. Réessayez dans quelques instants.');
      },
    });
  }

  /** Revient au formulaire pour saisir une autre adresse. */
  modifierEmail(): void {
    this.envoye.set(false);
    this.erreur.set(null);
  }
}
