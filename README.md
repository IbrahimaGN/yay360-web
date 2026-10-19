# YAY360 — Web (Angular)

Plateforme intelligente de suivi de la santé maternelle destinée aux femmes enceintes. L’espace de gestion permet à l’**administration** et aux **professionnels de santé** (médecins et sages-femmes) d’accompagner le suivi des grossesses.
SPA Angular 21 standalone (pas de SSR — inutile derrière une authentification).

## Démarrage

```bash
npm install
npm start
```

L'application démarre sur `http://localhost:4200` et consomme l'API sur
`http://localhost:8080` (voir `src/environments/environment.ts`).

Le backend (`yay360-backend`) doit tourner en parallèle — son CORS est déjà
configuré pour accepter `http://localhost:4200`.

## Design system

Design tokens définis en variables CSS dans `src/styles.scss` :

| Rôle | Couleur |
|---|---|
| `--color-indigo-nuit` | `#1c2b4a` — fond sombre (sidebar), rigueur clinique |
| `--color-corail-aurore` | `#e8636b` — accent, actions principales, chaleur maternelle |
| `--color-sable-chaud` | `#faf3e9` — fond clair |
| `--color-argile` | `#a9836c` — texte secondaire, bordures |
| `--color-vert-sahel` | `#4c8c6b` — succès |
| `--color-ambre` | `#e0a63a` — attention |

Typographie : `Spectral` (titres) + `Plus Jakarta Sans` (interface) + `IBM Plex Mono` (données).

**Signature visuelle** : l'anneau des 40 semaines de grossesse (segmenté par
trimestre T1/T2/T3), utilisé comme logo abstrait et repris comme composant
réel sur les fiches grossesse (étapes suivantes).

## Architecture

```
src/app/
├── core/
│   ├── guards/        # authGuard, roleGuard
│   ├── interceptors/  # authInterceptor (JWT + gestion 401)
│   ├── models/        # interfaces TypeScript (miroir des DTOs backend)
│   └── services/       # AuthService (session en signal + localStorage)
├── features/
│   └── auth/           # login, forgot-password, reset-password
└── shared/
    └── components/     # composants réutilisables (access-denied, etc.)
```

Les femmes enceintes et leurs conjoints associés disposent d'un espace familial
partagé : suivi de grossesse, consultations, rendez-vous et alertes, dossier
familial, notifications et assistant de santé. Le compte du conjoint est personnel et lié au dossier via une
invitation. Les fonctions vocales de l'assistant dépendent de la prise en charge
Web Speech par le navigateur, et l'envoi réel des invitations dépend de la
configuration SMTP du backend.

## Fonctionnalités frontend

- Authentification, gestion du profil et navigation adaptée aux rôles.
- Espace professionnel et administration : tableau de bord des grossesses en
  cours, rendez-vous, consultations, alertes, conseils et gestion des utilisateurs.
- Espace familial partagé : invitation et accès du conjoint, déclaration et
  suivi prénatal, consultations, demandes de rendez-vous et signalements.
- Notifications accessibles depuis la barre supérieure et assistant de santé.

## Comptes de test (backend `DataInitializer`)

- Admin : `admin@yay360.sn` / `Admin@2026`
