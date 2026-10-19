# ==================== STAGE 1 : BUILD ====================
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build -- --configuration production

# ==================== STAGE 2 : RUNTIME (NGINX) ====================
FROM nginx:1.27-alpine

# Fichiers statiques générés par le build Angular
COPY --from=build /app/dist/yay360-web/browser /usr/share/nginx/html

# Config Nginx adaptée au routing SPA Angular (fallback vers index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]