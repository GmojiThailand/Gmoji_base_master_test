FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production --silent

# Copy app source
COPY . /app

# Expose port (if app listens on PORT env)
EXPOSE 3000

# Default start command
CMD ["npm", "start"]
