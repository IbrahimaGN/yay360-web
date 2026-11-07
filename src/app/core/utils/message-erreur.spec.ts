import { HttpErrorResponse } from '@angular/common/http';
import { champsInvalides, messageErreur } from './message-erreur';

describe('messageErreur', () => {
  it('renvoie le détail des champs invalides d’un 400 de validation', () => {
    const err = new HttpErrorResponse({
      status: 400,
      error: {
        status: 400,
        erreur: 'Erreur de validation',
        message: 'Les données envoyées sont invalides',
        champsInvalides: { password: '8 caractères minimum', telephone: 'Format invalide' },
      },
    });

    expect(messageErreur(err)).toBe('8 caractères minimum · Format invalide');
    expect(champsInvalides(err)).toEqual({ password: '8 caractères minimum', telephone: 'Format invalide' });
  });

  it('renvoie le message de l’API à défaut de champs invalides', () => {
    const err = new HttpErrorResponse({
      status: 403,
      error: { status: 403, erreur: 'Opération non autorisée', message: 'Vous ne suivez pas cette patiente' },
    });

    expect(messageErreur(err, 'défaut')).toBe('Vous ne suivez pas cette patiente');
  });

  it('signale un serveur injoignable', () => {
    expect(messageErreur(new HttpErrorResponse({ status: 0 }))).toContain('Serveur injoignable');
  });

  it('utilise le message par défaut pour une erreur inconnue', () => {
    expect(messageErreur(new Error('x'), 'défaut')).toBe('défaut');
    expect(messageErreur(new HttpErrorResponse({ status: 500, error: null }), 'défaut')).toBe('défaut');
  });
});
