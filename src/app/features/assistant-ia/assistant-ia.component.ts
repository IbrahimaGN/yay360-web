import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import {
  AssistantChatResponse,
  AssistantTourRequest,
  CanalAssistant,
  RoleAssistant,
} from '../../core/models/assistant-ia.model';
import { AssistantIaService } from '../../core/services/assistant-ia.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface TourAffiche {
  role: RoleAssistant;
  content: string;
}

interface RecognitionAlternative {
  transcript: string;
}

interface RecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: RecognitionAlternative;
}

interface RecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: ArrayLike<RecognitionResult>;
}

interface RecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

interface SpeechWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

@Component({
  selector: 'yay360-assistant-ia',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './assistant-ia.component.html',
  styleUrl: './assistant-ia.component.scss',
})
export class AssistantIaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly assistantService = inject(AssistantIaService);
  private readonly authService = inject(AuthService);
  private recognition: SpeechRecognitionLike | null = null;

  readonly disponible = computed(() => this.authService.hasRole('FEMME_ENCEINTE', 'CONJOINT'));
  readonly ouvert = signal(false);
  readonly conversation = signal<TourAffiche[]>([]);
  readonly envoiEnCours = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly consentement = signal(false);
  readonly canal = signal<CanalAssistant>('TEXTE');
  readonly ecouteEnCours = signal(false);
  readonly avertissement = signal<string | null>(null);
  readonly speechSupporte = typeof window !== 'undefined' &&
    !!((window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition);
  readonly form = this.fb.group({
    message: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  basculerFenetre(): void {
    this.ouvert.update((open) => !open);
  }

  fermerFenetre(): void {
    this.ouvert.set(false);
    this.arreterDictee();
  }

  @HostListener('document:keydown.escape')
  fermerAvecEchap(): void {
    if (this.ouvert()) this.fermerFenetre();
  }

  changerCanal(value: string): void {
    if (value === 'TEXTE' || value === 'VOIX') this.canal.set(value);
  }

  changerConsentement(value: boolean): void {
    this.consentement.set(value);
  }

  demarrerDictee(): void {
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) return;
    this.erreur.set(null);
    this.recognition = new Recognition();
    this.recognition.lang = 'fr-FR';
    this.recognition.interimResults = false;
    this.recognition.onresult = (event) => {
      const transcript = event.results[event.resultIndex]?.[0]?.transcript;
      if (transcript) {
        this.form.controls.message.setValue(
          `${this.form.controls.message.value ?? ''}${this.form.controls.message.value ? ' ' : ''}${transcript}`.slice(0, 2000)
        );
        this.canal.set('VOIX');
      }
    };
    this.recognition.onerror = () => this.erreur.set('La dictée vocale a échoué. Vous pouvez saisir votre question au clavier.');
    this.recognition.onend = () => this.ecouteEnCours.set(false);
    this.ecouteEnCours.set(true);
    this.recognition.start();
  }

  arreterDictee(): void {
    this.recognition?.stop();
    this.ecouteEnCours.set(false);
  }

  envoyer(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.consentement()) {
      this.erreur.set('Veuillez lire la notice et confirmer votre consentement pour transmettre cette question.');
      return;
    }

    const message = this.form.getRawValue().message!.trim();
    if (!message) return;
    const historique: AssistantTourRequest[] = this.conversation()
      .slice(-12)
      .map(({ role, content }) => ({ role, content }));
    this.envoiEnCours.set(true);
    this.erreur.set(null);
    this.avertissement.set(null);

    this.assistantService.discuter({
      message,
      canal: this.canal(),
      historique,
      consentementTransmission: true,
    }).subscribe({
      next: (response: AssistantChatResponse) => {
        this.conversation.update((items) => [
          ...items,
          { role: 'user', content: message },
          { role: 'assistant', content: response.reponse },
        ]);
        this.avertissement.set(response.avertissement);
        this.form.reset({ message: '' });
        this.consentement.set(false);
        this.envoiEnCours.set(false);
        if (response.canal === 'VOIX' && response.texteALire && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(response.texteALire));
        }
      },
      error: (err) => {
        this.envoiEnCours.set(false);
        this.consentement.set(false);
        this.erreur.set(err?.error?.message ?? "L'assistant est indisponible. Votre message n'a pas été ajouté à la conversation.");
      },
    });
  }

  effacerConversation(): void {
    this.conversation.set([]);
    this.avertissement.set(null);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  roleLabel(role: RoleAssistant): string {
    return role === 'user' ? 'Vous' : 'Assistant YAY360';
  }
}
