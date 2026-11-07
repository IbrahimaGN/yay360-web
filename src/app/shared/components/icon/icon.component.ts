import { Component, input } from '@angular/core';
import { IconName } from '../../../core/models/nav-item.model';

@Component({
  selector: 'yay360-icon',
  standalone: true,
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round" [attr.width]="size()" [attr.height]="size()">
      @switch (name()) {
        @case ('grid') {
          <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
        }
        @case ('ring') {
          <circle cx="12" cy="12" r="8.2" opacity="0.35" />
          <path d="M12 3.8 A8.2 8.2 0 0 1 19.6 14" />
        }
        @case ('activity') { <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /> }
        @case ('arrow-right') { <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /> }
        @case ('mail') { <rect x="3" y="5" width="18" height="14" rx="2" /><polyline points="3 7 12 13 21 7" /> }
        @case ('phone') { <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" /> }
        @case ('map-pin') { <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /> }
        @case ('shield') { <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /> }
        @case ('heart') {
          <path d="M20.8 8.8c0 5.3-8.8 11-8.8 11s-8.8-5.7-8.8-11A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 8.8 2.8Z" />
        }
        @case ('calendar') {
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" />
          <line x1="8" y1="3" x2="8" y2="7" />
          <line x1="16" y1="3" x2="16" y2="7" />
        }
        @case ('clipboard') {
          <rect x="5" y="4.5" width="14" height="17" rx="2" />
          <rect x="8.5" y="3" width="7" height="3" rx="1" />
          <line x1="8" y1="11" x2="16" y2="11" />
          <line x1="8" y1="15" x2="16" y2="15" />
        }
        @case ('bell') {
          <path d="M6 10a6 6 0 0 1 12 0c0 4.2 1.5 5.5 1.5 5.5H4.5S6 14.2 6 10Z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        }
        @case ('building') {
          <rect x="4" y="3" width="11" height="18" rx="1" />
          <line x1="7.5" y1="7" x2="7.5" y2="7.01" />
          <line x1="11.5" y1="7" x2="11.5" y2="7.01" />
          <line x1="7.5" y1="11" x2="7.5" y2="11.01" />
          <line x1="11.5" y1="11" x2="11.5" y2="11.01" />
          <line x1="7.5" y1="15" x2="7.5" y2="15.01" />
          <line x1="11.5" y1="15" x2="11.5" y2="15.01" />
          <path d="M15 21V9l5 2v10Z" />
        }
        @case ('book') {
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5Z" />
          <line x1="4" y1="19" x2="20" y2="19" />
        }
        @case ('users') {
          <circle cx="9" cy="8" r="3.2" />
          <path d="M2.8 20c0-3.4 2.8-6 6.2-6s6.2 2.6 6.2 6" />
          <circle cx="17" cy="8.5" r="2.6" opacity="0.6" />
          <path d="M15.5 14.3c2.6.5 4.7 2.7 4.7 5.7" opacity="0.6" />
        }
        @case ('sun') {
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="2" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        }
        @case ('moon') {
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        }
        @case ('chevron-down') { <polyline points="6 9 12 15 18 9" /> }
        @case ('chevron-left')  { <polyline points="15 18 9 12 15 6" /> }
        @case ('chevron-right') { <polyline points="9 18 15 12 9 6" /> }
        @case ('user') {
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        }
        @case ('logout') {
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        }
        @case ('x') {
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        }
        @case ('home') {
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
          <polyline points="9 21 9 12 15 12 15 21" />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        }
        @case ('filter')  { <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /> }
        @case ('plus')    { <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /> }
        @case ('check')   { <polyline points="20 6 9 17 4 12" /> }
        @case ('edit') {
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        }
        @case ('trash') {
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
        }
        @case ('alert-triangle') {
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        }
        @case ('info') {
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        }
        @case ('eye') {
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        }
        @case ('eye-off') {
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        }
      }
    </svg>
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input<number>(20);
}
