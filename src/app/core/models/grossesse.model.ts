export interface GrossesseDto {
  id: number;
  femmeEnceinteId: number;
  femmeEnceinteNomComplet: string;
  dateDernieresRegles: string;
  /** Estimation (règle de Naegele : dernières règles + 280 jours), pas une date certaine. */
  datePrevueAccouchement: string;
  /** Période d'accouchement à terme : 37 SA + 0 j à 41 SA + 6 j. */
  debutPeriodeTerme: string | null;
  finPeriodeTerme: string | null;
  ageGestationnelJours: number;
  semaineActuelle: number;
  trimestre: string;
  joursRestants: number;
  statut: 'EN_COURS' | 'TERMINEE' | 'INTERROMPUE';
  grossesseARisque: boolean;
  motifRisque: string | null;
  nombreGrossessesPrecedentes: number | null;
  antecedents: string | null;
  /** Établissement qui assure le suivi : ses soignants ont accès au dossier. */
  etablissementSuiviId: number | null;
  etablissementSuiviNom: string | null;
  /** Date de l'accouchement ou de l'interruption. */
  dateFin: string | null;
  /** Issue de la grossesse close ; null pour le conjoint (secret médical) ou si non renseignée. */
  issue: IssueGrossesse | null;
  dateCreation: string;
}

export interface CalendrierSemaineDto {
  semaine: number;
  trimestre: string;
  statutSemaine: 'PASSEE' | 'ACTUELLE' | 'A_VENIR';
  developpementBebe: string | null;
  changementsMere: string | null;
  examensRecommandes: string | null;
  objectifsSante: string | null;
}

export interface CalendrierGrossesseDto {
  grossesseId: number;
  semaineActuelle: number;
  datePrevueAccouchement: string;
  semaines: CalendrierSemaineDto[];
}

export interface ConseilDto {
  id: number;
  semaineDebut: number;
  semaineFin: number;
  trimestre: string;
  categorie: string;
  titre: string;
  contenu: string;
  actif: boolean;
  auteurNomComplet: string | null;
  dateCreation: string;
}

export interface SuiviHebdomadaireDto {
  grossesseId: number;
  semaineActuelle: number;
  trimestre: string;
  ageGestationnelJours: number;
  datePrevueAccouchement: string;
  joursRestants: number;
  grossesseARisque: boolean;
  developpementBebe: string | null;
  changementsMere: string | null;
  objectifsSante: string | null;
  conseilsAlimentation: string | null;
  conseilsHydratation: string | null;
  exercicesPhysiques: string | null;
  conseilsSommeil: string | null;
  precautions: string | null;
  examensRecommandes: string | null;
  signesAlerte: string | null;
  conseilsPersonnalises: ConseilDto[];
  avertissement: string;
}

export interface DeclarerRisqueRequest {
  motif: string;
}

/** Issue saisie par le médecin à la clôture (miroir de IssueGrossesse côté Java). */
export type IssueGrossesse =
  | 'NAISSANCE_VIVANTE'
  | 'MORT_NE'
  | 'FAUSSE_COUCHE'
  | 'GROSSESSE_EXTRA_UTERINE'
  | 'MORT_FOETALE_IN_UTERO'
  | 'INTERRUPTION_THERAPEUTIQUE';

export interface TerminerGrossesseRequest {
  /** Le statut final (TERMINEE ou INTERROMPUE) est déduit de l'issue par l'API. */
  issue: IssueGrossesse;
  dateFin?: string;
}

export interface DeclarerGrossesseRequest {
  dateDernieresRegles: string;
  nombreGrossessesPrecedentes?: number;
  antecedents?: string;
  etablissementId?: number | null;
}

export interface ChoisirEtablissementRequest {
  etablissementId: number;
}

/** Rattachement par un soignant : le téléphone de la patiente sert de preuve de présence. */
export interface RattacherGrossesseRequest {
  etablissementId: number;
  telephonePatiente: string;
}

/** Résultat de recherche : aucune donnée clinique. */
export interface PatienteRechercheDto {
  grossesseId: number;
  prenom: string;
  nom: string;
  semaineActuelle: number;
  etablissementSuiviNom: string | null;
  dejaSuivie: boolean;
}

export type StatutContactCpn = 'REALISE' | 'PLANIFIE' | 'A_VENIR' | 'EN_RETARD';

/** Un des 8 contacts prénatals recommandés par l'OMS. */
export interface ContactCpn {
  numero: number;
  semaineCible: number;
  dateCible: string;
  statut: StatutContactCpn;
  dateRealisation: string | null;
}

export interface PlanCpnDto {
  grossesseId: number;
  semaineActuelle: number;
  contacts: ContactCpn[];
  nombreRealises: number;
  nombreEnRetard: number;
  reference: string;
}

/** Aide à la décision : seul le médecin classe une grossesse à risque. */
export interface EvaluationRisqueDto {
  grossesseId: number;
  grossesseARisque: boolean;
  facteurs: string[];
  suggestionDeclarerARisque: boolean;
  avertissement: string;
}
