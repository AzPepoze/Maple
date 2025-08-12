FROM node:23-alpine AS pnpm
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm i -g pnpm && pnpm i

FROM pnpm AS build
WORKDIR /app

COPY . .

RUN pnpm run build && pnpm prune --prod

FROM node:23-alpine
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY data/ ./data/
COPY cache/ ./cache/
COPY tsconfig.json tsconfig.json

CMD ["node", "./dist/index.js"]