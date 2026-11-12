import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';
import { VALIDATEURS_MOT_DE_PASSE, VALIDATEURS_NOM, MOTIF_TELEPHONE_SENEGAL, AIDE_TELEPHONE } from '../../../core/validators/validateurs';
import { messageErreur } from '../../../core/utils/message-erreur';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { FeuillageComponent } from '../../../shared/components/feuillage/feuillage.component';

@Component({
  selector: 'yay360-register',
  standalone: true,
  imports: [ThemeToggleComponent, ReactiveFormsModule, RouterLink, IconComponent, FeuillageComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly chargement = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly motDePasseVisible = signal(false);
  readonly anneeNaissanceMax = this.dateNaissanceMaximale();
  readonly aideTelephone = AIDE_TELEPHONE;

  readonly form = this.fb.nonNullable.group({
    prenom: ['', VALIDATEURS_NOM],
    nom: ['', VALIDATEURS_NOM],
    email: ['', [Validators.required, Validators.email]],
    telephone: ['', [Validators.required, Validators.pattern(MOTIF_TELEPHONE_SENEGAL)]],
    dateNaissance: ['', [Validators.required]],
    password: ['', VALIDATEURS_MOT_DE_PASSE],
    confirmation: ['', [Validators.required]],
  });

  /** Règles du mot de passe affichées en direct (identiques au backend). */
  private readonly motDePasse = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });
  readonly reglesMotDePasse = computed(() => {
    const valeur = this.motDePasse();
    return [
      { libelle: '8 caractères minimum', ok: valeur.length >= 8 },
      { libelle: 'Au moins une lettre', ok: /[A-Za-z]/.test(valeur) },
      { libelle: 'Au moins un chiffre', ok: /\d/.test(valeur) },
    ];
  });

  private dateNaissanceMaximale(): string {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  invalide(nom: 'prenom' | 'nom' | 'email' | 'telephone' | 'dateNaissance' | 'password' | 'confirmation'): boolean {
    const controle = this.form.controls[nom];
    return controle.invalid && controle.touched;
  }

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valeurs = this.form.getRawValue();
    if (valeurs.password !== valeurs.confirmation) {
      this.form.controls.confirmation.setErrors({ mismatch: true });
      return;
    }

    this.chargement.set(true);
    this.erreur.set(null);
    this.authService.inscrire({
      prenom: valeurs.prenom.trim(),
      nom: valeurs.nom.trim(),
      email: valeurs.email.trim(),
      telephone: valeurs.telephone.trim(),
      dateNaissance: valeurs.dateNaissance,
      password: valeurs.password,
      role: 'FEMME_ENCEINTE',
    }).subscribe({
      next: () => {
        this.chargement.set(false);
        this.router.navigate(['/accueil']);
      },
      error: (err: HttpErrorResponse) => {
        this.chargement.set(false);
        this.erreur.set(messageErreur(err, 'Une erreur est survenue. Vérifiez les informations saisies puis réessayez.'));
      },
    });
  }
}
