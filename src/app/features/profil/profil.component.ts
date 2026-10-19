import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UtilisateurService } from '../../core/services/utilisateur.service';
import { AuthService } from '../../core/services/auth.service';
import { Utilisateur } from '../../core/models/utilisateur.model';

@Component({
  selector: 'yay360-profil',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.scss',
})
export class ProfilComponent {
  private readonly utilisateurService = inject(UtilisateurService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly chargement = signal(true);
  readonly profil = signal<Utilisateur | null>(null);

  readonly enregistrementProfil = signal(false);
  readonly messageProfil = signal<string | null>(null);

  readonly enregistrementMotDePasse = signal(false);
  readonly messageMotDePasse = signal<string | null>(null);
  readonly erreurMotDePasse = signal<string | null>(null);

  readonly formProfil = this.fb.group({
    nom: ['', [Validators.required]],
    prenom: ['', [Validators.required]],
    telephone: ['', [Validators.required]],
  });

  readonly formMotDePasse = this.fb.group({
    ancienMotDePasse: ['', [Validators.required]],
    nouveauMotDePasse: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);
    this.utilisateurService.obtenirMonProfil().subscribe({
      next: (p) => {
        this.profil.set(p);
        this.formProfil.patchValue({ nom: p.nom, prenom: p.prenom, telephone: p.telephone });
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false),
    });
  }

  soumettreProfil(): void {
    if (this.formProfil.invalid) {
      this.formProfil.markAllAsTouched();
      return;
    }

    this.enregistrementProfil.set(true);
    this.messageProfil.set(null);

    const valeurs = this.formProfil.getRawValue();
    this.utilisateurService
      .mettreAJourMonProfil({ nom: valeurs.nom!, prenom: valeurs.prenom!, telephone: valeurs.telephone! })
      .subscribe({
        next: (p) => {
          this.profil.set(p);
          this.enregistrementProfil.set(false);
          this.messageProfil.set('Profil mis à jour avec succès.');
        },
        error: () => {
          this.enregistrementProfil.set(false);
          this.messageProfil.set('Erreur lors de la mise à jour.');
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
    this.messageMotDePasse.set(null);

    const { ancienMotDePasse, nouveauMotDePasse } = this.formMotDePasse.getRawValue();

    this.authService.changerMotDePasse(ancienMotDePasse!, nouveauMotDePasse!).subscribe({
      next: () => {
        this.enregistrementMotDePasse.set(false);
        this.messageMotDePasse.set('Mot de passe modifié avec succès.');
        this.formMotDePasse.reset();
      },
      error: () => {
        this.enregistrementMotDePasse.set(false);
        this.erreurMotDePasse.set("L'ancien mot de passe est incorrect.");
      },
    });
  }
}
