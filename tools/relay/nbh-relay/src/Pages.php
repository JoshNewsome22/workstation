<?php

declare(strict_types=1);

namespace NBH\Relay;

/**
 * The relay's three pages (setup, sign in, admin), one stylesheet and one script, both allowed by the
 * page's own nonce and nothing else (Content-Security-Policy). The server writes no label or other entered
 * text into the HTML: the admin list is built in the browser from JSON with textContent, never as HTML.
 */
final class Pages
{
    public static function e(string $s): string
    {
        return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8');
    }

    /** A page with no script, for the rare answers that are not part of the admin page. */
    public static function message(string $title, string $text): string
    {
        return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            . '<title>' . self::e($title) . '</title></head><body><h1>' . self::e($title) . '</h1><p>' . self::e($text) . '</p></body></html>';
    }

    /**
     * @param list<array{what:string,ok:bool,fix:string}> $checks
     * @param list<string> $warnings
     */
    public static function setup(array $checks, array $warnings, bool $showHelper, string $base, string $nonce): string
    {
        $items = '';
        foreach ($checks as $c) {
            $items .= '<li class="' . ($c['ok'] ? 'ok' : 'todo') . '"><span class="mark" aria-hidden="true">' . ($c['ok'] ? '&#10003;' : '!') . '</span>'
                . '<div><span class="sr">' . ($c['ok'] ? 'Done: ' : 'To do: ') . '</span><b>' . self::e($c['what']) . '</b>'
                . (!$c['ok'] && $c['fix'] !== '' ? '<p>' . self::e($c['fix']) . '</p>' : '') . '</div></li>';
        }
        $main = '<section class="card" aria-labelledby="h-setup"><h2 id="h-setup">Set up the writing-help relay</h2>'
            . '<p>This relay lets "Rewrite with Claude" in the forms reach Anthropic\'s API without the API key ever being in the forms. '
            . 'Finish the steps marked <b>!</b>, then reload this page. The README that came with the upload explains each one.</p>'
            . '<ol class="checks">' . $items . '</ol></section>';
        if ($warnings !== []) {
            $main .= '<section class="card"><h2>Notes</h2><ul>';
            foreach ($warnings as $w) {
                $main .= '<li>' . self::e($w) . '</li>';
            }
            $main .= '</ul></section>';
        }
        if ($showHelper) {
            $main .= <<<HTML
<section class="card" aria-labelledby="h-pw">
  <h2 id="h-pw">Choose the admin password</h2>
  <p>Use at least 10 characters; a few words make a password that is long and easy to remember. This page turns it into one line for config.php. The password itself is not kept anywhere.</p>
  <form id="f-hash" novalidate>
    <label for="pw1">New admin password</label>
    <input id="pw1" type="password" autocomplete="new-password" required>
    <label for="pw2">The same password again</label>
    <input id="pw2" type="password" autocomplete="new-password" required>
    <div class="row"><button type="submit">Make the line for config.php</button></div>
    <p class="msg" id="hash-msg" role="status" aria-live="polite"></p>
  </form>
  <div id="hash-out" hidden>
    <p>In cPanel's File Manager, open <b>nbh-relay/config.php</b> with Edit, replace the whole line that starts with <code>'ADMIN_PASSWORD_HASH'</code> with this line, save, and reload this page:</p>
    <textarea id="hash-line" readonly rows="3" aria-label="The line for config.php"></textarea>
    <div class="row"><button type="button" id="hash-copy">Copy the line</button></div>
  </div>
</section>
HTML;
        }
        return self::layout('Writing-help relay: setup', 'setup', $base, $nonce, $main);
    }

    public static function signIn(string $base, string $nonce): string
    {
        $main = <<<HTML
<section class="card" aria-labelledby="h-in">
  <h2 id="h-in">Sign in</h2>
  <form id="f-signin" novalidate>
    <label for="pw">Admin password</label>
    <input id="pw" type="password" autocomplete="current-password" required>
    <div class="row"><button type="submit">Sign in</button></div>
    <p class="msg" id="signin-msg" role="status" aria-live="polite"></p>
  </form>
</section>
<section class="card">
  <h2>What this page is for</h2>
  <p>Make one-time passcodes that unlock "Rewrite with Claude" in the forms, see which sessions are open, and end them.</p>
</section>
HTML;
        return self::layout('Writing-help relay: sign in', 'signin', $base, $nonce, $main);
    }

    /**
     * @param list<string> $warnings
     */
    public static function dashboard(string $base, array $warnings, string $nonce): string
    {
        $notes = '';
        if ($warnings !== []) {
            $notes = '<section class="card"><h2>Notes</h2><ul>';
            foreach ($warnings as $w) {
                $notes .= '<li>' . self::e($w) . '</li>';
            }
            $notes .= '</ul></section>';
        }
        // The admin page's CSRF token is not in this page: the sign-in answer gives it to the tab that signed in, which keeps
        // it in sessionStorage, so a script elsewhere on the website (which can fetch this page with the cookie) cannot
        // read it. A tab without it (a new tab, a restored one) is asked for the password again.
        $main = <<<HTML
<section class="card" id="again" hidden aria-labelledby="h-again">
  <h2 id="h-again">Sign in again in this tab</h2>
  <p class="muted">The admin page keeps its sign-in to the browser tab it was made in. Enter the admin password to use this tab.</p>
  <form id="f-again" novalidate>
    <label for="pw-again">Admin password</label>
    <input id="pw-again" type="password" autocomplete="current-password" required>
    <div class="row"><button type="submit">Sign in</button></div>
    <p class="msg" id="again-msg" role="status" aria-live="polite"></p>
  </form>
</section>
<div id="dash">
<section class="card" aria-labelledby="h-new">
  <h2 id="h-new">New passcode</h2>
  <p class="muted">A passcode unlocks "Rewrite with Claude" once, in one browser tab, for the session length shown under Status. Give it to the person yourself (in person, by phone or text), not inside a saved file.</p>
  <form id="f-code" novalidate>
    <label for="code-label">Who it is for (optional; only you see it)</label>
    <input id="code-label" maxlength="60" autocomplete="off" spellcheck="false">
    <label for="code-hours">Must be used within</label>
    <select id="code-hours"></select>
    <div id="code-pw-row" hidden>
      <label for="code-pw">Admin password, again</label>
      <p class="muted" id="code-pw-note">Asked again when it was last typed more than 10 minutes ago, so that nothing else on this website can make a passcode in your name.</p>
      <input id="code-pw" type="password" autocomplete="current-password" aria-describedby="code-pw-note">
    </div>
    <div class="row"><button type="submit">Create passcode</button></div>
    <p class="msg" id="code-msg" role="status" aria-live="polite"></p>
  </form>
  <div id="newcode" hidden tabindex="-1" aria-labelledby="nc-title">
    <p id="nc-title"><b>New passcode<span id="nc-for"></span></b></p>
    <p><span class="code" id="nc-code"></span></p>
    <p class="muted" id="nc-note"></p>
    <div class="row"><button type="button" id="nc-copy">Copy</button><button type="button" class="quiet" id="nc-done">Done</button></div>
  </div>
</section>
<section class="card" aria-labelledby="h-codes">
  <h2 id="h-codes">Unused passcodes</h2>
  <ul class="items" id="codes"></ul>
  <p class="muted" id="codes-empty">None.</p>
</section>
<section class="card" aria-labelledby="h-sessions">
  <h2 id="h-sessions">Open sessions</h2>
  <ul class="items" id="sessions"></ul>
  <p class="muted" id="sessions-empty">None.</p>
  <div class="row"><button type="button" class="danger" id="end-all" hidden>End all sessions</button></div>
</section>
<section class="card" aria-labelledby="h-status">
  <h2 id="h-status">Status</h2>
  <ul id="status"></ul>
  <div class="row" id="unlock-row" hidden><button type="button" class="quiet" id="unlock">Clear the wrong tries</button></div>
</section>
{$notes}
<div class="row bar"><button type="button" class="quiet" id="refresh">Refresh</button><button type="button" class="quiet" id="signout">Sign out</button></div>
<p class="msg" id="page-msg" role="status" aria-live="polite"></p>
</div>
HTML;
        return self::layout('Writing-help relay: admin', 'dashboard', $base, $nonce, $main);
    }

    private static function layout(string $title, string $mode, string $base, string $nonce, string $main): string
    {
        $t = self::e($title);
        $b = self::e($base);
        $n = self::e($nonce);
        $css = self::CSS;
        $js = self::JS;
        return <<<HTML
<!doctype html>
<html lang="en" data-base="{$b}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<title>{$t}</title>
<style nonce="{$n}">{$css}</style>
</head>
<body data-mode="{$mode}">
<header><div class="wrap"><h1>Writing help <span class="muted">relay</span></h1></div></header>
<main class="wrap">
{$main}
</main>
<script nonce="{$n}">{$js}</script>
</body>
</html>
HTML;
    }

    private const CSS = <<<'CSS'
:root{--bg:#f4f6f8;--card:#fff;--ink:#1c232b;--muted:#56616d;--line:#d3dae1;--accent:#1d5f8a;--on-accent:#fff;--ok:#1b7443;--bad:#a12a2a;--warn:#7d5300;--code:#eaf1f6;color-scheme:light dark}
@media (prefers-color-scheme:dark){:root{--bg:#12161b;--card:#1b2229;--ink:#e7ecf1;--muted:#a1acb7;--line:#33404b;--accent:#74b4df;--on-accent:#0c1922;--ok:#62c78f;--bad:#ff8b81;--warn:#f0c062;--code:#24303a}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
header{background:var(--card);border-bottom:1px solid var(--line)}
.wrap{max-width:780px;margin:0 auto;padding:12px 16px}
main.wrap{padding-bottom:40px}
h1{font-size:1.3rem;margin:4px 0}
h1 .muted{font-weight:400}
h2{font-size:1.1rem;margin:0 0 8px}
p{margin:8px 0}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin:16px 0}
label{display:block;font-weight:600;margin:14px 0 4px}
input,select,textarea{font:inherit;width:100%;min-height:44px;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink)}
textarea{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.85rem;word-break:break-all}
button{font:inherit;font-weight:600;min-height:44px;min-width:44px;padding:8px 16px;border-radius:8px;border:1px solid var(--accent);background:var(--accent);color:var(--on-accent);cursor:pointer}
button.quiet{background:transparent;color:var(--accent)}
button.danger{background:transparent;border-color:var(--bad);color:var(--bad)}
button[disabled]{opacity:.55;cursor:default}
:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:14px}
.bar{justify-content:flex-end}
.msg{margin:10px 0 0;min-height:1.5em}
.msg.bad{color:var(--bad)}
.msg.ok{color:var(--ok)}
.muted{color:var(--muted)}
.warn{color:var(--warn)}
.code{display:inline-block;font:700 1.55rem/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.06em;background:var(--code);padding:12px 16px;border-radius:8px;-webkit-user-select:all;user-select:all;overflow-wrap:anywhere}
ul.items{list-style:none;margin:0;padding:0}
ul.items li{border-top:1px solid var(--line);padding:12px 0;display:flex;flex-wrap:wrap;gap:8px 16px;justify-content:space-between;align-items:center}
ul.items li:first-child{border-top:0}
ul.items .who{font-weight:600;overflow-wrap:anywhere}
ol.checks{list-style:none;margin:0;padding:0}
ol.checks li{display:flex;gap:12px;padding:10px 0;border-top:1px solid var(--line)}
ol.checks li:first-child{border-top:0}
ol.checks .mark{flex:0 0 28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700}
ol.checks li.ok .mark{background:var(--ok);color:var(--card)}
ol.checks li.todo .mark{background:var(--warn);color:var(--card)}
ol.checks p{margin:4px 0 0}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:var(--code);padding:1px 4px;border-radius:4px}
[hidden]{display:none!important}
CSS;

    private const JS = <<<'JS'
(function () {
  'use strict';
  var BASE = document.documentElement.getAttribute('data-base') || '';
  /* the CSRF token: from the sign-in answer, kept for this tab only (sessionStorage; where that is refused, it comes
     along in the address's #fragment once and is taken out of it at once). The page itself never carries it. */
  var KEY = 'nbh.relay.csrf', CSRF = '';
  try { CSRF = sessionStorage.getItem(KEY) || ''; } catch (e) {}
  var hm = /^#t=([A-Za-z0-9_-]{20,100})$/.exec(location.hash || '');
  if (hm) { CSRF = hm[1]; try { sessionStorage.setItem(KEY, CSRF); } catch (e) {} try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
  function keep(t) { CSRF = t || ''; try { if (CSRF) sessionStorage.setItem(KEY, CSRF); else sessionStorage.removeItem(KEY); return !CSRF || sessionStorage.getItem(KEY) === CSRF; } catch (e) { return false; } }
  function enter(t) { location.replace(BASE + '/admin' + (keep(t) ? '' : '#t=' + t)); }
  function $(id) { return document.getElementById(id); }
  /* every element is built here; text goes in as text, never as HTML */
  function el(tag, props, kids) {
    var e = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k];
      if (k === 'text') e.textContent = v;
      else if (k === 'class') e.className = v;
      else if (k === 'onclick') e.addEventListener('click', v);
      else e.setAttribute(k, v);
    });
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function say(id, text, kind) { var m = $(id); if (m) { m.textContent = text || ''; m.className = 'msg' + (kind ? ' ' + kind : ''); } }
  function when(t) {
    if (!t) return '';
    var d = new Date(t * 1000);
    try { return d.toLocaleString([], {dateStyle: 'medium', timeStyle: 'short'}); } catch (e) { return d.toLocaleString(); }
  }
  function minutes(s) { var m = Math.max(1, Math.round(s / 60)); return m + (m === 1 ? ' minute' : ' minutes'); }
  function hoursText(h) { return h % 24 === 0 && h >= 48 ? (h / 24) + ' days' : h === 1 ? '1 hour' : h + ' hours'; }
  function call(method, path, body) {
    var opts = {method: method, credentials: 'same-origin', cache: 'no-store', redirect: 'error', headers: {'X-CSRF-Token': CSRF}};
    if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    return fetch(BASE + path, opts).then(function (res) {
      return res.text().then(function (t) {
        var d = null; try { d = t ? JSON.parse(t) : null; } catch (e) {}
        return {status: res.status, ok: res.ok, data: d && typeof d === 'object' ? d : {}};
      });
    }, function () { return {status: 0, ok: false, data: {}}; });
  }
  function problem(r, fallback) {
    if (r.status === 0) return 'The relay could not be reached. Check the connection and try again.';
    if (r.status === 401 && r.data.error === 'signed_out') { setTimeout(function () { location.replace(BASE + '/admin'); }, 1500); return 'You were signed out. Sign in again.'; }
    if (r.status === 403 && r.data.error === 'csrf') { keep(''); setTimeout(function () { location.replace(BASE + '/admin'); }, 1500); return 'This tab is not signed in any more. Sign in again.'; }
    var m = typeof r.data.message === 'string' ? r.data.message : (fallback || 'Something went wrong (error ' + r.status + ').');
    if (r.status === 429 && typeof r.data.retry_after === 'number') m += ' (about ' + minutes(r.data.retry_after) + ')';
    return m;
  }
  function copy(text, btn) {
    function done(ok) { var t = btn.textContent; btn.textContent = ok ? 'Copied' : 'Select it and copy'; setTimeout(function () { btn.textContent = t; }, 2000); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    else done(false);
  }
  function busy(btn, on) { if (btn) btn.disabled = !!on; }

  /* ---------------------------------------------------------------- setup: the admin password line */
  function setupMode() {
    var f = $('f-hash'); if (!f) return;
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var a = $('pw1').value, b = $('pw2').value, btn = f.querySelector('button[type=submit]');
      if (a.length < 10) { say('hash-msg', 'Use at least 10 characters.', 'bad'); $('pw1').focus(); return; }
      if (a !== b) { say('hash-msg', 'The two passwords are not the same.', 'bad'); $('pw2').focus(); return; }
      busy(btn, true); say('hash-msg', 'Working…');
      call('POST', '/api/admin/password-hash', {password: a}).then(function (r) {
        busy(btn, false);
        if (!r.ok || typeof r.data.line !== 'string') { say('hash-msg', problem(r), 'bad'); return; }
        $('pw1').value = ''; $('pw2').value = '';
        $('hash-line').value = r.data.line;
        $('hash-out').hidden = false;
        say('hash-msg', 'Done. Copy the line below into config.php.', 'ok');
        $('hash-line').focus(); $('hash-line').select();
      });
    });
    $('hash-copy').addEventListener('click', function () { copy($('hash-line').value, this); });
  }

  /* ---------------------------------------------------------------- sign in */
  function signInMode() {
    var f = $('f-signin');
    $('pw').focus();
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var pw = $('pw').value, btn = f.querySelector('button[type=submit]');
      if (!pw) { say('signin-msg', 'Enter the admin password.', 'bad'); return; }
      busy(btn, true); say('signin-msg', 'Signing in…');
      call('POST', '/api/admin/login', {password: pw}).then(function (r) {
        busy(btn, false);
        if (r.ok) { $('pw').value = ''; say('signin-msg', 'Signed in.', 'ok'); enter(r.data.csrf); return; }
        say('signin-msg', problem(r), 'bad'); $('pw').select();
      });
    });
  }

  /* ---------------------------------------------------------------- the admin page */
  function dashboardMode() {
    var state = null;
    /* a tab with no token of its own (a new tab, a restored one, or one whose token was refused): the password again */
    if (!CSRF) {
      $('dash').hidden = true; $('again').hidden = false; $('pw-again').focus();
      $('f-again').addEventListener('submit', function (ev) {
        ev.preventDefault();
        var pw = $('pw-again').value, btn = this.querySelector('button[type=submit]');
        if (!pw) { say('again-msg', 'Enter the admin password.', 'bad'); return; }
        busy(btn, true); say('again-msg', 'Signing in…');
        call('POST', '/api/admin/login', {password: pw}).then(function (r) {
          busy(btn, false);
          if (r.ok) { $('pw-again').value = ''; say('again-msg', 'Signed in.', 'ok'); enter(r.data.csrf); return; }
          say('again-msg', problem(r), 'bad'); $('pw-again').select();
        });
      });
      return;
    }
    function load() {
      return call('GET', '/api/admin/state').then(function (r) {
        if (!r.ok) { say('page-msg', problem(r), 'bad'); return; }
        state = r.data; render(); say('page-msg', '');
      });
    }
    function render() {
      var st = state, L = st.limits;
      var sel = $('code-hours');
      if (!sel.options.length) {
        var hs = [1, 2, 4, 8, 24, 48, 72, 168, 336, 720].filter(function (h) { return h <= L.max_code_hours; });
        if (hs.indexOf(L.code_hours) < 0) { hs.push(L.code_hours); hs.sort(function (a, b) { return a - b; }); }
        hs.forEach(function (h) { var o = el('option', {value: String(h), text: hoursText(h)}); if (h === L.code_hours) o.selected = true; sel.appendChild(o); });
      }
      var codes = $('codes'); codes.textContent = '';
      st.codes.forEach(function (c) {
        codes.appendChild(el('li', null, [
          el('div', null, [el('div', {class: 'who', text: c.label || 'No label'}), el('div', {class: 'muted', text: 'Made ' + when(c.created) + '. Usable until ' + when(c.expires) + '.'})]),
          el('button', {type: 'button', class: 'danger', text: 'Revoke', 'aria-label': 'Revoke the passcode ' + (c.label ? 'for ' + c.label : 'made ' + when(c.created)), onclick: function () { revoke('/api/admin/codes/revoke', c.id, this, 'Revoke this passcode? It will not work any more.'); }})
        ]));
      });
      $('codes-empty').hidden = st.codes.length > 0;
      var ses = $('sessions'); ses.textContent = '';
      st.sessions.forEach(function (s) {
        ses.appendChild(el('li', null, [
          el('div', null, [
            el('div', {class: 'who', text: s.label || 'No label'}),
            el('div', {class: 'muted', text: 'Started ' + when(s.created) + '. Ends ' + when(s.expires) + '.'}),
            el('div', {class: 'muted', text: 'Rewrites: ' + s.rewrites + ' of ' + L.rewrites_per_session + (s.last_used ? '. Last used ' + when(s.last_used) + '.' : '.')})
          ]),
          el('button', {type: 'button', class: 'danger', text: 'End', 'aria-label': 'End the session ' + (s.label ? 'for ' + s.label : 'started ' + when(s.created)), onclick: function () { revoke('/api/admin/sessions/revoke', s.id, this, 'End this session? That tab will need a new passcode.'); }})
        ]));
      });
      $('sessions-empty').hidden = st.sessions.length > 0;
      $('end-all').hidden = st.sessions.length === 0;
      var ul = $('status'); ul.textContent = '';
      ul.appendChild(el('li', {class: st.api_key_set ? '' : 'warn', text: st.api_key_set ? 'API key: set.' : 'API key: not set. Rewrites will not work until it is in config.php.'}));
      ul.appendChild(el('li', {text: 'A session lasts ' + hoursText(L.session_hours) + ' and allows ' + L.rewrites_per_session + ' rewrites of up to ' + L.max_chars + ' characters each.'}));
      ul.appendChild(el('li', {text: 'Rewrites in the last 24 hours: ' + st.rewrites_today + ' (the relay stops at ' + L.rewrites_per_day + ').'}));
      ul.appendChild(el('li', {text: 'Wrong passcode tries in the last ' + L.fail_window_minutes + ' minutes: ' + st.wrong_passcodes + '.'}));
      if (st.passcode_pause > 0) ul.appendChild(el('li', {class: 'warn', text: 'Passcode entry is paused for everyone for about ' + minutes(st.passcode_pause) + ' after too many wrong tries.'}));
      ul.appendChild(el('li', {text: 'Wrong admin passwords in the last ' + L.fail_window_minutes + ' minutes: ' + st.wrong_passwords + '.'}));
      if (st.sign_in_pause > 0) ul.appendChild(el('li', {class: 'warn', text: 'Signing in is paused for about ' + minutes(st.sign_in_pause) + ' after too many wrong passwords, except on devices that have signed in here before.'}));
      $('unlock-row').hidden = !(st.wrong_passcodes > 0 || st.wrong_passwords > 0);
      if (st.password_after === 0) $('code-pw-row').hidden = false;
    }
    function revoke(path, id, btn, question) {
      if (!window.confirm(question)) return;
      busy(btn, true);
      call('POST', path, {id: id}).then(function (r) {
        busy(btn, false);
        if (!r.ok) { say('page-msg', problem(r), 'bad'); return; }
        say('page-msg', 'Done.', 'ok'); load();
      });
    }
    $('f-code').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var btn = this.querySelector('button[type=submit]');
      var body = {label: $('code-label').value, hours: parseInt($('code-hours').value, 10)};
      var pwRow = $('code-pw-row'), pw = $('code-pw');
      if (!pwRow.hidden) {
        if (!pw.value) { say('code-msg', 'Enter the admin password again to create a passcode.', 'bad'); pw.focus(); return; }
        body.password = pw.value;
      }
      busy(btn, true); say('code-msg', 'Creating…');
      call('POST', '/api/admin/codes', body).then(function (r) {
        busy(btn, false);
        if (r.status === 403 && r.data.error === 'password_needed') {
          pwRow.hidden = false; say('code-msg', 'Enter the admin password again to create a passcode.', 'bad'); pw.focus(); return;
        }
        if (r.status === 401 && r.data.error === 'wrong_password') { say('code-msg', problem(r), 'bad'); pw.select(); return; }
        if (!r.ok || typeof r.data.code !== 'string') { say('code-msg', problem(r), 'bad'); return; }
        pw.value = ''; pwRow.hidden = true;
        say('code-msg', '');
        $('nc-for').textContent = r.data.label ? ' for ' + r.data.label : '';
        $('nc-code').textContent = r.data.code;
        $('nc-note').textContent = 'Shown only now. It works once, until ' + when(r.data.expires) + '.';
        $('newcode').hidden = false; $('newcode').focus();
        $('code-label').value = '';
        load();
      });
    });
    $('nc-copy').addEventListener('click', function () { copy($('nc-code').textContent, this); });
    $('nc-done').addEventListener('click', function () { $('nc-code').textContent = ''; $('newcode').hidden = true; $('code-label').focus(); });
    $('end-all').addEventListener('click', function () {
      if (!window.confirm('End every open session? Each tab will need a new passcode.')) return;
      var btn = this; busy(btn, true);
      call('POST', '/api/admin/sessions/revoke-all', {}).then(function (r) { busy(btn, false); say('page-msg', r.ok ? 'All sessions ended.' : problem(r), r.ok ? 'ok' : 'bad'); load(); });
    });
    $('unlock').addEventListener('click', function () {
      var btn = this; busy(btn, true);
      call('POST', '/api/admin/unlock', {}).then(function (r) { busy(btn, false); say('page-msg', r.ok ? 'Cleared: passcodes and the admin password can be tried again.' : problem(r), r.ok ? 'ok' : 'bad'); load(); });
    });
    $('refresh').addEventListener('click', function () { say('page-msg', 'Refreshing…'); load(); });
    $('signout').addEventListener('click', function () {
      call('POST', '/api/admin/logout', {}).then(function () { keep(''); location.replace(BASE + '/admin'); });
    });
    load();
  }

  var mode = document.body.getAttribute('data-mode');
  if (mode === 'setup') setupMode();
  else if (mode === 'signin') signInMode();
  else if (mode === 'dashboard') dashboardMode();
})();
JS;
}
