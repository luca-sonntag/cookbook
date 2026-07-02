# ── Build stage: compile TypeScript and build frontend ──────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Backend deps
COPY package*.json ./
RUN YOUTUBE_DL_SKIP_PYTHON_CHECK=1 npm ci

# Frontend build
COPY frontend/package*.json frontend/
RUN cd frontend && npm ci && cd ..

COPY frontend/ frontend/
ARG SUPABASE_URL
ARG SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_URL=$SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_PUBLISHABLE_KEY
RUN cd frontend && npm run build

# Backend TypeScript compilation
COPY tsconfig.json ./
COPY src/ src/
RUN npm run build
RUN npm prune --omit=dev

# ── Production stage: minimal runtime ──────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

# Copy only production dependencies and built artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend/dist ./frontend/dist

# Install runtime dependencies (ffmpeg/ffprobe for frame extraction, python3 for yt-dlp)
RUN apk add --no-cache ffmpeg python3

# Create directories for runtime artifacts
RUN mkdir -p logs

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/src/index.js"]