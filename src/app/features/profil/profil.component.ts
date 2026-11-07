import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StateComponent } from '../../shared/components/state/state.component';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UtilisateurService } from '../../core/services/utilisateur.service';
import { AuthService } from '../../core/services/auth.service';
import { Utilisateur } from '../../core/models/utilisateur.model';
import { messageErreur } from '../../core/utils/message-erreur';
import { libelleRole } from '../../core/utils/libelles';
import {
  AIDE_MOT_DE_PASSE,
  AIDE_TELEPHONE,
  MOTIF_TELEPHONE_SENEGAL,
  VALIDATEURS_MOT_DE_PASSE,
  VALIDATEURS_NOM,
  identiqueA,
} from '../../core/validators/validateurs';

@Component({
  selector: 'yay360-profil',
  standalone: true,
  imports: [StateComponent, DatePipe, ReactiveFormsModule, IconComponent],
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.scss',
})
export class ProfilComponent {
  private readonly utilisateurService = inject(UtilisateurService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly libelleRole = libelleRole;
  readonly aideMotDePasse = AIDE_MOT_DE_PASSE;
  readonly aideTelephone = AIDE_TELEPHONE;

  readonly chargement = signal(true);
  readonly erreurChargement = signal<string | null>(null);
  readonly profil = signal<Utilisateur | null>(null);

  readonly enregistrementProfil = signal(false);
  readonly succesProfil = signal<string | null>(null);
  readonly erreurProfil = signal<string | null>(null);

  readonly enregistrementMotDePasse = signal(false);
  readonly succesMotDePasse = signal<string | null>(null);
  readonly erreurMotDePasse = signal<string | null>(null);

  readonly formProfil = this.fb.group({
    nom: ['', VALIDATEURS_NOM],
    prenom: ['', VALIDATEURS_NOM],
    telephone: ['', [Validators.required, Validators.pattern(MOTIF_TELEPHONE_SENEGAL)]],
  });

  readonly formMotDePasse = this.fb.group({
    ancienMotDePasse: ['', [Validators.required]],
    nouveauMotDePasse: ['', VALIDATEURS_MOT_DE_PASSE],
    confirmation: ['', [Validators.required, identiqueA('nouveauMotDePasse')]],
  });

  readonly motDePasseVisible = signal(false);

  /** Règles du nouveau mot de passe affichées en direct (identiques au backend). */
  private readonly valeursMdp = toSignal(this.formMotDePasse.valueChanges, { initialValue: this.formMotDePasse.getRawValue() });
  readonly reglesMotDePasse = computed(() => {
    const nouveau = this.valeursMdp().nouveauMotDePasse ?? '';
    const ancien = this.valeursMdp().ancienMotDePasse ?? '';
    return [
      { libelle: '8 caractères minimum', ok: nouveau.length >= 8 },
      { libelle: 'Au moins une lettre', ok: /[A-Za-z]/.test(nouveau) },
      { libelle: 'Au moins un chiffre', ok: /\d/.test(nouveau) },
      { libelle: 'Différent de l’actuel', ok: nouveau.length > 0 && nouveau !== ancien },
    ];
  });

  initiales(p: Utilisateur): string {
    return `${p.prenom.charAt(0)}${p.nom.charAt(0)}`.toUpperCase();
  }

  constructor() {
    this.charger();
    this.formMotDePasse.controls.nouveauMotDePasse.valueChanges.subscribe(() =>
      this.formMotDePasse.controls.confirmation.updateValueAndValidity({ emitEvent: false })
    );
  }

  charger(): void {
    this.chargement.set(true);
    this.erreurChargement.set(null);
    this.utilisateurService.obtenirMonProfil().subscribe({
      next: (p) => {
        this.profil.set(p);
        this.formProfil.patchValue({ nom: p.nom, prenom: p.prenom, telephone: p.telephone });
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreurChargement.set(messageErreur(err, 'Impossible de charger votre profil.'));
      },
    });
  }

  invalide(nom: 'nom' | 'prenom' | 'telephone'): boolean {
    const c = this.formProfil.controls[nom];
    return c.invalid && c.touched;
  }

  soumettreProfil(): void {
    if (this.formProfil.invalid) {
      this.formProfil.markAllAsTouched();
      return;
    }
    this.enregistrementProfil.set(true);
    this.succesProfil.set(null);
    this.erreurProfil.set(null);

    const v = this.formProfil.getRawValue();
    this.utilisateurService
      .mettreAJourMonProfil({ nom: v.nom!.trim(), prenom: v.prenom!.trim(), telephone: v.telephone!.trim() })
      .subscribe({
        next: (p) => {
          this.profil.set(p);
          this.authService.mettreAJourIdentite(p.nom, p.prenom);
          this.enregistrementProfil.set(false);
          this.succesProfil.set('Profil mis à jour.');
          this.formProfil.markAsPristine();
        },
        error: (err) => {
          this.enregistrementProfil.set(false);
          this.erreurProfil.set(messageErreur(err, 'La mise à jour du profil a échoué.'));
        },
      });
  }

  soumettreMotDePasse(): void {
    if (this.formMotDePasse.invalid) {
      this.formMotDePasse.markAllAsTouched();
      return;
    }
    this.enregistrementMotDePasse.set(true);
    this.erreurMotDePasse.set(null);
    this.succesMotDePasse.set(null);

    const { ancienMotDePasse, nouveauMotDePasse } = this.formMotDePasse.getRawValue();
    // Le service enregistre le nouveau jeton : la session reste ouverte
    this.authService.changerMotDePasse(ancienMotDePasse!, nouveauMotDePasse!).subscribe({
      next: (r) => {
        this.enregistrementMotDePasse.set(false);
        this.succesMotDePasse.set(r.message + ' Vos autres sessions ont été déconnectées.');
        this.formMotDePasse.reset();
      },
      error: (err) => {
        this.enregistrementMotDePasse.set(false);
        this.erreurMotDePasse.set(messageErreur(err, 'Le changement de mot de passe a échoué.'));
      },
    });
  }
}
