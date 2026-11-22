# Web + worker image for LeeTKOB (PA#3).
#
# Render builds this image for the web service. `docker-compose.yml` runs the
# same image as `web` and, with `command: node worker/index.js`, as `worker`.
# The model key is never baked in: it is an environment variable on the Oracle
# worker only.

FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production
# src/main.js defaults to 127.0.0.1, which is unreachable from outside a
# container. Render also sets PORT, which src/main.js already reads.
ENV HOST=0.0.0.0

# Runtime dependencies only. PA#2 has none; Tùng's Postgres client arrives with
# the queue branch and is installed by the same command.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000
CMD ["node", "src/main.js"]
