# Kwizillo op één server: site + app

Doel: `kwizillo.nl` / `kwizillo.com` tonen de website (`site/`), `app.kwizillo.nl` /
`app.kwizillo.com` draaien het spel met de ElevenLabs-proxy (`server.js`).
Caddy staat ervoor en regelt HTTPS; Node luistert alleen op localhost.

```
internet ──▶ Caddy :443 ──┬─▶ /var/www/kwizillo/site      (kwizillo.nl, kwizillo.com)
                          └─▶ 127.0.0.1:8080  node server.js  (app.kwizillo.nl, app.kwizillo.com)
```

## 1. DNS (bij de registrar van beide domeinen)

Per domein, met het publieke IPv4 van de server (`<IP>`):

| Type | Naam | Waarde | TTL |
|------|------|--------|-----|
| A    | `@`  | `<IP>` | 300 (later 3600) |
| A    | `www`| `<IP>` | 300 |
| A    | `app`| `<IP>` | 300 |
| AAAA | `@`, `www`, `app` | `<IPv6>` — alleen als de server IPv6 heeft | 300 |

Verwijder parking-records en "URL forwarding" die de registrar standaard heeft
gezet, anders winnen die. Controleer: `dig +short kwizillo.nl app.kwizillo.com`
moet `<IP>` geven. Geen MX/TXT nodig voor de site; e-mail (hallo@kwizillo.nl)
regel je apart bij je mailprovider.

## 2. Server voorbereiden (Ubuntu/Debian)

```bash
sudo apt update && sudo apt install -y caddy nodejs git      # Node ≥ 20
sudo useradd --system --home /var/www/kwizillo --shell /usr/sbin/nologin kwizillo
sudo mkdir -p /var/www/kwizillo && sudo chown kwizillo:kwizillo /var/www/kwizillo
sudo ufw allow 80,443/tcp                                     # 8080 blijft dicht
```

## 3. Code op de server

```bash
sudo -u kwizillo git clone <repo-url> /var/www/kwizillo
cd /var/www/kwizillo && sudo -u kwizillo git checkout release/kwizillo-rc1
sudo -u kwizillo cp .env.example .env
sudo -u kwizillo chmod 600 .env
sudo -u kwizillo nano .env        # ELEVENLABS_API_KEY invullen — alleen hier, nooit in shell/chat/commit
```

`.env` staat in `.gitignore`, `server.js` serveert nooit dot-files, en de
systemd-unit geeft de sleutel niet door via de shell.

## 4. Node als service

```bash
sudo cp deploy/kwizillo.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now kwizillo
sudo systemctl status kwizillo          # "Kwizillo runs on http://127.0.0.1:8080"
curl -s localhost:8080/api/voice-status # {"mode":"elevenlabs",...}
```

De unit zet de productie-instellingen (zie `.env.example`):

- `TRUST_PROXY=1` — rate-limit per bezoeker via `X-Forwarded-For` van Caddy.
- `ALLOWED_ORIGINS=…` — `/api/tts` alleen vanuit de app-hostnames en de iOS-app
  (`capacitor://localhost`); andere Origins krijgen 403.
- `TTS_DAILY_CHARS=300000` — harde bovengrens op ElevenLabs-tekens per dag
  (cache-hits tellen niet mee). Pas aan op je abonnement.

## 5. Caddy

```bash
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy haalt bij de eerste aanvraag de certificaten op voor alle zes hostnames
(DNS moet dan al kloppen). Controle:

```bash
curl -I https://kwizillo.nl            # 200, HTML
curl -I https://kwizillo.com           # 200, Engelse pagina (rewrite naar /en/)
curl -I https://app.kwizillo.nl        # 200, het spel
curl -s -X POST https://app.kwizillo.nl/api/tts -d '{}' -H 'Content-Type: application/json'
                                       # 403: geen Origin → geweigerd (goed)
```

## 6. Updaten

```bash
cd /var/www/kwizillo && sudo -u kwizillo git pull && sudo systemctl restart kwizillo
```

De site heeft geen build-stap; een `git pull` is genoeg (Caddy leest de bestanden
live). De TTS-cache (`.tts-cache/`) blijft staan, dus gesproken zinnen hoeven
niet opnieuw gemaakt te worden.

## 7. Later: de iOS-app

De Capacitor-app krijgt `https://app.kwizillo.nl` als server-URL voor `/api/tts`;
`capacitor://localhost` staat al in `ALLOWED_ORIGINS`. Aanpassen kan in
`deploy/kwizillo.service` (daarna `daemon-reload` + `restart`).
