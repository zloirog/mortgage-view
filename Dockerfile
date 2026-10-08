FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js ./
COPY public ./public
RUN mkdir -p /app/data && chown node:node /app/data
ENV PORT=9999 DATA_DIR=/app/data
EXPOSE 9999
VOLUME /app/data
USER node
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:9999/healthz || exit 1
CMD ["node", "server.js"]
