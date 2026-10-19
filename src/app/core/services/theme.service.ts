import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'yay360-theme';

  readonly theme = signal<Theme>(this.initialTheme());

  constructor() {
    effect(() => {
      const t = this.theme();
      document.documentElement.dataset['theme'] = t === 'dark' ? 'dark' : '';
      try { localStorage.setItem(this.STORAGE_KEY, t); } catch {}
    });
  }

  toggle(): void {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }

  readonly isDark = () => this.theme() === 'dark';

  private initialTheme(): Theme {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
