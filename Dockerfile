FROM node:23-alpine AS base
WORKDIR /app
RUN npm i -g pnpm

FROM base AS build
WORKDIR /app

# Copy pnpm workspace configuration and lockfile
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Copy package.json for each workspace
COPY src/frontend/package.json ./src/frontend/package.json
COPY src/backend/package.json ./src/backend/package.json

# Install dependencies for all workspaces
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend and backend
RUN pnpm --filter src/backend run build
RUN pnpm --filter src/frontend run build

# Prune production dependencies
WORKDIR /app/src/backend
RUN pnpm prune --prod
WORKDIR /app

FROM node:23-alpine
WORKDIR /app

# Copy built artifacts and production node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/backend/node_modules ./node_modules

CMD ["node", "./dist/backend/index.js"]