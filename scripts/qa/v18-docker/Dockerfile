# QA only: source and dependencies are baked into an ephemeral image.
FROM node:22-bookworm

ENV HUSKY=0 \
    NEXT_TELEMETRY_DISABLED=1 \
    CI=true \
    NEXT_PUBLIC_API_URL=/api \
    NEXT_PUBLIC_DEPLOYMENT_ENV=development \
    NEXT_PUBLIC_AUTH_COOKIE_PREFIX=dev_ \
    API_PROXY_URL=http://127.0.0.1:3200 \
    APP_ENV=test \
    OUTBOUND_DELIVERY_ENABLED=false \
    SMSAPI_ENABLED=false \
    EMAIL_ENABLED=false \
    WHATSAPP_ENABLED=false

RUN corepack enable && corepack prepare pnpm@10.14.0 --activate
WORKDIR /app

# pnpm fetch depends on the workspace lockfile, not application source.
# Keep this layer reusable when only V18 tests or UI code change.
# The matching Dockerfile.dockerignore still excludes all env/key files.
COPY pnpm-lock.yaml pnpm-workspace.yaml /app/
RUN pnpm fetch

COPY . /app
# No production env files, credentials, host volumes or localhost 5432 exposure.
# Link already-fetched dependencies without consulting the registry.
RUN pnpm install --offline --frozen-lockfile
RUN pnpm --dir apps/panel exec playwright install --with-deps chromium
RUN pnpm --filter salonbw-backend run build
RUN pnpm --filter @salonbw/panel run build

ARG V18_QA_SOURCE_SHA
RUN test "${#V18_QA_SOURCE_SHA}" -eq 40
ENV V18_QA_SOURCE_SHA=${V18_QA_SOURCE_SHA}

ENTRYPOINT ["bash", "scripts/qa/v18-docker/run.sh"]
