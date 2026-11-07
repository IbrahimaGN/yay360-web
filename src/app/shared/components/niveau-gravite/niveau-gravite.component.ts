import { Component, computed, input } from '@angular/core';
import { NiveauGravite } from '../../../core/models/alerte.model';
import { libelleGravite } from '../../../core/utils/libelles';
import { IconComponent } from '../icon/icon.component';

/**
 * Badge de gravité d'une alerte : icône + libellé + couleur
 * (l'information n'est jamais portée par la couleur seule).
 * Le niveau provient exclusivement des règles de triage du backend.
 */
@Component({
  selector: 'yay360-niveau-gravite',
  standalone: true,
  imports: [IconComponent],
  template: `
    <span class="gravite" [class]="'gravite gravite--' + classe()">
      <yay360-icon [name]="niveau() === 'MODERE' ? 'info' : 'alert-triangle'" [size]="14" aria-hidden="true" />
      <span><span class="sr-only">Gravité : </span>{{ libelle() }}</span>
    </span>
  `,
  styles: `
    .gravite {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 10px; border-radius: var(--r-pill);
      font-size: var(--fs-xs); font-weight: 600; line-height: 1.5;
      white-space: nowrap; border: 1.5px solid transparent;
    }
    .gravite--urgent { background: var(--c-danger-strong); border-color: var(--c-danger-border); color: var(--t-on-strong); }
    .gravite--eleve  { background: var(--c-warning-soft); border-color: var(--c-warning-line); color: var(--c-warning); }
    .gravite--modere { background: var(--c-teal-soft); border-color: var(--c-teal-line); color: var(--c-teal-ink); }
  `,
})
export class NiveauGraviteComponent {
  readonly niveau = input.required<NiveauGravite>();
  readonly libelle = computed(() => libelleGravite(this.niveau()));
  readonly classe = computed(() => this.niveau().toLowerCase());
}
