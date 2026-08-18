# ---- Build stage ----
FROM node:20-slim AS builder

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install all dependencies (devDependencies included) from the lockfile.
# The prisma schema must be present before install so the "postinstall"
# script (prisma generate) can run.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# Compile TypeScript to dist/
COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:20-slim AS runner

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production

WORKDIR /app

# Install production dependencies only. --ignore-scripts skips "postinstall"
# (prisma generate), since the prisma CLI is a devDependency not installed here.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev --ignore-scripts

# Reuse the Prisma Client generated in the build stage instead of
# regenerating it (avoids needing the prisma CLI in the final image).
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Compiled application only, no source/tests/dev files.
COPY --from=builder /app/dist ./dist

EXPOSE 8000

# node instead of "npm start" so the process receives signals (SIGTERM)
# directly and shuts down cleanly.
CMD ["node", "dist/index.js"]
