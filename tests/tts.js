// A spoken line reaches the proxy in one of two shapes: the lines the app
// fetches ahead of time go as a POST body, and the one line it streams so the
// guide can start at once goes as a query string. A test cares about what was
// said, not about which of the two carried it.
const TTS = '**/api/tts**';          // the glob has to cover the query string
function ttsPayload(request) {
  const url = new URL(request.url());
  if (url.searchParams.has('text')) {
    return { text: url.searchParams.get('text'), voice: url.searchParams.get('voice'), lang: url.searchParams.get('lang') };
  }
  try { return JSON.parse(request.postData() || '{}') } catch { return {} }
}
module.exports = { TTS, ttsPayload };
