FROM node:26-trixie-slim AS build
RUN npm install --global pnpm@12.21.0
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contract/package.json packages/contract/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY e2e/package.json e2e/
COPY postman/package.json postman/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter "@school-portal/web..."
COPY tsconfig.base.json ./
COPY packages/contract packages/contract
COPY apps/web apps/web
RUN pnpm --filter @school-portal/web build

FROM nginxinc/nginx-unprivileged:alpine AS runtime
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
