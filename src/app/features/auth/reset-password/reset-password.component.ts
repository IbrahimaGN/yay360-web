import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';
import { VALIDATEURS_MOT_DE_PASSE } from '../../../core/validators/validateurs';
import { messageErreur } from '../../../core/utils/message-erreur';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { FeuillageComponent } from '../../../shared/components/feuillage/feuillage.component';

@Component({
  selector: 'yay360-reset-password',
  standalone: true,
  imports: [ThemeToggleComponent, ReactiveFormsModule, RouterLink, IconComponent, FeuillageComponent],
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
  readonly motDePasseVisible = signal(false);

  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  /** Lien ouvert sans jeton : inutile d'afficher le formulaire. */
  readonly lienInvalide = !this.token;

  readonly form = this.fb.nonNullable.group({
    nouveauMotDePasse: ['', VALIDATEURS_MOT_DE_PASSE],
    confirmation: ['', [Validators.required]],
  });

  /** Règles du mot de passe affichées en direct (identiques au backend). */
  private readonly motDePasse = toSignal(this.form.controls.nouveauMotDePasse.valueChanges, { initialValue: '' });
  readonly reglesMotDePasse = computed(() => {
    const valeur = this.motDePasse();
    return [
      { libelle: '8 caractères minimum', ok: valeur.length >= 8 },
      { libelle: 'Au moins une lettre', ok: /[A-Za-z]/.test(valeur) },
      { libelle: 'Au moins un chiffre', ok: /\d/.test(valeur) },
    ];
  });

  readonly differents = signal(false);

  soumettre(): void {
    const { nouveauMotDePasse, confirmation } = this.form.getRawValue();
    this.differents.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (nouveauMotDePasse !== confirmation) {
      this.differents.set(true);
      return;
    }

    if (!this.token) {
      this.erreur.set('Lien de réinitialisation invalide ou expiré.');
      return;
    }

    this.chargement.set(true);
    this.erreur.set(null);

    this.authService.reinitialiserMotDePasse(this.token, nouveauMotDePasse).subscribe({
      next: () => {
        this.chargement.set(false);
        this.reussi.set(true);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(messageErreur(err, 'Lien invalide ou expiré. Refaites une demande de réinitialisation.'));
      },
    });
  }
}
