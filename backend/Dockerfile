FROM node:20-slim

# Install Python3 (required for yt-dlp) and curl
RUN apt-get update && apt-get install -y python3 curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build script
COPY . .

# Run the build script (which compiles TS and downloads yt-dlp)
RUN npm run build

# Expose port 7860 (Hugging Face Spaces expects port 7860 by default)
EXPOSE 7860
ENV PORT=7860
ENV NODE_ENV=production

CMD ["npm", "start"]
