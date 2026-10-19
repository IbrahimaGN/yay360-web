import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'yay360-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly chargement = signal(false);
  readonly envoye = signal(false);
  readonly erreur = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.chargement.set(true);
    this.erreur.set(null);

    this.authService.motDePasseOublie(this.form.getRawValue().email!).subscribe({
      next: () => {
        this.chargement.set(false);
        this.envoye.set(true);
      },
      error: () => {
        this.chargement.set(false);
        this.erreur.set("Une erreur est survenue. Réessayez dans quelques instants.");
      },
    });
  }
}
