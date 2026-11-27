# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY website-frontend/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY website-frontend/ ./
ENV NEXT_TELEMETRY_DISABLED=1 API_GATEWAY_URL=http://api-gateway:8888
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 API_GATEWAY_URL=http://api-gateway:8888
COPY --from=build --chown=node:node /app ./
USER node
EXPOSE 3000
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0", "--port", "3000"]
