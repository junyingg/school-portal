FROM node:26-trixie-slim AS base
RUN npm install --global pnpm@12.21.0
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contract/package.json packages/contract/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY e2e/package.json e2e/
COPY postman/package.json postman/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter "@school-portal/api..."

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/contract packages/contract
COPY apps/api apps/api
RUN pnpm --filter "@school-portal/api..." build
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm deploy --filter @school-portal/api --prod /out

FROM node:26-trixie-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
