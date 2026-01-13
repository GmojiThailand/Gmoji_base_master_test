FROM node:18-alpine

WORKDIR /app

# Copy package files and vendor/sdk first (needed for local package)
COPY package.json package-lock.json* ./
COPY vendor/sdk ./vendor/sdk

# Install dependencies (this will install vendor/sdk as local package)
RUN npm install --production --silent

# Copy rest of app source (node_modules will be ignored by .dockerignore)
COPY . /app

# Install vendor/sdk dependencies if needed (postinstall should handle this, but ensure it)
RUN cd vendor/sdk && npm install --production --silent || true

# Expose port (if app listens on PORT env)
EXPOSE 3000

# Default start command
CMD ["npm", "start"]
