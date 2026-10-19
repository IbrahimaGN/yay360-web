import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreerCompteRequest, UtilisateurService } from '../../core/services/utilisateur.service';
import { Role, Utilisateur } from '../../core/models/utilisateur.model';

type CleOnglet = 'TOUS' | Role;

@Component({
  selector: 'yay360-utilisateurs-liste',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './utilisateurs-liste.component.html',
  styleUrl: './utilisateurs-liste.component.scss',
})
export class UtilisateursListeComponent {
  private readonly utilisateurService = inject(UtilisateurService);
  private readonly fb = inject(FormBuilder);

  readonly onglets: { cle: CleOnglet; label: string }[] = [
    { cle: 'TOUS', label: 'Tous' },
    { cle: 'FEMME_ENCEINTE', label: 'Femmes enceintes' },
    { cle: 'MEDECIN', label: 'Médecins' },
    { cle: 'SAGE_FEMME', label: 'Sages-femmes' },
    { cle: 'ADMIN', label: 'Admins' },
  ];

  readonly ongletActif = signal<CleOnglet>('TOUS');
  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly utilisateurs = signal<Utilisateur[]>([]);
  readonly idEnAction = signal<number | null>(null);

  readonly formulaireOuvert = signal(false);
  readonly enregistrement = signal(false);
  readonly erreurFormulaire = signal<string | null>(null);

  readonly form = this.fb.group({
    nom: ['', [Validators.required]],
    prenom: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    telephone: ['', [Validators.required]],
    dateNaissance: ['', [Validators.required]],
    role: ['MEDECIN' as Role, [Validators.required]],
  });

  constructor() {
    this.charger();
  }

  changerOnglet(cle: CleOnglet): void {
    if (cle === this.ongletActif()) return;
    this.ongletActif.set(cle);
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);

    const cle = this.ongletActif();
    this.utilisateurService.listerTous(cle === 'TOUS' ? undefined : cle).subscribe({
      next: (liste) => {
        this.utilisateurs.set(liste);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set('Impossible de charger les utilisateurs.');
        this.chargement.set(false);
      },
    });
  }

  ouvrirCreation(): void {
    this.form.reset({ role: 'MEDECIN' });
    this.erreurFormulaire.set(null);
    this.formulaireOuvert.set(true);
  }

  fermerFormulaire(): void {
    this.formulaireOuvert.set(false);
  }

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enregistrement.set(true);
    this.erreurFormulaire.set(null);

    const request = this.form.getRawValue() as CreerCompteRequest;

    this.utilisateurService.creerCompte(request).subscribe({
      next: () => {
        this.enregistrement.set(false);
        this.formulaireOuvert.set(false);
        this.charger();
      },
      error: (err) => {
        this.enregistrement.set(false);
        this.erreurFormulaire.set(
          err?.error?.message || "Impossible de créer ce compte. Vérifiez les informations saisies."
        );
      },
    });
  }

  activer(u: Utilisateur): void {
    this.idEnAction.set(u.id);
    this.utilisateurService.activer(u.id).subscribe({
      next: () => {
        this.idEnAction.set(null);
        this.charger();
      },
      error: () => this.idEnAction.set(null),
    });
  }

  desactiver(u: Utilisateur): void {
    this.idEnAction.set(u.id);
    this.utilisateurService.desactiver(u.id).subscribe({
      next: () => {
        this.idEnAction.set(null);
        this.charger();
      },
      error: () => this.idEnAction.set(null),
    });
  }

  supprimer(u: Utilisateur): void {
    if (!confirm(`Supprimer définitivement le compte de ${u.prenom} ${u.nom} ?`)) return;
    this.utilisateurService.supprimer(u.id).subscribe({
      next: () => this.charger(),
    });
  }
}
