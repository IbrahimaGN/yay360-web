import { Pipe, PipeTransform } from '@angular/core';
import { libelleStatut } from '../../core/utils/libelles';

/** Affiche le libellé lisible d'un statut technique : {{ rdv.statut | statut }}. */
@Pipe({ name: 'statut', standalone: true })
export class StatutPipe implements PipeTransform {
  transform(valeur: string | null | undefined): string {
    return libelleStatut(valeur);
  }
}
