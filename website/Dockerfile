# Stage 1: Build the Vite React app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the app using Nginx
FROM nginx:alpine

# Copy the build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create a custom nginx configuration to handle client-side routing
# We write this inline to avoid needing an extra file in the repo
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose the default Nginx port (Railway will map this automatically or use the PORT env var if configured, 
# but for simple Dockerfile deploys on Railway, exposing 80 is standard if we serve on 80)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
