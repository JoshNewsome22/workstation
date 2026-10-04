/* A stand-in for the writing-help relay (tools/relay/), for qa/wording-client-test.js. It answers the two calls the
   panel makes, with the shapes the real relay uses:
     POST /api/redeem  {code}               -> 200 {token, expires} | 401 {error:'invalid_code'} | 429 {error:'rate_limited', retry_after}
     POST /api/rewrite {token, text, style} -> 200 {rewrites:[{style,text}], changes:[...], cautions:[...]}
                                              | 401 {error:'session_expired'|'invalid_token'} | 413 {error:'too_long'}
                                              | 429 {error:'rate_limited', retry_after} | 503 {error:'upstream'} | 400 {error:'bad_request'}
     GET  /api/health                       -> 200 {ok:true} | 503 {error:'setup_required'}   (the check the panel makes as its tab opens)
   Codes are single use; five wrong codes in a row are rate limited. CORS is answered for ONE origin (the page under
   test; the real relay is same-origin and sends no CORS headers at all), and only POST with a JSON body is allowed.
   The test drives it, not a browser, through three extra routes:
     GET /__log    every body received, the Origin and any Cookie header of each request
     POST /__mode  {mode:'ok'|'expire'|'ratelimit'|'down'|'slow'}   how /api/rewrite answers from now on
                   {site:'ok'|'absent'|'setup'}   'absent': every /api/ address answers the website's own 404 page (HTML), as
                                                  before the relay is uploaded; 'setup': the relay is there, not set up yet
     POST /__reset {codes:[...]}                                    forget sessions, failures and the log
   usage: node qa/wording-mock-relay.js [--port 8124] [--origin http://localhost:8123]   (--port 0: any free port; the first line
   printed names it) */
const http = require('http'), crypto = require('crypto');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const PORT = +arg('--port', process.env.PORT || 8124), ORIGIN = arg('--origin', process.env.ORIGIN || 'http://localhost:8123');
const STYLES = ['objective', 'concise', 'report', 'grammar'];
let codes, sessions, fails, mode, site, log;
function reset(list){
  codes = {}; (list || ['7KQ-M4P-2XD-V9H']).forEach(c => { codes[c] = true; });
  sessions = {}; fails = 0; mode = 'ok'; site = 'ok';
  log = {redeem:[], rewrite:[], health:0, cookies:[], origins:[], preflights:0};
}
reset();
/* a rewrite that keeps every placeholder where it was, the way the real one is told to */
function rewrite(text, style){
  if (style === 'grammar') return text.replace(/\bi\b/g, 'I').replace(/ +/g, ' ');
  let t = text.replace(/\bwas very upset\b/gi, 'cried and put [Student]’s head on the desk ([describe what you saw])')
    .replace(/\bhad a tantrum\b/gi, 'screamed and dropped to the floor')
    .replace(/\ba lot\b/gi, '[number] times').replace(/\bvery\s+/gi, '');
  if (style === 'concise') t = t.replace(/\s*\([^)]*\)/g, '');
  return t;
}
function send(res, code, body, extra){
  const h = Object.assign({'Content-Type':'application/json', 'Cache-Control':'no-store'}, extra || {});
  res.writeHead(code, h); res.end(JSON.stringify(body));
}
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0], origin = req.headers.origin || '';
  const cors = origin === ORIGIN ? {'Access-Control-Allow-Origin':ORIGIN, 'Vary':'Origin', 'Access-Control-Expose-Headers':'Retry-After'} : {};
  if (url.startsWith('/__')) {
    let raw = ''; req.on('data', c => { raw += c; });
    req.on('end', () => {
      let b = {}; try { b = raw ? JSON.parse(raw) : {}; } catch (e) {}
      if (url === '/__log') return send(res, 200, log);
      if (url === '/__mode') { if (b.mode) mode = b.mode; if (b.site) site = b.site; return send(res, 200, {mode, site}); }
      if (url === '/__reset') { reset(b.codes); return send(res, 200, {ok:true}); }
      if (url === '/__ping') return send(res, 200, {ok:true});
      send(res, 404, {error:'not_found'});
    });
    return;
  }
  if (req.method === 'OPTIONS') {
    log.preflights++;
    if (!cors['Access-Control-Allow-Origin']) { res.writeHead(403); return res.end(); }
    res.writeHead(204, Object.assign({'Access-Control-Allow-Methods':'POST', 'Access-Control-Allow-Headers':'Content-Type', 'Access-Control-Max-Age':'600'}, cors));
    return res.end();
  }
  if (site === 'absent' && url.startsWith('/api/')) {   /* the website's own "not found" page: no relay there yet */
    res.writeHead(404, Object.assign({'Content-Type':'text/html; charset=utf-8'}, cors));
    return res.end('<!doctype html><title>404 Not Found</title><h1>Not Found</h1><p>The requested URL was not found on this server.</p>');
  }
  if (url === '/api/health' && req.method === 'GET') {
    log.health++;
    return site === 'setup' ? send(res, 503, {error:'setup_required', message:'The rewrite service is not set up yet.'}, cors) : send(res, 200, {ok:true}, cors);
  }
  if (req.method !== 'POST' || !/^\/api\/(redeem|rewrite)$/.test(url)) return send(res, 404, {error:'not_found'}, cors);
  if (site === 'setup') return send(res, 503, {error:'setup_required', message:'The rewrite service is not set up yet.'}, cors);
  log.origins.push(origin); if (req.headers.cookie) log.cookies.push(req.headers.cookie);
  if (!cors['Access-Control-Allow-Origin']) return send(res, 403, {error:'origin'});
  if (!/^application\/json/.test(req.headers['content-type'] || '')) return send(res, 400, {error:'bad_request'}, cors);
  let raw = ''; req.on('data', c => { raw += c; if (raw.length > 200000) req.destroy(); });
  req.on('end', () => {
    let b = null; try { b = JSON.parse(raw); } catch (e) {}
    if (!b || typeof b !== 'object') return send(res, 400, {error:'bad_request'}, cors);
    if (url === '/api/redeem') {
      log.redeem.push(b);
      if (fails >= 5) return send(res, 429, {error:'rate_limited', retry_after:900}, Object.assign({'Retry-After':'900'}, cors));
      if (typeof b.code === 'string' && codes[b.code]) {
        delete codes[b.code]; fails = 0;
        const token = crypto.randomBytes(32).toString('hex');
        sessions[token] = {exp: Date.now() + 8 * 3600e3, n:0};
        return send(res, 200, {token, expires: new Date(sessions[token].exp).toISOString()}, cors);
      }
      fails++;
      return send(res, 401, {error:'invalid_code'}, cors);
    }
    log.rewrite.push(b);
    const go = () => {
      if (mode === 'down') return send(res, 503, {error:'upstream'}, cors);
      const s = typeof b.token === 'string' && sessions[b.token];
      if (!s) return send(res, 401, {error:'invalid_token'}, cors);
      if (mode === 'expire' || Date.now() > s.exp) { delete sessions[b.token]; return send(res, 401, {error:'session_expired'}, cors); }
      if (mode === 'ratelimit') return send(res, 429, {error:'rate_limited', retry_after:60}, Object.assign({'Retry-After':'60'}, cors));
      if (typeof b.text !== 'string' || !b.text.trim() || !STYLES.includes(b.style)) return send(res, 400, {error:'bad_request'}, cors);
      if (b.text.length > 4000) return send(res, 413, {error:'too_long'}, cors);
      s.n++;
      send(res, 200, {rewrites:[{style:b.style, text:rewrite(b.text, b.style)}],
        changes:['“was very upset” became what was seen', '“a lot” became a count to fill in'],
        cautions:['Fill in [number] with the count you took.']}, cors);
    };
    if (mode === 'slow') setTimeout(go, 3000); else go();
  });
});
server.listen(PORT, () => { process.stdout.write('mock relay on http://localhost:' + server.address().port + ' for ' + ORIGIN + '\n'); });
