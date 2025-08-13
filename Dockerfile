FROM node:23-alpine AS pnpm
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm i -g pnpm && pnpm i

FROM pnpm AS build
WORKDIR /app

COPY . .

RUN pnpm install && pnpm run build && pnpm prune --prod

FROM node:23-alpine
WORKDIR /app

COPY --from=build /app/dist ./dist

COPY --from=build /app/node_modules ./node_modules

CMD ["node", "./dist/backend/index.js"]