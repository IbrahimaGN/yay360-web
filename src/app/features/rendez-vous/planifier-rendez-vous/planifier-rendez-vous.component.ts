import { Component, HostListener, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RendezVousService } from '../../../core/services/rendez-vous.service';
import { EtablissementService } from '../../../core/services/etablissement.service';
import { EtablissementDto } from '../../../core/models/etablissement.model';
import { RendezVousDto } from '../../../core/models/rendez-vous.model';
import { messageErreur } from '../../../core/utils/message-erreur';
import { TYPES_RENDEZ_VOUS } from '../../../core/utils/libelles';
import { validateurDateFuture } from '../../../core/validators/validateurs';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { IconName } from '../../../core/models/nav-item.model';
import { GrossesseService } from '../../../core/services/grossesse.service';
import { GrossesseDto } from '../../../core/models/grossesse.model';

/** Planification d'un rendez-vous par un soignant pour une patiente qu'il suit (fenêtre). */
@Component({
  selector: 'yay360-planifier-rendez-vous',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <div class="pro-modal-backdrop" (click)="annule.emit()">
      <section class="pro-modal" role="dialog" aria-modal="true" aria-labelledby="titre-planifier" (click)="$event.stopPropagation()">
        <header class="pro-modal__head">
          <span class="pro-modal__icon pr__icon" aria-hidden="true"><yay360-icon name="calendar" [size]="22" /></span>
          <div class="pr__title">
            <h2 id="titre-planifier">Planifier un rendez-vous</h2>
            <p>{{ patienteNom() ? 'Pour ' + patienteNom() + '. ' : '' }}La patiente sera notifiée.</p>
          </div>
          <button type="button" class="icon-btn" (click)="annule.emit()" aria-label="Fermer"><yay360-icon name="x" [size]="18" aria-hidden="true" /></button>
        </header>

        <form class="pr__form" [formGroup]="form" (ngSubmit)="soumettre()" novalidate>
          @if (!grossesseId()) {
            <div class="field">
              <label for="pr-patiente">Patiente *</label>
              <select id="pr-patiente" formControlName="grossesseId"
                      [attr.aria-invalid]="form.controls.grossesseId.invalid && form.controls.grossesseId.touched">
                <option [ngValue]="null" disabled>Choisir une patiente suivie…</option>
                @for (g of patientes(); track g.id) {
                  <option [ngValue]="g.id">{{ g.femmeEnceinteNomComplet }} — semaine {{ g.semaineActuelle }}</option>
                }
              </select>
              @if (form.controls.grossesseId.invalid && form.controls.grossesseId.touched) {
                <span class="field-error">Choisissez la patiente.</span>
              }
            </div>
          }
          <fieldset class="pr__types">
            <legend>Type de rendez-vous *</legend>
            @for (t of types; track t.valeur) {
              <label class="pr__type">
                <input type="radio" formControlName="type" [value]="t.valeur" />
                <span><yay360-icon [name]="icone(t.valeur)" [size]="18" aria-hidden="true" /> {{ t.libelle }}</span>
              </label>
            }
          </fieldset>

          <div class="field">
            <label for="pr-date">Date et heure *</label>
            <input id="pr-date" type="datetime-local" formControlName="dateHeure" [min]="maintenant"
                   [attr.aria-invalid]="form.controls.dateHeure.invalid && form.controls.dateHeure.touched" aria-describedby="pr-date-aide" />
            <div class="pr__shortcuts" id="pr-date-aide">
              <span>Raccourcis :</span>
              <button type="button" (click)="raccourci(1)">Demain 9 h</button>
              <button type="button" (click)="raccourci(7)">Dans 1 semaine</button>
              <button type="button" (click)="raccourci(28)">Dans 4 semaines</button>
            </div>
            @if (form.controls.dateHeure.touched && form.controls.dateHeure.hasError('required')) {
              <span class="field-error">Choisissez une date et une heure.</span>
            } @else if (form.controls.dateHeure.touched && form.controls.dateHeure.hasError('passee')) {
              <span class="field-error">La date doit être dans le futur.</span>
            }
          </div>

          <div class="field">
            <label for="pr-etab">Établissement</label>
            <select id="pr-etab" formControlName="etablissementId">
              <option [ngValue]="null">Établissement de suivi de la patiente</option>
              @for (e of etablissements(); track e.id) { <option [ngValue]="e.id">{{ e.nom }}</option> }
            </select>
          </div>

          <div class="field">
            <label for="pr-motif">Motif <small>(facultatif)</small></label>
            <input id="pr-motif" type="text" formControlName="motif" maxlength="500" placeholder="Ex. contrôle de la tension" />
          </div>

          @if (erreur()) {
            <div class="pro-notice pro-notice--error" role="alert"><yay360-icon name="alert-triangle" [size]="18" aria-hidden="true" /><span>{{ erreur() }}</span></div>
          }

          <div class="pro-modal__foot">
            <button type="button" class="pro-btn pro-btn--ghost" (click)="annule.emit()">Annuler</button>
            <button type="submit" class="pro-btn pro-btn--accent" [disabled]="envoi()">
              @if (envoi()) { <span class="btn-spinner" aria-hidden="true"></span> Planification… }
              @else { <yay360-icon name="check" [size]="18" aria-hidden="true" /> Planifier }
            </button>
          </div>
        </form>
      </section>
    </div>
  `,
  styles: `
    .pr__icon { background: var(--c-orange-soft); color: var(--c-orange-ink); }
    .pr__title { flex: 1; min-width: 0; }
    .pro-modal__head .icon-btn { flex-shrink: 0; }
    .pr__form { display: flex; flex-direction: column; gap: var(--s-4); }
    label small { font-weight: 400; color: var(--t-muted); }

    .pr__types { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--s-2); margin: 0; padding: 0; border: 0; }
    .pr__types legend { margin-bottom: var(--s-2); padding: 0; font-size: var(--fs-sm); font-weight: 500; }
    @media (max-width: 479.98px) { .pr__types { grid-template-columns: 1fr; } }
    .pr__type { position: relative; cursor: pointer; }
    .pr__type input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .pr__type span {
      display: flex; align-items: center; gap: var(--s-2);
      min-height: 46px; padding: 0 var(--s-3);
      border: 1.5px solid var(--b-strong); border-radius: var(--r-md);
      background: var(--c-surface); font-size: var(--fs-sm); font-weight: 500; color: var(--t-main);
    }
    .pr__type span yay360-icon { color: var(--c-teal-ink); flex-shrink: 0; }
    .pr__type input:checked + span { border-color: var(--c-teal-ink); background: var(--c-teal-dark); color: var(--t-on-strong); }
    .pr__type input:checked + span yay360-icon { color: var(--t-on-strong); }
    .pr__type input:focus-visible + span { box-shadow: var(--ring); }

    .pr__shortcuts { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-2); font-size: var(--fs-xs); color: var(--t-muted); }
    .pr__shortcuts button {
      min-height: 30px; padding: 0 var(--s-3);
      border: 1.5px solid var(--c-teal-line); border-radius: var(--r-pill);
      background: var(--c-teal-softer); color: var(--c-teal-ink); font: inherit; font-size: var(--fs-xs); font-weight: 500; cursor: pointer;
    }
    .pr__shortcuts button:hover { border-color: var(--c-teal); }
  `,
})
export class PlanifierRendezVousComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly rendezVousService = inject(RendezVousService);
  private readonly etablissementService = inject(EtablissementService);
  private readonly grossesseService = inject(GrossesseService);

  /** Dossier concerné ; si absent, la patiente est choisie dans la fenêtre. */
  readonly grossesseId = input<number | null>(null);
  /** Nom de la patiente, rappelé dans l'en-tête de la fenêtre. */
  readonly patienteNom = input<string>('');
  readonly cree = output<RendezVousDto>();
  readonly annule = output<void>();

  readonly types = TYPES_RENDEZ_VOUS;
  readonly etablissements = signal<EtablissementDto[]>([]);
  readonly patientes = signal<GrossesseDto[]>([]);
  readonly envoi = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly maintenant = this.formatLocal(new Date());

  readonly form = this.fb.group({
    grossesseId: [null as number | null],
    dateHeure: ['', [Validators.required, validateurDateFuture]],
    type: ['CONSULTATION_PRENATALE', [Validators.required]],
    etablissementId: [null as number | null],
    motif: ['', [Validators.maxLength(500)]],
  });

  constructor() {
    this.etablissementService.mesEtablissements().subscribe({
      next: (liste) => this.etablissements.set(liste),
    });
  }

  ngOnInit(): void {
    // Sans dossier imposé : liste des patientes suivies et choix obligatoire
    if (!this.grossesseId()) {
      this.form.controls.grossesseId.addValidators(Validators.required);
      this.grossesseService.listerActives().subscribe({ next: (l) => this.patientes.set(l) });
    }
  }

  @HostListener('document:keydown.escape')
  onEchap(): void {
    this.annule.emit();
  }

  icone(type: string): IconName {
    return ({ CONSULTATION_PRENATALE: 'clipboard', ECHOGRAPHIE: 'activity', VACCINATION: 'shield', EXAMEN_LABORATOIRE: 'search' } as Record<string, IconName>)[type] ?? 'calendar';
  }

  /** Remplit la date : dans N jours à 9 h 00. */
  raccourci(jours: number): void {
    const d = new Date();
    d.setDate(d.getDate() + jours);
    d.setHours(9, 0, 0, 0);
    this.form.controls.dateHeure.setValue(this.formatLocal(d));
    this.form.controls.dateHeure.markAsTouched();
  }

  private formatLocal(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.envoi.set(true);
    this.erreur.set(null);
    this.rendezVousService
      .planifier({
        grossesseId: this.grossesseId() ?? Number(v.grossesseId),
        dateHeure: `${v.dateHeure}:00`.slice(0, 19),
        type: v.type!,
        etablissementId: v.etablissementId,
        motif: v.motif?.trim() || null,
      })
      .subscribe({
        next: (rdv) => {
          this.envoi.set(false);
          this.cree.emit(rdv);
        },
        error: (err) => {
          this.envoi.set(false);
          this.erreur.set(messageErreur(err, 'Impossible de planifier ce rendez-vous.'));
        },
      });
  }
}
