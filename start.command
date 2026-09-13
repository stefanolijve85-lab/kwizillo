#!/bin/bash
set -e
cd "$(dirname "$0")"
clear
printf "Starting Kwizillo\n\n"
if [ -z "$ELEVENLABS_API_KEY" ]; then
  printf "Enter your ElevenLabs API key. It is not echoed and never written to any app file.\n"
  read -s -p "ElevenLabs API key: " ELEVENLABS_API_KEY
  echo
  export ELEVENLABS_API_KEY
fi
if [ -z "$ELEVENLABS_API_KEY" ]; then
  echo "No key entered. The game still runs, but Milo and Luna stay silent."
fi
(sleep 1; open "http://127.0.0.1:8080") >/dev/null 2>&1 &
exec node server.js
