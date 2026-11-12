import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { messageErreur } from '../../../core/utils/message-erreur';
import { VALIDATEURS_MOT_DE_PASSE, identiqueA } from '../../../core/validators/validateurs';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { FeuillageComponent } from '../../../shared/components/feuillage/feuillage.component';

/**
 * Changement obligatoire du mot de passe temporaire fourni par l'administrateur.
 * Tant qu'il n'est pas changé, le serveur refuse toute autre action.
 */
@Component({
  selector: 'yay360-changer-mot-de-passe',
  standalone: true,
  imports: [ThemeToggleComponent, ReactiveFormsModule, IconComponent, FeuillageComponent],
  templateUrl: './changer-mot-de-passe.component.html',
  styleUrl: './changer-mot-de-passe.component.scss',
})
export class ChangerMotDePasseComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  readonly chargement = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly ancienVisible = signal(false);
  readonly nouveauVisible = signal(false);

  readonly form = this.fb.nonNullable.group({
    ancienMotDePasse: ['', [Validators.required]],
    nouveauMotDePasse: ['', VALIDATEURS_MOT_DE_PASSE],
    confirmation: ['', [Validators.required, identiqueA('nouveauMotDePasse')]],
  });

  /** Règles affichées en direct : celles du backend + différent du mot de passe temporaire. */
  private readonly valeurs = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly reglesMotDePasse = computed(() => {
    const nouveau = this.valeurs().nouveauMotDePasse ?? '';
    const ancien = this.valeurs().ancienMotDePasse ?? '';
    return [
      { libelle: '8 caractères minimum', ok: nouveau.length >= 8 },
      { libelle: 'Au moins une lettre', ok: /[A-Za-z]/.test(nouveau) },
      { libelle: 'Au moins un chiffre', ok: /\d/.test(nouveau) },
      { libelle: 'Différent du mot de passe temporaire', ok: nouveau.length > 0 && nouveau !== ancien },
    ];
  });

  constructor() {
    this.form.controls.nouveauMotDePasse.valueChanges.subscribe(() =>
      this.form.controls.confirmation.updateValueAndValidity({ emitEvent: false })
    );
  }

  invalide(nom: 'ancienMotDePasse' | 'nouveauMotDePasse' | 'confirmation'): boolean {
    const c = this.form.controls[nom];
    return c.invalid && c.touched;
  }

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { ancienMotDePasse, nouveauMotDePasse } = this.form.getRawValue();
    if (ancienMotDePasse === nouveauMotDePasse) {
      this.erreur.set("Le nouveau mot de passe doit être différent de l'ancien.");
      return;
    }
    this.chargement.set(true);
    this.erreur.set(null);
    this.authService.changerMotDePasse(ancienMotDePasse, nouveauMotDePasse).subscribe({
      next: () => {
        this.chargement.set(false);
        this.router.navigate(['/accueil']);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(messageErreur(err, 'Impossible de changer le mot de passe.'));
      },
    });
  }

  seDeconnecter(): void {
    this.authService.logout();
    this.router.navigate(['/connexion']);
  }
}
