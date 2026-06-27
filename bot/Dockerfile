FROM node:20-slim
WORKDIR /app

COPY package.json package-lock.json* ./
# Outils de build temporaires pour compiler better-sqlite3, retirés ensuite.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && npm install \
 && apt-get purge -y python3 make g++ && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

COPY . .
RUN npm run build && npm prune --omit=dev

ENV DATA_DIR=/data
CMD ["node", "dist/index.js"]
