FROM node:22-bookworm-slim

ENV NODE_ENV=production
ENV PORT=8000
ENV DATABASE_PATH=/var/lib/lavina/lavina.db
ENV UPLOADS_DIR=/var/lib/lavina/uploads

WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/src ./src
RUN mkdir -p /var/lib/lavina/uploads

EXPOSE 8000
CMD ["node", "src/index.js"]
