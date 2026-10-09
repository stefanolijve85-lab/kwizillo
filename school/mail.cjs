// Sends the few e-mails of the school portal (a link to choose a new password)
// through the SMTP server of the Kwizillo mailbox. No package needed: one message
// per connection, STARTTLS on 587 or TLS on 465, never a password in plain text.
//
//   SMTP_HOST, SMTP_PORT (587 or 465), SMTP_USER, SMTP_PASS, SMTP_FROM
//
// The settings live in the service's environment on the server, never in the app.
const net = require('net'), tls = require('tls'), crypto = require('crypto');

function fromEnv(env = process.env) {
  if (!env.SMTP_HOST || !env.SMTP_FROM) return null;
  const port = Number(env.SMTP_PORT || 587);
  return createMailer({ host: env.SMTP_HOST, port, user: env.SMTP_USER, pass: env.SMTP_PASS, from: env.SMTP_FROM, mode: port === 465 ? 'tls' : 'starttls' });
}

// mode 'none' (no encryption) exists for the tests only.
function createMailer({ host, port, user, pass, from, mode = 'starttls', timeout = 20e3 }) {
  const b64 = s => Buffer.from(s, 'utf8').toString('base64');
  const clean = s => String(s).replace(/[\r\n]/g, '');
  return async function send({ to, subject, text }) {
    if (!/^[^@\s<>]+@[^@\s<>]+$/.test(to)) throw new Error('bad address');
    let sock = mode === 'tls' ? tls.connect({ host, port, servername: host }) : net.connect({ host, port });
    const timer = setTimeout(() => { stop(new Error('smtp timeout')); sock.destroy() }, timeout);
    let buf = '', waiting = null, broken = null;
    const onData = d => { buf += d; pump() };
    const pump = () => {
      // a reply is complete at a line "250 ..." (a dash after the code means more lines follow)
      const m = /(?:^|\r\n)(\d{3}) [^\r\n]*\r\n/.exec(buf);
      if (!m || !waiting) return;
      const reply = buf.slice(0, m.index + m[0].length); buf = buf.slice(reply.length);
      const w = waiting; waiting = null; w(reply);
    };
    const stop = e => { broken = broken || e; if (waiting) { const w = waiting; waiting = null; w(null, broken) } };
    const attach = s => { s.setEncoding('utf8'); s.on('data', onData); s.on('error', stop); s.on('close', () => stop(new Error('smtp: connection closed'))) };
    const reply = () => new Promise((ok, no) => { if (broken) return no(broken); waiting = (r, e) => e ? no(e) : ok(r); pump() });
    const cmd = async (line, expect) => {
      if (line !== null) sock.write(line + '\r\n');
      const r = await reply();
      if (!String(r).startsWith(String(expect))) throw new Error(`smtp: ${String(r).slice(0, 3)} after ${line === null ? 'greeting' : line.split(' ')[0]}`);
      return r;
    };
    attach(sock);
    try {
      await cmd(null, 220);
      let ehlo = await cmd('EHLO kwizillo.nl', 250);
      if (mode === 'starttls') {
        if (!/STARTTLS/i.test(ehlo)) throw new Error('smtp: no STARTTLS');
        await cmd('STARTTLS', 220);
        sock.removeAllListeners('data'); sock.removeAllListeners('close'); sock.removeAllListeners('error');
        sock = tls.connect({ socket: sock, servername: host });
        attach(sock);
        await new Promise((ok, no) => { sock.once('secureConnect', ok); sock.once('error', no) });
        ehlo = await cmd('EHLO kwizillo.nl', 250);
      }
      if (user) await cmd('AUTH PLAIN ' + b64(`\0${user}\0${pass || ''}`), 235);
      const addr = clean(/<([^>]+)>/.exec(from)?.[1] || from);
      await cmd(`MAIL FROM:<${addr}>`, 250);
      await cmd(`RCPT TO:<${clean(to)}>`, 25);
      await cmd('DATA', 354);
      const body = b64(text).replace(/.{76}/g, '$&\r\n');
      const msg = [
        `From: ${clean(from)}`, `To: <${clean(to)}>`, `Subject: =?UTF-8?B?${b64(clean(subject))}?=`,
        `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`, `Message-ID: <${crypto.randomUUID()}@${addr.split('@')[1]}>`,
        'MIME-Version: 1.0', 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: base64', '', body, '.',
      ].join('\r\n');
      await cmd(msg, 250);
      sock.write('QUIT\r\n');
    } finally { clearTimeout(timer); sock.end() }
  };
}

module.exports = { fromEnv, createMailer };
