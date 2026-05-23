---
title: Youtwhy
emoji: 🎵
colorFrom: gray
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# WaveFlow Streaming Engine Backend

This is the high-performance streaming and proxy engine for the WaveFlow monochrome music streaming application, hosted for free on Hugging Face Spaces.

## Architecture
- **Language**: Node.js + TypeScript + Express
- **Metadata Search & Resolution**: Standalone `yt-dlp` python utility
- **Streaming Protocol**: HTTPS Byte-Range Proxy
- **Database**: SQLite
