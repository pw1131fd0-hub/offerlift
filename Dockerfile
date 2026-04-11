FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application code
COPY server/ ./server/
COPY index.html .
COPY public/ ./public/

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server/src/index.js"]
