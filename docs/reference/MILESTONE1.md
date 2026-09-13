# Milestone 1 — Dynamic quiz engine, voice and interaction reliability

Implemented on `develop`.

## Delivered
- Data-driven topic routing for all six worlds and 24 topics.
- Randomized answer positions without mutating source questions.
- Question speech includes prompt plus A/B/C/D options.
- Speech fetch/playback is cancellable immediately on interaction/navigation.
- Double-submit guard prevents one question from being recorded twice.
- Native, reliable result buttons for `Nog een quiz` and collection navigation.
- Contextual question art no longer contains answer text or answer labels.
- Existing music/FX controls and Milo/Luna/Stil selection remain available.
- Automated acceptance tests for 240-question content shape, routing, speech sequence, double-submit prevention and speech cancellation token logic.
- GitHub Actions workflow runs tests on develop and pull requests.

## Manual acceptance still required
- Browser/mobile visual check of all six worlds.
- ElevenLabs live voice check with a valid local API key.
- Confirm music/FX sliders and track switching behave correctly in browser.
- Confirm result buttons and navigation are comfortable on mobile dimensions.

Do not merge to `main` until the manual acceptance check is complete.
