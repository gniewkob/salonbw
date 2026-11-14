# QA only: source and dependencies are baked into an ephemeral image.
FROM node:22-bookworm

ENV HUSKY=0 \
    NEXT_TELEMETRY_DISABLED=1 \
    CI=true \
    NEXT_PUBLIC_API_URL=/api \
    NEXT_PUBLIC_DEPLOYMENT_ENV=development \
    NEXT_PUBLIC_AUTH_COOKIE_PREFIX=dev_

RUN corepack enable && corepack prepare pnpm@10.14.0 --activate
WORKDIR /app
COPY . /app

# No production env files, credentials, host volumes or localhost 5432 exposure.
RUN pnpm install --frozen-lockfile
RUN pnpm --dir apps/panel exec playwright install --with-deps chromium
RUN pnpm --filter salonbw-backend run build
RUN pnpm --filter @salonbw/panel run build

ARG V18_QA_SOURCE_SHA
RUN test "${#V18_QA_SOURCE_SHA}" -eq 40
ENV V18_QA_SOURCE_SHA=${V18_QA_SOURCE_SHA}

ENTRYPOINT ["bash", "scripts/qa/v18-docker/run.sh"]
