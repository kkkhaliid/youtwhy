FROM node:20-slim

# Install Python3 (required for yt-dlp), pip, and curl
RUN apt-get update && apt-get install -y python3 python3-pip curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Change ownership of the workdir to the non-root 'node' user (UID 1000) expected by Hugging Face
RUN chown -R node:node /app

# Copy package files with correct node ownership
COPY --chown=node:node package*.json ./

# Switch to non-root user before running npm install and commands
USER node

# Install curl-cffi for the local user so it's fully accessible during runtime
RUN python3 -m pip install --user --break-system-packages curl-cffi

RUN npm install

# Copy application source code with correct node ownership
COPY --chown=node:node . .

# Run the build script (which compiles TS and downloads yt-dlp to /app/yt-dlp)
RUN npm run build

# Expose port 7860 (Hugging Face Spaces expects port 7860 by default)
EXPOSE 7860
ENV PORT=7860
ENV NODE_ENV=production

CMD ["npm", "start"]
