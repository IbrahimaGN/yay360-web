export type CanalAssistant = 'TEXTE' | 'VOIX';
export type RoleAssistant = 'user' | 'assistant';

export interface AssistantTourRequest {
  role: RoleAssistant;
  content: string;
}

export interface AssistantChatRequest {
  message: string;
  canal: CanalAssistant;
  historique: AssistantTourRequest[];
  consentementTransmission: boolean;
}

export interface AssistantChatResponse {
  reponse: string;
  canal: CanalAssistant;
  avertissement: string;
  texteALire: string | null;
}
