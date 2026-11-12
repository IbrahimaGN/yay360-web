# ==================== STAGE 1 : BUILD ====================
FROM node:22-alpine AS build

WORKDIR /app

# Installation reproductible, à partir du lockfile
COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build -- --configuration production

# ==================== STAGE 2 : RUNTIME (NGINX) ====================
# Image NGINX officielle « non privilégiée » : le serveur tourne avec l'utilisateur nginx, pas root.
# Elle écoute donc sur un port non réservé (8080 au lieu de 80).
FROM nginxinc/nginx-unprivileged:1.27-alpine

# Adresse interne du backend (réseau Docker Compose) ; modifiable au lancement
ENV API_UPSTREAM=http://yay360-api:8080

COPY --from=build /app/dist/yay360-web/browser /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/securite.inc /etc/nginx/conf.d/securite.inc

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
