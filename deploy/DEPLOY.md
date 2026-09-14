# Kwizillo op de bestaande server (213.126.59.35, nginx)

Doel: `kwizillo.nl` / `kwizillo.com` tonen de website (`site/`), `app.kwizillo.nl` /
`app.kwizillo.com` draaien het spel met de ElevenLabs-proxy (`server.js`).
De nginx die er al staat krijgt drie serverblokken erbij; Node luistert alleen op
localhost:8080, naast de sites die er al draaien.

```
internet ──▶ nginx :443 ──┬─▶ /var/www/kwizillo/site      (kwizillo.nl, kwizillo.com)
                          ├─▶ 127.0.0.1:8080  node server.js  (app.kwizillo.nl, app.kwizillo.com)
                          └─▶ de twee bestaande sites (ongewijzigd)
```

## 1. DNS bij Hostnet (Mijn Hostnet → Domeinen → DNS-beheer)

Voor **kwizillo.nl** én **kwizillo.com**:

| Type  | Naam | Waarde            | TTL |
|-------|------|-------------------|-----|
| A     | `@`  | `213.126.59.35`   | 300 |
| A     | `app`| `213.126.59.35`   | 300 |
| CNAME | `www`| `kwizillo.nl.` resp. `kwizillo.com.` | 300 |

Nu staan beide domeinen op Hostnets parkeer-IP `91.184.0.200`: dat A-record voor
`@` verander je in `213.126.59.35`. De `www`-CNAME die er al staat is goed;
`app` is nieuw. Als Hostnet ook "webforwarding" of een "parkeerpagina" aan
heeft staan, zet dat uit. Geen AAAA-records (de server heeft geen IPv6 in DNS).

Controle (na 5–10 minuten): `dig +short kwizillo.nl app.kwizillo.com www.kwizillo.nl`
moet `213.126.59.35` geven.

## 2. Server voorbereiden

```bash
node -v                       # ≥ 20; draait al voor de Next.js-site
which node                    # pad in deploy/kwizillo.service zetten als het niet /usr/bin/node is
sudo apt install -y certbot python3-certbot-nginx git
sudo useradd --system --home /var/www/kwizillo --shell /usr/sbin/nologin kwizillo
sudo mkdir -p /var/www/kwizillo && sudo chown kwizillo:kwizillo /var/www/kwizillo
sudo ufw status               # 80/443 open; 8080 hoeft niet open (alleen localhost)
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

- `TRUST_PROXY=1` — rate-limit per bezoeker via `X-Forwarded-For` van nginx.
- `ALLOWED_ORIGINS=…` — `/api/tts` alleen vanuit de app-hostnames en de iOS-app
  (`capacitor://localhost`); andere Origins krijgen 403.
- `TTS_DAILY_CHARS=300000` — harde bovengrens op ElevenLabs-tekens per dag
  (cache-hits tellen niet mee). Pas aan op je abonnement.

Poort 8080 al bezet door iets anders? Zet `PORT=8081` in de unit en in
`proxy_pass` in de nginx-config.

## 5. nginx + HTTPS

```bash
sudo cp deploy/nginx-kwizillo.conf /etc/nginx/sites-available/kwizillo
sudo ln -s /etc/nginx/sites-available/kwizillo /etc/nginx/sites-enabled/kwizillo
sudo nginx -t && sudo systemctl reload nginx
curl -H 'Host: kwizillo.nl' http://127.0.0.1/ | head -3     # de NL-site over http

# Certificaten (DNS moet dan al kloppen). Certbot past de blokken aan en zet
# de http→https-redirect erbij; de bestaande sites raakt het niet.
sudo certbot --nginx -d kwizillo.nl -d www.kwizillo.nl -d app.kwizillo.nl \
                     -d kwizillo.com -d www.kwizillo.com -d app.kwizillo.com
sudo certbot renew --dry-run
```

Controle:

```bash
curl -I https://kwizillo.nl            # 200, HTML
curl -I https://kwizillo.com           # 200, Engelse pagina (via /en/)
curl -I https://kwizillo.com/privacy.html   # 200, Engelse privacy
curl -I https://app.kwizillo.nl        # 200, het spel
curl -s -X POST https://app.kwizillo.nl/api/tts -d '{}' -H 'Content-Type: application/json'
                                       # 403: geen Origin → geweigerd (goed)
```

Open daarna `https://app.kwizillo.nl` op de iPhone: intro, stem en video moeten
werken zoals over het LAN.

## 6. Updaten

```bash
cd /var/www/kwizillo && sudo -u kwizillo git pull && sudo systemctl restart kwizillo
```

De site heeft geen build-stap; een `git pull` is genoeg (nginx leest de bestanden
live). De TTS-cache (`.tts-cache/`) blijft staan, dus gesproken zinnen hoeven
niet opnieuw gemaakt te worden.

## 7. Later: de iOS-app

De Capacitor-app krijgt `https://app.kwizillo.nl` als server-URL voor `/api/tts`;
`capacitor://localhost` staat al in `ALLOWED_ORIGINS`. Aanpassen kan in
`deploy/kwizillo.service` (daarna `daemon-reload` + `restart`).
