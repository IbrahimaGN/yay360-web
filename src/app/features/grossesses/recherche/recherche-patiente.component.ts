import { StateComponent } from '../../../shared/components/state/state.component';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GrossesseService } from '../../../core/services/grossesse.service';
import { EtablissementService } from '../../../core/services/etablissement.service';
import { PatienteRechercheDto } from '../../../core/models/grossesse.model';
import { EtablissementDto } from '../../../core/models/etablissement.model';
import { messageErreur } from '../../../core/utils/message-erreur';
import { MOTIF_TELEPHONE_SENEGAL } from '../../../core/validators/validateurs';
import { HostListener, computed } from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';

/**
 * Prise en charge d'une patiente qui se présente : recherche exacte par téléphone ou email
 * (aucune donnée clinique renvoyée), puis rattachement du dossier à l'établissement du soignant.
 * Le téléphone de la patiente sert de preuve de présence.
 */
@Component({
  selector: 'yay360-recherche-patiente',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, StateComponent, IconComponent],
  templateUrl: './recherche-patiente.component.html',
  styleUrl: './recherche-patiente.component.scss',
})
export class RecherchePatienteComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly grossesseService = inject(GrossesseService);
  private readonly etablissementService = inject(EtablissementService);

  readonly mode = signal<'telephone' | 'email'>('telephone');
  readonly recherche = signal(false);
  readonly resultats = signal<PatienteRechercheDto[] | null>(null);
  readonly erreur = signal<string | null>(null);
  readonly etablissements = signal<EtablissementDto[]>([]);
  readonly selection = signal<PatienteRechercheDto | null>(null);
  readonly rattachement = signal(false);
  readonly erreurRattachement = signal<string | null>(null);

  readonly formRecherche = this.fb.group({
    valeur: ['', [Validators.required]],
  });

  readonly formRattacher = this.fb.group({
    etablissementId: [null as number | null, [Validators.required]],
    telephonePatiente: ['', [Validators.required, Validators.pattern(MOTIF_TELEPHONE_SENEGAL)]],
  });

  /** Étape courante du parcours : 1 rechercher, 2 choisir, 3 rattacher. */
  readonly etape = computed(() => (this.selection() ? 3 : this.resultats()?.length ? 2 : 1));

  initiales(p: PatienteRechercheDto): string {
    return `${p.prenom.charAt(0)}${p.nom.charAt(0)}`.toUpperCase();
  }

  @HostListener('document:keydown.escape')
  onEchap(): void {
    if (this.selection()) this.selection.set(null);
  }

  constructor() {
    this.etablissementService.mesEtablissements().subscribe({
      next: (liste) => {
        this.etablissements.set(liste);
        if (liste.length === 1) {
          this.formRattacher.patchValue({ etablissementId: liste[0].id });
        }
      },
    });
  }

  changerMode(mode: 'telephone' | 'email'): void {
    this.mode.set(mode);
    this.formRecherche.reset();
    this.resultats.set(null);
    this.erreur.set(null);
  }

  rechercher(): void {
    const valeur = (this.formRecherche.value.valeur ?? '').trim().replace(/\s+/g, '');
    if (!valeur) {
      this.formRecherche.markAllAsTouched();
      return;
    }
    this.recherche.set(true);
    this.erreur.set(null);
    this.selection.set(null);
    const critere = this.mode() === 'telephone' ? { telephone: valeur } : { email: valeur };
    this.grossesseService.rechercher(critere).subscribe({
      next: (liste) => {
        this.recherche.set(false);
        this.resultats.set(liste);
      },
      error: (err) => {
        this.recherche.set(false);
        this.erreur.set(messageErreur(err, 'La recherche a échoué.'));
      },
    });
  }

  choisir(p: PatienteRechercheDto): void {
    if (p.dejaSuivie) {
      void this.router.navigate(['/grossesses', p.grossesseId]);
      return;
    }
    this.selection.set(p);
    this.erreurRattachement.set(null);
    const telephone = this.mode() === 'telephone' ? (this.formRecherche.value.valeur ?? '').replace(/\s+/g, '') : '';
    this.formRattacher.patchValue({ telephonePatiente: telephone });
  }

  rattacher(): void {
    const p = this.selection();
    if (!p || this.formRattacher.invalid) {
      this.formRattacher.markAllAsTouched();
      return;
    }
    const v = this.formRattacher.getRawValue();
    this.rattachement.set(true);
    this.erreurRattachement.set(null);
    this.grossesseService
      .rattacher(p.grossesseId, { etablissementId: v.etablissementId!, telephonePatiente: v.telephonePatiente!.trim() })
      .subscribe({
        next: (g) => {
          this.rattachement.set(false);
          void this.router.navigate(['/grossesses', g.id]);
        },
        error: (err) => {
          this.rattachement.set(false);
          this.erreurRattachement.set(messageErreur(err, 'Le rattachement a échoué.'));
        },
      });
  }
}
