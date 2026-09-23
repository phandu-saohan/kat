FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application files
COPY . .

# Set environment
ENV PORT=3000
EXPOSE 3000

# Start production server
CMD ["node", "server.js"]
