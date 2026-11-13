import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';
import { VALIDATEURS_MOT_DE_PASSE, VALIDATEURS_NOM, MOTIF_TELEPHONE_SENEGAL, AIDE_TELEPHONE } from '../../../core/validators/validateurs';
import { messageErreur } from '../../../core/utils/message-erreur';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { FeuillageComponent } from '../../../shared/components/feuillage/feuillage.component';

type Champ = 'token' | 'email' | 'nom' | 'prenom' | 'password' | 'telephone' | 'dateNaissance';

@Component({
  selector: 'yay360-accepter-invitation',
  standalone: true,
  imports: [ThemeToggleComponent, ReactiveFormsModule, RouterLink, IconComponent, FeuillageComponent],
  templateUrl: './accepter-invitation.component.html',
  styleUrl: './accepter-invitation.component.scss',
})
export class AccepterInvitationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly chargement = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly motDePasseVisible = signal(false);
  readonly aideTelephone = AIDE_TELEPHONE;
  readonly dateNaissanceMax = this.hier();

  private readonly tokenLien = this.route.snapshot.queryParamMap.get('token') ?? '';
  private readonly emailLien = this.route.snapshot.queryParamMap.get('email') ?? '';
  /** Le lien reçu contenait déjà le code et l'adresse : on le signale. */
  readonly invitationDetectee = !!this.tokenLien && !!this.emailLien;

  readonly form = this.fb.nonNullable.group({
    token: [this.tokenLien, [Validators.required]],
    email: [this.emailLien, [Validators.required, Validators.email]],
    nom: ['', VALIDATEURS_NOM],
    prenom: ['', VALIDATEURS_NOM],
    password: ['', VALIDATEURS_MOT_DE_PASSE],
    telephone: ['', [Validators.required, Validators.pattern(MOTIF_TELEPHONE_SENEGAL)]],
    dateNaissance: ['', [Validators.required]],
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

  private hier(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  invalide(nom: Champ): boolean {
    const c = this.form.controls[nom];
    return c.invalid && c.touched;
  }

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.chargement.set(true);
    this.erreur.set(null);
    const valeurs = this.form.getRawValue();

    this.authService.accepterInvitationConjoint({
      token: valeurs.token.trim(),
      email: valeurs.email.trim(),
      nom: valeurs.nom.trim(),
      prenom: valeurs.prenom.trim(),
      password: valeurs.password,
      telephone: valeurs.telephone.trim(),
      dateNaissance: valeurs.dateNaissance,
    }).subscribe({
      next: () => {
        this.chargement.set(false);
        void this.router.navigate(['/accueil']);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(messageErreur(err, "L'invitation est invalide ou expirée. Vérifiez les informations reçues."));
      },
    });
  }
}
