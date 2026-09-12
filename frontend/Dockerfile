# Stage 1: Build the React Application
FROM node:22-alpine AS build

WORKDIR /app

# Copy dependency graphs
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build production dist
RUN npm run build

# Stage 2: Serve application using Nginx
FROM nginx:1.25-alpine AS production

# Copy custom Nginx SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
