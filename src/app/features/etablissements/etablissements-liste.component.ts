import { messageErreur } from '../../core/utils/message-erreur';
import { MOTIF_TELEPHONE_ETABLISSEMENT } from '../../core/validators/validateurs';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { StateComponent } from '../../shared/components/state/state.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EtablissementService } from '../../core/services/etablissement.service';
import { UtilisateurService } from '../../core/services/utilisateur.service';
import {
  AffecterProfessionnelRequest,
  EtablissementDto,
  TYPES_ETABLISSEMENT,
} from '../../core/models/etablissement.model';
import { Utilisateur } from '../../core/models/utilisateur.model';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { libelleRole } from '../../core/utils/libelles';
import { initiales } from '../../core/utils/affichage';

type FiltreStatut = 'TOUS' | 'ACTIFS' | 'INACTIFS';

@Component({
  selector: 'yay360-etablissements-liste',
  standalone: true,
  imports: [StateComponent, ReactiveFormsModule, IconComponent],
  templateUrl: './etablissements-liste.component.html',
  styleUrl: './etablissements-liste.component.scss',
})
export class EtablissementsListeComponent {
  private readonly etablissementService = inject(EtablissementService);
  private readonly utilisateurService = inject(UtilisateurService);
  private readonly fb = inject(FormBuilder);

  readonly types = TYPES_ETABLISSEMENT;
  readonly libelleRole = libelleRole;
  readonly professionnels = signal<Utilisateur[]>([]);

  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  /** Échec d'une action (création, désactivation, affectation…) : toujours affiché. */
  readonly erreurAction = signal<string | null>(null);
  readonly succes = signal<string | null>(null);
  readonly etablissements = signal<EtablissementDto[]>([]);

  readonly formulaireOuvert = signal(false);
  readonly idEnEdition = signal<number | null>(null);
  readonly enregistrement = signal(false);
  readonly idProfessionnelParEtablissement = signal<Record<number, string>>({});
  readonly affectationOuverte = signal<number | null>(null);

  /** Confirmation d'une action sensible (remplace la boîte native du navigateur). */
  readonly confirmation = signal<{ mode: 'desactiver' | 'supprimer'; etablissement: EtablissementDto } | null>(null);
  readonly actionEnCours = signal(false);

  readonly recherche = signal('');
  readonly filtreType = signal('');
  readonly filtreStatut = signal<FiltreStatut>('TOUS');

  readonly stats = computed(() => {
    const l = this.etablissements();
    return {
      total: l.length,
      actifs: l.filter((e) => e.actif).length,
      inactifs: l.filter((e) => !e.actif).length,
      professionnels: l.reduce((n, e) => n + e.professionnels.length, 0),
    };
  });

  readonly etablissementsFiltres = computed(() => {
    const terme = this.recherche().trim().toLowerCase();
    const type = this.filtreType();
    const statut = this.filtreStatut();
    return this.etablissements()
      .filter((e) =>
        (!type || e.type === type) &&
        (statut === 'TOUS' || (statut === 'ACTIFS' ? e.actif : !e.actif)) &&
        (!terme || e.nom.toLowerCase().includes(terme) || (e.ville ?? '').toLowerCase().includes(terme) || e.adresse.toLowerCase().includes(terme)))
      .sort((a, b) => Number(b.actif) - Number(a.actif) || a.nom.localeCompare(b.nom, 'fr'));
  });
  readonly filtresActifs = computed(() => !!this.recherche().trim() || !!this.filtreType() || this.filtreStatut() !== 'TOUS');

  readonly form = this.fb.group({
    nom: ['', [Validators.required]],
    type: ['CENTRE_DE_SANTE', [Validators.required]],
    adresse: ['', [Validators.required]],
    ville: [''],
    telephone: ['', [Validators.required, Validators.pattern(MOTIF_TELEPHONE_ETABLISSEMENT)]],
    email: ['', [Validators.email]],
  });

  constructor() {
    this.charger();
    this.chargerProfessionnels();
  }

  @HostListener('document:keydown.escape')
  onEchap(): void {
    if (this.confirmation()) this.confirmation.set(null);
    else if (this.formulaireOuvert()) this.fermerFormulaire();
  }

  libelleType(type: string): string {
    return this.types.find((t) => t.value === type)?.label ?? type;
  }

  invalide(nom: 'nom' | 'type' | 'adresse' | 'ville' | 'telephone' | 'email'): boolean {
    const c = this.form.controls[nom];
    return c.invalid && c.touched;
  }

  readonly initiales = initiales;

  reinitialiserFiltres(): void {
    this.recherche.set('');
    this.filtreType.set('');
    this.filtreStatut.set('TOUS');
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
      error: (err) => {
        this.erreur.set(messageErreur(err, 'Impossible de charger les établissements.'));
        this.chargement.set(false);
      },
    });
  }

  ouvrirCreation(): void {
    this.idEnEdition.set(null);
    this.form.reset({ type: 'CENTRE_DE_SANTE' });
    this.erreurAction.set(null);
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
    this.erreurAction.set(null);
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
    this.erreurAction.set(null);
    const valeurs = this.form.getRawValue();
    const request = {
      nom: valeurs.nom!.trim(),
      type: valeurs.type!,
      adresse: valeurs.adresse!.trim(),
      ville: valeurs.ville?.trim() || undefined,
      telephone: valeurs.telephone!.trim(),
      email: valeurs.email?.trim() || undefined,
    };

    const idEdition = this.idEnEdition();
    const requete = idEdition
      ? this.etablissementService.mettreAJour(idEdition, request)
      : this.etablissementService.creer(request);

    requete.subscribe({
      next: () => {
        this.enregistrement.set(false);
        this.fermerFormulaire();
        this.succes.set(idEdition ? 'Établissement mis à jour.' : 'Établissement créé.');
        this.charger();
      },
      error: (err) => {
        this.enregistrement.set(false);
        this.erreurAction.set(messageErreur(err, "Impossible d'enregistrer cet établissement."));
      },
    });
  }

  demanderConfirmation(mode: 'desactiver' | 'supprimer', etablissement: EtablissementDto): void {
    this.erreurAction.set(null);
    this.confirmation.set({ mode, etablissement });
  }

  confirmerAction(): void {
    const c = this.confirmation();
    if (!c) return;
    this.actionEnCours.set(true);
    const requete = c.mode === 'desactiver'
      ? this.etablissementService.desactiver(c.etablissement.id)
      : this.etablissementService.supprimer(c.etablissement.id);
    requete.subscribe({
      next: () => {
        this.actionEnCours.set(false);
        this.confirmation.set(null);
        this.succes.set(c.mode === 'desactiver' ? `« ${c.etablissement.nom} » a été désactivé.` : `« ${c.etablissement.nom} » a été supprimé.`);
        this.charger();
      },
      error: (err) => {
        this.actionEnCours.set(false);
        this.confirmation.set(null);
        this.erreurAction.set(messageErreur(err, c.mode === 'desactiver'
          ? 'Impossible de désactiver cet établissement.'
          : 'Suppression impossible : préférez la désactivation si l’établissement a des données.'));
      },
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
    this.erreurAction.set(null);
    this.etablissementService.affecterProfessionnel(etablissement.id, request).subscribe({
      next: () => {
        this.mettreAJourIdProfessionnel(etablissement.id, '');
        this.affectationOuverte.set(null);
        this.succes.set(`Professionnel affecté à « ${etablissement.nom} ».`);
        this.charger();
      },
      error: (err) => this.erreurAction.set(messageErreur(err, "Impossible d'affecter ce professionnel.")),
    });
  }
}
