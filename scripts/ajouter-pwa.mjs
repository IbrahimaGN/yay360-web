// Ajoute la PWA (build web de l'application mobile Flutter) sous /app du portail.
// Le dossier « pwa/ » est produit par la CD (flutter build web --base-href /app/).
// Sans ce dossier (build local, CI), le portail est construit seul.
import { cpSync, existsSync } from 'node:fs';

const source = 'pwa';
const cible = 'dist/yay360-web/browser/app';

if (existsSync(source)) {
  cpSync(source, cible, { recursive: true });
  console.log(`PWA ajoutée : ${source} → ${cible}`);
} else {
  console.log('PWA absente : portail construit seul.');
}
