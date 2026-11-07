/**
 * Préparation commune des tests : jsdom n'implémente pas certaines API du navigateur
 * utilisées par l'interface. On fournit des versions minimales et neutres.
 */
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}

if (typeof window.scrollTo !== 'function' || /not implemented/i.test(String(window.scrollTo))) {
  window.scrollTo = () => undefined;
}
