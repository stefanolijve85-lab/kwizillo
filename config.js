// The only configuration the page needs. It lives in its own file rather than in
// an inline <script> so the content security policy can stay script-src 'self':
// no inline script can run, so no analytics or ad snippet can be pasted in.
// tools/build-www.cjs rewrites the two URLs for the iOS build.
window.KWIZILLO_CONFIG = {
  elevenLabsProxyUrl: '/api/tts',
  voiceStatusUrl: '/api/voice-status',
  allowBrowserVoiceFallback: false,
  // The first line of a sequence is streamed, so the guide starts talking while
  // the sentence is still being made. Set to false to compare timings.
  streamSpeech: true
};
