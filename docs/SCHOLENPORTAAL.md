# Kwizillo voor scholen — ontwerp

Status: ontwerp + fase 1 in aanbouw (branch `feature/scholen`), 8 oktober 2026.
Pilot: Montessorischool Emmen. Prijs: € 2 per leerling per jaar.

## Wat het is

Kinderen spelen Kwizillo in de browser (Chromebook, schoolcomputer, iPad) met hun
eigen voortgang, die op de server staat. De leerkracht beheert de klas en ziet per
leerling wat er gespeeld en geleerd is. De school heeft één account met een licentie.

Het spel zelf blijft één codebase: de school-modus is een laag eromheen (inloggen
en de voortgang synchroniseren), geen tweede app.

## Rollen

| Rol | Wat | Inloggen |
|---|---|---|
| Beheer (Kwizillo) | scholen, licenties, eerste leerkracht | opdrachtregel op de server (`tools/school-admin.cjs`) |
| Leerkracht | eigen klassen, leerlingen, inlogkaartjes, overzicht | e-mail + wachtwoord (uitnodigingslink) |
| Leerling | spelen | klascode → naam aantikken → plaatjescode (3 van 9 plaatjes) |

Geen open aanmelding in de pilot: Kwizillo maakt de school en de eerste leerkracht aan.

## Inloggen voor kinderen

1. `school.kwizillo.nl` → klascode (6 tekens, zonder verwarrende tekens als 0/O, 1/I).
2. De namen van de klas verschijnen (voornaam + eerste letter achternaam). Tik je naam.
3. Tik je drie plaatjes in de goede volgorde (9 plaatjes: 729 mogelijkheden).
4. Na 5 foute pogingen is die leerling 5 minuten op slot; per klascode en per IP
   geldt een tempolimiet. De leerkracht kan een nieuwe plaatjescode maken.

Het apparaat onthoudt de sessie tot "Uitloggen" (gedeelde Chromebooks: na het spelen
uitloggen; de sessie verloopt bovendien na 12 uur zonder gebruik).

## Gegevens (AVG)

Bewaard per leerling, en niets meer:

- weergavenaam (voornaam + letter), klas
- plaatjescode (gehasht, scrypt)
- de spelvoortgang: dezelfde JSON als het spel nu lokaal bewaart (`K.state`), zonder
  apparaatinstellingen die er niet toe doen
- tijdstip van laatste keer spelen

Niet: e-mail, geboortedatum, BSN, foto's, IP-adressen in de database. Logboeken
bevatten geen namen.

Regels:

- De school is verwerkingsverantwoordelijke, Kwizillo is verwerker. Vóór er echte
  leerlingen in gaan: verwerkersovereenkomst volgens het model van het
  **Privacyconvenant Onderwijs** (met privacybijsluiter), getekend door de school.
- Opslag op de eigen server in Nederland, alleen via HTTPS; databasebestand en
  backups versleuteld; toegang alleen voor Stefan en de beheerder van de server.
- De leerkracht kan een leerling (en daarmee alle gegevens) verwijderen; bij einde
  licentie worden alle gegevens van de school na 3 maanden verwijderd.
- Spraak: de naam van een kind gaat nooit naar ElevenLabs (zoals nu al).
- Laat de privacybijsluiter en de overeenkomst juridisch nakijken.

## Techniek

- **Server:** dezelfde Node-server (`server.js`), met een eigen deel onder
  `/api/school/*` (`school/`), aan te zetten met `SCHOOL_DB=/pad/kwizillo-school.db`.
- **Database:** SQLite via `node:sqlite` (ingebouwd in Node ≥ 22.13, geen extra
  pakketten): één bestand, eenvoudig te backuppen. Ruim genoeg voor duizenden leerlingen.
- **Wachtwoorden en codes:** `crypto.scrypt` met zout; sessietokens van 32 willekeurige
  bytes, in de database alleen als hash.
- **Leerkrachtsessie:** cookie `HttpOnly; Secure; SameSite=Strict`, en elke wijziging
  controleert de `Origin`.
- **Leerlingsessie:** token in de browser (`localStorage`), als `Authorization: Bearer`.
- **Synchronisatie:** bij inloggen haalt het spel de voortgang op; elke `K.save()`
  stuurt na 2 seconden rust de nieuwe stand (met versienummer; de laatste schrijver
  wint, een oudere versie wordt geweigerd en opnieuw opgehaald).
- **Licentie:** per school een aantal plaatsen en een einddatum. In school-modus geldt
  Premium voor alle spellen; zonder geldige licentie speelt een klas gratis-niveau.
- **iOS-app:** later (fase 3) dezelfde schoolinlog; licentie buiten de App Store
  gekocht is toegestaan voor diensten op meerdere platforms zolang de app niet naar die
  aankoop verwijst — vóór inzending opnieuw controleren.

## API (fase 1)

Leerkracht:

- `POST /api/school/teacher/login` `{email, password}` → cookie
- `POST /api/school/teacher/logout`
- `POST /api/school/teacher/invite/accept` `{token, password}` (uitnodigingslink, ook de link uit "wachtwoord vergeten")
- `POST /api/school/teacher/forgot` `{email}` → altijd `{ok:true}` (verraadt niet of een adres bestaat); een bekend adres krijgt een e-mail met een link (`#herstel=`, een uur geldig; max. 3 per adres per uur, 5 per IP per kwartier). Na een nieuw wachtwoord stoppen alle sessies van die leerkracht.
- `GET  /api/school/teacher/me` → leerkracht, school, licentie, klassen
- `POST /api/school/classes` `{name}` → klas met klascode
- `POST /api/school/classes/:id/pupils` `{names: [...]}` → leerlingen + plaatjescodes (eenmalig zichtbaar, om te printen)
- `POST /api/school/pupils/:id/reset-code` → nieuwe plaatjescode
- `DELETE /api/school/pupils/:id`
- `GET  /api/school/classes/:id/overview` → per leerling: gespeeld, goed, quizzen, werelden, Rekenen, Talen, laatst gespeeld

Leerling:

- `GET  /api/school/join/:code` → klasnaam + namen (alleen weergavenamen)
- `POST /api/school/pupil/login` `{code, pupilId, pictures:[i,j,k]}` → token
- `GET  /api/school/pupil/state` → `{state, version}`
- `PUT  /api/school/pupil/state` `{state, version}` → `{version}` of 409
- `POST /api/school/pupil/logout`

## Fasen

1. **Pilot (Montessori Emmen):** server-API + database, inloggen voor leerling en
   leerkracht, voortgang op de server, leerkrachtportaal (klas, leerlingen,
   inlogkaartjes printen, overzicht), webversie op `school.kwizillo.nl`
   (installeerbaar op een Chromebook). Beheer via de opdrachtregel.
2. Opdrachten/thema's klaarzetten, niveau en leertaal per leerling, export (CSV),
   meerdere leerkrachten en een schoolbeheerder, uitnodigen per e-mail.
3. Inloggen met Google (Chromebook-scholen), daarna Basispoort en Entree; licenties en
   facturen; schoolinlog in de iOS-app.

## Nodig van de server (Bryan)

- `node -v` (moet ≥ 22.13 zijn voor `node:sqlite`; anders bijwerken)
- een nginx-blok voor `school.kwizillo.nl` → dezelfde Node-service, met HTTPS
- een map voor de database buiten de webroot (bijv. `/var/lib/kwizillo/`), eigenaar
  `kwizillo`, en een dagelijkse versleutelde backup daarvan
- `SCHOOL_DB=/var/lib/kwizillo/kwizillo-school.db` in de service

## Live zetten (voor de beheerder van de server)

Voorwaarde: de code van `feature/scholen` staat op de server (nu draait daar
`website-video-assets`; samenvoegen gebeurt pas na akkoord van Stefan).

1. DNS (Stefan, bij Hostnet): A-record `school` → `84.86.23.137` (hetzelfde adres als
   `app.kwizillo.nl`).
2. Node-versie: `node -v` moet ≥ 22.13 zijn (`node:sqlite`).
3. Map voor de database, buiten de webroot:

   ```
   sudo mkdir -p /var/lib/kwizillo && sudo chown kwizillo:kwizillo /var/lib/kwizillo && sudo chmod 700 /var/lib/kwizillo
   ```

4. In de service (`/etc/systemd/system/kwizillo.service`, onder `[Service]`):

   ```
   Environment=SCHOOL_DB=/var/lib/kwizillo/kwizillo-school.db
   ```

   daarna `sudo systemctl daemon-reload && sudo systemctl restart kwizillo`.
5. nginx: een serverblok voor `school.kwizillo.nl`, gelijk aan dat van
   `app.kwizillo.nl` (proxy naar `127.0.0.1:8095`, met `proxy_set_header Host $host;`
   en `proxy_set_header X-Real-IP $remote_addr;`), plus een certificaat:
   `sudo certbot --nginx -d school.kwizillo.nl`.
6. Backup, dagelijks (cron van `kwizillo`), versleuteld en buiten de server bewaard:

   ```
   sqlite3 /var/lib/kwizillo/kwizillo-school.db ".backup /var/lib/kwizillo/backup.db" && gpg --symmetric --batch --passphrase-file ~/.backup-pass -o ~/backup-$(date +%F).db.gpg /var/lib/kwizillo/backup.db
   ```

7. De pilotschool aanmaken en de eerste leerkracht uitnodigen:

   ```
   cd /var/www/kwizillo-app
   sudo -u kwizillo SCHOOL_DB=/var/lib/kwizillo/kwizillo-school.db node tools/school-admin.cjs add-school "Montessorischool Emmen" 250 2027-07-31
   sudo -u kwizillo SCHOOL_DB=/var/lib/kwizillo/kwizillo-school.db node tools/school-admin.cjs invite 1 leerkracht@school.nl "Naam Leerkracht"
   ```

   De link die dat geeft, stuurt Stefan naar de leerkracht (7 dagen geldig).

8. E-mail voor "wachtwoord vergeten": een mailbox van kwizillo.nl (bijv. `noreply@kwizillo.nl`
   bij Hostnet), in een bestand dat alleen root kan lezen:

   ```
   sudo install -m 600 /dev/null /etc/kwizillo-smtp.env
   sudoedit /etc/kwizillo-smtp.env
   #   SMTP_HOST=smtp.hostnet.nl
   #   SMTP_PORT=587
   #   SMTP_USER=noreply@kwizillo.nl
   #   SMTP_PASS=...
   #   SMTP_FROM=Kwizillo <noreply@kwizillo.nl>
   ```

   en in de service (`sudo systemctl edit kwizillo`): `EnvironmentFile=/etc/kwizillo-smtp.env`.
   Zonder SMTP werkt alles behalve die e-mail; dan maakt de beheerder een link met
   `tools/school-admin.cjs reset <e-mail>` (24 uur geldig).

Controle: `https://school.kwizillo.nl/leraar/` toont het inlogscherm, en
`https://school.kwizillo.nl/` begint na de intro met "Wat is de code van je klas?".
