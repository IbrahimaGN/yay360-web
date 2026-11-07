/** Format uniforme des erreurs renvoyées par l'API YAY360 (GlobalExceptionHandler). */
export interface ErreurApi {
  timestamp?: string;
  status: number;
  erreur: string;
  message: string;
  chemin?: string;
  champsInvalides?: Record<string, string>;
}
