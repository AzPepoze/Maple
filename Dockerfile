FROM node:23-alpine AS base
WORKDIR /app
RUN npm i -g pnpm

FROM base AS build
WORKDIR /app

# Copy package.json for each workspace
COPY src/frontend/package.json ./src/frontend/package.json
COPY src/backend/package.json ./src/backend/package.json

# Copy source code
COPY . .

# Build frontend and backend
WORKDIR /app/src/backend
RUN pnpm i
RUN pnpm run build
WORKDIR /app/src/frontend
RUN pnpm i
RUN pnpm run build

# Prune production dependencies
WORKDIR /app/src/backend
RUN pnpm prune --prod

FROM node:23-alpine
WORKDIR /app

# Copy built artifacts and production node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/backend/node_modules node_modules

CMD ["node", "./dist/backend/index.js"]