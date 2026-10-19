import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EtablissementService } from '../../core/services/etablissement.service';
import { UtilisateurService } from '../../core/services/utilisateur.service';
import {
  AffecterProfessionnelRequest,
  EtablissementDto,
  TYPES_ETABLISSEMENT,
} from '../../core/models/etablissement.model';
import { Utilisateur } from '../../core/models/utilisateur.model';

@Component({
  selector: 'yay360-etablissements-liste',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './etablissements-liste.component.html',
  styleUrl: './etablissements-liste.component.scss',
})
export class EtablissementsListeComponent {
  private readonly etablissementService = inject(EtablissementService);
  private readonly utilisateurService = inject(UtilisateurService);
  private readonly fb = inject(FormBuilder);

  readonly types = TYPES_ETABLISSEMENT;
  readonly professionnels = signal<Utilisateur[]>([]);

  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly etablissements = signal<EtablissementDto[]>([]);

  readonly formulaireOuvert = signal(false);
  readonly idEnEdition = signal<number | null>(null);
  readonly enregistrement = signal(false);
  readonly idProfessionnelParEtablissement = signal<Record<number, string>>({});

  readonly form = this.fb.group({
    nom: ['', [Validators.required]],
    type: ['CENTRE_DE_SANTE', [Validators.required]],
    adresse: ['', [Validators.required]],
    ville: [''],
    telephone: ['', [Validators.required]],
    email: [''],
  });

  constructor() {
    this.charger();
    this.chargerProfessionnels();
  }

  private chargerProfessionnels(): void {
    this.utilisateurService.listerTous('MEDECIN').subscribe({
      next: (medecins) => {
        this.utilisateurService.listerTous('SAGE_FEMME').subscribe({
          next: (sagesFemmes) => {
            this.professionnels.set([...medecins, ...sagesFemmes].filter((p) => p.actif));
          },
        });
      },
    });
  }

  charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);

    this.etablissementService.listerTous().subscribe({
      next: (liste) => {
        this.etablissements.set(liste);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set('Impossible de charger les établissements.');
        this.chargement.set(false);
      },
    });
  }

  ouvrirCreation(): void {
    this.idEnEdition.set(null);
    this.form.reset({ type: 'CENTRE_DE_SANTE' });
    this.formulaireOuvert.set(true);
  }

  ouvrirEdition(etablissement: EtablissementDto): void {
    this.idEnEdition.set(etablissement.id);
    this.form.reset({
      nom: etablissement.nom,
      type: etablissement.type,
      adresse: etablissement.adresse,
      ville: etablissement.ville ?? '',
      telephone: etablissement.telephone ?? '',
      email: etablissement.email ?? '',
    });
    this.formulaireOuvert.set(true);
  }

  fermerFormulaire(): void {
    this.formulaireOuvert.set(false);
    this.idEnEdition.set(null);
  }

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enregistrement.set(true);
    const valeurs = this.form.getRawValue();
    const request = {
      nom: valeurs.nom!,
      type: valeurs.type!,
      adresse: valeurs.adresse!,
      ville: valeurs.ville || undefined,
      telephone: valeurs.telephone!,
      email: valeurs.email || undefined,
    };

    const idEdition = this.idEnEdition();
    const requete = idEdition
      ? this.etablissementService.mettreAJour(idEdition, request)
      : this.etablissementService.creer(request);

    requete.subscribe({
      next: () => {
        this.enregistrement.set(false);
        this.fermerFormulaire();
        this.charger();
      },
      error: () => this.enregistrement.set(false),
    });
  }

  desactiver(etablissement: EtablissementDto): void {
    this.etablissementService.desactiver(etablissement.id).subscribe({
      next: () => this.charger(),
    });
  }

  supprimer(etablissement: EtablissementDto): void {
    if (!confirm(`Supprimer définitivement « ${etablissement.nom} » ?`)) return;
    this.etablissementService.supprimer(etablissement.id).subscribe({
      next: () => this.charger(),
    });
  }

  mettreAJourIdProfessionnel(etablissementId: number, valeur: string): void {
    this.idProfessionnelParEtablissement.update((m) => ({ ...m, [etablissementId]: valeur }));
  }

  affecterProfessionnel(etablissement: EtablissementDto): void {
    const idTexte = this.idProfessionnelParEtablissement()[etablissement.id];
    const professionnelId = Number(idTexte);
    if (!professionnelId) return;

    const request: AffecterProfessionnelRequest = { professionnelId };
    this.etablissementService.affecterProfessionnel(etablissement.id, request).subscribe({
      next: () => {
        this.mettreAJourIdProfessionnel(etablissement.id, '');
        this.charger();
      },
    });
  }
}
