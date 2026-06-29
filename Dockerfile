# UIL Science platform — container image for Render (Docker runtime)
FROM node:20-bookworm-slim

# Build tools so better-sqlite3 can compile if no prebuilt binary is available
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install backend dependencies first (better layer caching)
COPY server/package*.json server/
RUN cd server && npm install --omit=dev

# Copy the rest of the app (frontend pages + assets + server code)
COPY . .

# Render provides PORT at runtime; the server reads process.env.PORT
EXPOSE 3000
CMD ["node", "server/server.js"]
