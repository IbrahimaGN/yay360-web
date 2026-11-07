import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

/**
 * Thème clair / sombre. Pose data-theme="dark" sur <html> : les tokens de
 * styles/_tokens.scss prennent alors leurs valeurs sombres. Le choix est mémorisé ;
 * sans choix, on suit la préférence du système.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'yay360-theme';

  readonly theme = signal<Theme>(this.initialTheme());

  constructor() {
    // Appliqué tout de suite (évite un flash clair avant le premier rendu)
    this.appliquer(this.theme());
    effect(() => {
      const t = this.theme();
      this.appliquer(t);
      try { localStorage.setItem(this.STORAGE_KEY, t); } catch { /* stockage indisponible */ }
    });
  }

  toggle(): void {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }

  readonly isDark = () => this.theme() === 'dark';

  private appliquer(t: Theme): void {
    document.documentElement.dataset['theme'] = t === 'dark' ? 'dark' : 'light';
  }

  private initialTheme(): Theme {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* stockage indisponible */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
