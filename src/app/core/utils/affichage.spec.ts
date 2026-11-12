import { dureeEcoulee, initiales } from './affichage';

describe('affichage', () => {
  it('initiales : deux premiers mots, sans la partie entre parenthèses', () => {
    expect(initiales('Awa Diop (patiente)')).toBe('AD');
    expect(initiales('  fatou  ndiaye sarr ')).toBe('FN');
    expect(initiales('Moussa')).toBe('M');
  });

  it('dureeEcoulee : minutes, heures puis jours', () => {
    const maintenant = Date.parse('2026-11-12T12:00:00Z');
    expect(dureeEcoulee('2026-11-12T11:55:00Z', false, maintenant)).toBe('il y a 5 min');
    expect(dureeEcoulee('2026-11-12T09:00:00Z', false, maintenant)).toBe('il y a 3 h');
    expect(dureeEcoulee('2026-11-11T12:00:00Z', false, maintenant)).toBe('il y a 1 jour');
    expect(dureeEcoulee('2026-11-09T12:00:00Z', false, maintenant)).toBe('il y a 3 jours');
    expect(dureeEcoulee('2026-11-09T12:00:00Z', true, maintenant)).toBe('il y a 3 j');
    expect(dureeEcoulee('2026-11-12T12:10:00Z', false, maintenant)).toBe('il y a 0 min');
  });
});
