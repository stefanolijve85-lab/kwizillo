# Milestone 1.1 — Quiz polish

Implemented on `develop` after hands-on browser feedback.

## Delivered

- Feedback modal redesigned to match Kwizillo's rounded fantasy-game visual language.
- Luna voice playback boosted with Web Audio gain + dynamics compression so perceived loudness is closer to Milo.
- Quiz narration begins immediately after render and is split into question + individual A/B/C/D answer segments.
- Answer tile currently being narrated receives a subtle lifted floating highlight.
- Any answer click, hint, navigation or screen change immediately cancels active and pending speech.
- Correct/incorrect feedback is narrated, including the explanation and optional fact.
- Hint button now opens a themed visual popup instead of a toast.
- Answer tiles auto-scale typography for long and extra-long answer text while preserving balanced tile sizes.
- Question art is now context-aware (science dissolve/light/body, space, history, habitats, ocean, jungle, weather, earth, mystery) and contains no answer labels or answer text.
- Existing music ducking, FX and voice selection remain intact.

## Automated checks

- 240 questions still present.
- 4 topics per world / 10 questions per topic.
- topic routing remains isolated.
- speech segments contain question then A/B/C/D options in order.
- feedback narration contains the explanation.
- duplicate answer submission is rejected.
- cancellation gate invalidates old speech immediately.

## Manual acceptance requested

1. Compare Milo and Luna perceived loudness on the same question.
2. Confirm speech begins quickly and A/B/C/D tiles lift as each answer is spoken.
3. Click an answer while speech is active and confirm it stops instantly.
4. Open Hint and confirm the themed card feels native to the game.
5. Test several long answer sentences for clean wrapping and balanced tile heights.
6. Review question illustrations across all six worlds for relevance without answer spoilers.
7. Review good and incorrect feedback cards on desktop and mobile-sized viewport.
