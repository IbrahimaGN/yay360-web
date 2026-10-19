import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'yay360-accepter-invitation',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './accepter-invitation.component.html',
  styleUrl: './accepter-invitation.component.scss',
})
export class AccepterInvitationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);

  readonly chargement = signal(false);
  readonly erreur = signal<string | null>(null);

  readonly form = this.fb.group({
    token: [this.route.snapshot.queryParamMap.get('token') ?? '', [Validators.required]],
    email: [this.route.snapshot.queryParamMap.get('email') ?? '', [Validators.required, Validators.email]],
    nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    prenom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.pattern('^(?=.*[A-Za-z])(?=.*\\d).+$')]],
    telephone: ['', [Validators.required]],
    dateNaissance: ['', [Validators.required]],
  });

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.chargement.set(true);
    this.erreur.set(null);
    const valeurs = this.form.getRawValue();

    this.authService.accepterInvitationConjoint({
      token: valeurs.token!.trim(),
      email: valeurs.email!.trim(),
      nom: valeurs.nom!.trim(),
      prenom: valeurs.prenom!.trim(),
      password: valeurs.password!,
      telephone: valeurs.telephone!.trim(),
      dateNaissance: valeurs.dateNaissance!,
    }).subscribe({
      next: () => {
        this.chargement.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(err?.error?.message ?? "L'invitation est invalide ou expirée. Vérifiez les informations reçues.");
      },
    });
  }
}
