FROM node:20-slim

# Install Python3 (required for yt-dlp), pip, curl, ca-certificates, and openssl
RUN apt-get update && apt-get install -y python3 python3-pip curl ca-certificates openssl && update-ca-certificates && rm -rf /var/lib/apt/lists/*

# Install yt-dlp with curl-cffi globally as root and explicitly grant read/execute permissions to all users (including node user)
RUN python3 -m pip install --break-system-packages "yt-dlp[default,curl-cffi]" && \
    chmod -R 755 /usr/local/lib/python3.*/dist-packages || true

WORKDIR /app

# Change ownership of the workdir to the non-root 'node' user (UID 1000) expected by Hugging Face
RUN chown -R node:node /app

# Copy package files with correct node ownership
COPY --chown=node:node package*.json ./

# Switch to non-root user before running npm install and commands
USER node

RUN npm install

# Copy application source code with correct node ownership
COPY --chown=node:node . .

# Run the build script (which compiles TS and downloads yt-dlp to /app/yt-dlp)
RUN npm run build

# Expose port 7860 (Hugging Face Spaces expects port 7860 by default)
EXPOSE 7860
ENV PORT=7860
ENV NODE_ENV=production
ENV YT_DLP_PATH=/usr/local/bin/yt-dlp

CMD ["npm", "start"]
