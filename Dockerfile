# ── Étape 1 : build de l'app (Vite) ──────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Dépendances (cache Docker tant que package*.json ne change pas)
COPY package.json package-lock.json* ./
RUN npm ci

# Code + build statique
COPY . .
RUN npm run build

# ── Étape 2 : service statique (nginx) ───────────────────────────────────────
FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
