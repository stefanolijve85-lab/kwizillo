# Kwizillo V3.6 — geluid & naadloze muziekloops

# Kwizillo V3.2 — visual/audio fix

Deze versie corrigeert drie zaken uit V3.1:

- De onzichtbare klikvakken lichten niet meer op wanneer je met de muis over een wereld gaat.
- Appgeluiden zijn losgekoppeld van de stemkeuze en worden na de eerste klik via Web Audio geactiveerd.
- Milo en Luna kunnen via ElevenLabs als echte stemgids gebruikt worden. De ElevenLabs API-key staat alleen in de lokale Node-serveromgeving en nooit in de browsercode.

## Starten op macOS

Gebruik voor V3.2 niet meer `python3 -m http.server`. De ElevenLabs-route zit in `server.js`.

In Terminal:

```bash
cd ~/Downloads/kwizillo_v3_2_audio_voice_fixed
./start.command
```

De terminal vraagt lokaal om de ElevenLabs API-key. De invoer wordt niet op het scherm getoond en komt niet in de appbestanden terecht. Daarna opent de browser automatisch op:

`http://127.0.0.1:8080`

Stoppen: `Ctrl+C`.

## Stemkeuze

- Milo: de server kiest uit de beschikbare ElevenLabs-stemmen de best scorende mannelijke, warme/conversational stem.
- Luna: hetzelfde voor een vrouwelijke stem.
- Als je later exact twee specifieke stemmen wilt vastzetten, kan dat met `MILO_VOICE_ID` en `LUNA_VOICE_ID` als environment variables.

Gegenereerde spraak wordt lokaal in `.tts-cache` opgeslagen, zodat dezelfde vraag niet telkens opnieuw ElevenLabs-credits gebruikt.


## V3.3 — audio & stemkeuze
- De blauwe selectie-rand beweegt nu echt mee tussen Milo, Luna en Stil.
- De oude in de afbeelding ingebakken Milo-selectie wordt visueel gemaskeerd wanneer een andere keuze actief is.
- FX zijn nu echte lokale WAV-bestanden: tap, goed, fout, reward en wereld-overgang.
- Er is rustige, kindvriendelijke achtergrondmuziek die na de eerste klik start en daarna loept.
- “Stil” schakelt alleen de spreekstem uit; muziek en effecten blijven actief.
- Milo en Luna zoeken nu via ElevenLabs Voice Library naar native Nederlandse stemmen, met voorkeur voor jong + vriendelijk + professioneel.
- De TTS-aanroep zet language_code expliciet op nl.
- De server bewaart de gekozen stem lokaal, zodat niet bij iedere start opnieuw een stem hoeft te worden toegevoegd.

Als ElevenLabs geen Voice Library-toegang krijgt door API-key-permissies, controleer dan in ElevenLabs of de key toegang heeft tot Voices/Voice Library en Text to Speech.


## V3.4 fixes
- Luna volume/perceptie verbeterd ten opzichte van Milo
- quizvragen gebruiken nu relevante vraagillustraties i.p.v. de wereldachtergrond
- tandwiel en native bediening in Ouderzone toegevoegd
- klikbare gear/hotspots ook op andere pagina's zoals prestaties, collectie en statistieken


## V3.5 — content expansion
- 240 vragen totaal
- 40 vragen per wereld
- 10 unieke vragen per zichtbare onderwerptile
- klikken op een tile opent alleen dat onderwerp
- gele Start-quiz knop mixt alle vier onderwerpen van de wereld
- vragen worden waar mogelijk gefilterd op gekozen schoolgroep


## V3.6
- aparte Geluid & muziek-sectie
- FX en muziek los aan/uit
- aparte volumeregelaars
- vier muziekloops: Magisch, Avontuur, Ruimte, Rustig
- 16.000 s WAV-bestanden met nul-seam
- gapless Web Audio BufferSource looping
- crossfade bij trackwissel
- automatische music ducking tijdens Milo/Luna
