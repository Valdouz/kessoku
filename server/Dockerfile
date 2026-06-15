# Backend Kessoku : API d'authentification + serveur de synchro (WebSocket).
FROM node:20-slim
WORKDIR /app

# Dépendances de prod. On installe temporairement les outils de build pour que
# better-sqlite3 compile si aucun binaire pré-construit n'est dispo (ex. ARM),
# puis on les retire pour garder une image légère.
COPY package.json package-lock.json* ./
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && npm install --omit=dev \
 && apt-get purge -y python3 make g++ \
 && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

COPY . .

ENV PORT=1234
ENV DATA_DIR=/data
EXPOSE 1234
CMD ["node", "index.mjs"]
