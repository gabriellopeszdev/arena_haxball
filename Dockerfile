FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY scripts ./scripts
RUN npm ci

COPY . .
RUN npm run build


FROM node:20-bookworm-slim

# Chromium + dependências do Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY scripts ./scripts
RUN npm ci --omit=dev

# Copia build compilado
COPY --from=builder /app/dist ./dist

# Volumes para dados persistentes
VOLUME ["/app/clips", "/app/data.db"]

ENV NODE_ENV=production
ENV CHROMIUM_PATH=/usr/bin/chromium

CMD ["node", "dist/src/index.js"]
