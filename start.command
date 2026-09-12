#!/bin/bash
set -e
cd "$(dirname "$0")"
clear
printf "Kwizillo V3.6 starten\n\n"
if [ -z "$ELEVENLABS_API_KEY" ]; then
  printf "Voer je ElevenLabs API-key in. De tekens worden niet getoond en de key komt niet in de app-code.\n"
  read -s -p "ElevenLabs API-key: " ELEVENLABS_API_KEY
  echo
  export ELEVENLABS_API_KEY
fi
if [ -z "$ELEVENLABS_API_KEY" ]; then
  echo "Geen key ingevoerd. De app start wel, maar Milo/Luna blijven stil. Muziek en FX blijven wel werken."
fi
(sleep 1; open "http://127.0.0.1:8080") >/dev/null 2>&1 &
exec node server.js
