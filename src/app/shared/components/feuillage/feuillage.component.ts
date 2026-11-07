import { Component, input } from '@angular/core';

/**
 * Feuillage décoratif (purement visuel, masqué aux lecteurs d'écran).
 * Variante « bas » : bouquet en bas de page ; « coin » : quelques feuilles en angle.
 */
@Component({
  selector: 'yay360-feuillage',
  standalone: true,
  template: `
    <svg [attr.viewBox]="variante() === 'bas' ? '0 0 1200 420' : '0 0 400 400'" preserveAspectRatio="xMidYMax slice"
         aria-hidden="true" focusable="false">
      <defs>
        <path id="leaf" d="M0 0 C 28 -40 28 -120 0 -170 C -28 -120 -28 -40 0 0 Z" />
        <path id="leaf-thin" d="M0 0 C 16 -60 16 -150 0 -210 C -16 -150 -16 -60 0 0 Z" />
      </defs>
      @if (variante() === 'bas') {
        <g transform="translate(140 430)">
          <use href="#leaf" fill="#BFE4E6" transform="rotate(-38) scale(1.5)" />
          <use href="#leaf-thin" fill="#2BA3A8" opacity=".55" transform="rotate(-12) scale(1.4)" />
          <use href="#leaf" fill="#FFFFFF" transform="rotate(18) scale(1.3)" />
        </g>
        <g transform="translate(470 440)">
          <use href="#leaf" fill="#8EA4E8" opacity=".85" transform="rotate(-25) scale(1.6)" />
          <use href="#leaf-thin" fill="#FFFFFF" transform="rotate(6) scale(1.5)" />
        </g>
        <g transform="translate(640 450)">
          <use href="#leaf" fill="#F28B7D" transform="rotate(-8) scale(2.1)" />
          <use href="#leaf" fill="#F6A99E" transform="rotate(24) scale(1.6)" />
          <use href="#leaf-thin" fill="#E57565" transform="rotate(-36) scale(1.3)" />
        </g>
        <g transform="translate(900 440)">
          <use href="#leaf" fill="#8EA4E8" transform="rotate(28) scale(1.7)" />
          <use href="#leaf-thin" fill="#2BA3A8" opacity=".5" transform="rotate(-10) scale(1.5)" />
          <use href="#leaf" fill="#FFFFFF" transform="rotate(48) scale(1.2)" />
        </g>
        <g transform="translate(1110 430)">
          <use href="#leaf" fill="#BFE4E6" transform="rotate(-20) scale(1.5)" />
          <use href="#leaf-thin" fill="#FFFFFF" transform="rotate(20) scale(1.3)" />
        </g>
      } @else {
        <g transform="translate(40 420)">
          <use href="#leaf" fill="#8EA4E8" opacity=".9" transform="rotate(30) scale(1.4)" />
          <use href="#leaf-thin" fill="#BFE4E6" transform="rotate(55) scale(1.3)" />
          <use href="#leaf" fill="#FFFFFF" opacity=".8" transform="rotate(8) scale(1.1)" />
        </g>
      }
    </svg>
  `,
  styles: `
    :host { display: block; pointer-events: none; }
    /* Thème sombre : feuillage atténué, feuilles blanches fondues dans le décor */
    :host-context([data-theme='dark']) { opacity: 0.35; }
    :host-context([data-theme='dark']) use[fill='#FFFFFF'] { fill: var(--c-surface-2); }
    svg { display: block; width: 100%; height: 100%; }
  `,
})
export class FeuillageComponent {
  readonly variante = input<'bas' | 'coin'>('bas');
}
