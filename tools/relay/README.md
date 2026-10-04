# Writing-help relay: setting up "Rewrite with Claude" on newsomebh.com

The forms' **Improve wording** panel has three kinds of help. Two work with nothing extra: Apple's Writing Tools
(on Apple Intelligence iPads) and **Check wording** (offline, on the device). The third, **Rewrite with Claude**,
needs this relay: a small program on your own website that holds your Anthropic API key, so the key is never in
the forms. Staff unlock Rewrite with Claude once per browser tab with a **one-time passcode** that you make on the
relay's admin page.

Setting it up takes about 20 minutes and is done once. You need:

* your GoDaddy cPanel login for newsomebh.com (the forms are at https://newsomebh.com/workstation-rps/);
* an Anthropic account with API access and billing set up, at https://console.anthropic.com;
* the file **nbh-relay-upload.zip**.

---

## 1. Choose PHP 8.1 or newer

1. Sign in to cPanel. Under **Software**, open **MultiPHP Manager**.
2. Tick **newsomebh.com**, choose **PHP 8.1** or newer (the newest offered is best, for example 8.3), and press **Apply**.
3. If your cPanel also has **Select PHP Version**, open it, go to **Extensions**, and make sure these are ticked:
   **pdo_sqlite**, **curl**, **openssl**, **json**, **mbstring** (they usually are). The relay's setup page
   (step 3) tells you if one is missing.

## 2. Upload and extract the zip in your home folder

1. In cPanel, under **Files**, open **File Manager**. It opens in your **home folder**: the one whose path is shown
   as `/home/` and your cPanel user name, and that holds `public_html`.
2. Press **Upload**, choose `nbh-relay-upload.zip`, wait until it says 100%, then go back to File Manager.
3. In the home folder, right-click `nbh-relay-upload.zip`, choose **Extract**, and extract into the home folder
   itself (the path it suggests). This makes two things:
   * `public_html/ai/` with `index.php` and `.htaccess`: the web address **https://newsomebh.com/ai/**;
   * `nbh-relay/` next to `public_html` (not inside it): the relay itself, where nothing can be downloaded from
     the web.
4. Delete `nbh-relay-upload.zip` from the home folder.

To see `.htaccess` in File Manager, open **Settings** (top right) and tick **Show Hidden Files (dotfiles)**.

**If your forms are not in `public_html`.** The `ai` folder must sit in the same folder as `workstation-rps`. If
newsomebh.com is an addon domain with its own folder, move `public_html/ai` into that folder. If that folder is
itself inside `public_html` (for example `public_html/newsomebh.com/`), also open `ai/index.php` with **Edit** and
change the one line near the top to the full path of the relay folder, for example:
`$NBH_RELAY = '/home/yourusername/nbh-relay';`

## 3. Open the setup page

Go to **https://newsomebh.com/ai/admin**. The first visit makes the settings file `nbh-relay/config.php` (with
a long random secret already in it) and shows a checklist. Steps marked **!** still need doing; the page says how.

## 4. Put in the API key

1. In the Anthropic Console, open **API keys**, create a key (name it, for example, "newsomebh relay") and copy it.
   It starts with `sk-ant-` and is shown only once.
2. In File Manager, open the `nbh-relay` folder, right-click `config.php`, choose **Edit**.
3. Find the line `'ANTHROPIC_API_KEY' => '',` and paste the key between the two quote marks, so it reads
   `'ANTHROPIC_API_KEY' => 'sk-ant-...',`. Press **Save Changes**.

Keep `config.php` private: do not email it or copy it anywhere public. It cannot be downloaded from the website.

## 5. Choose the admin password

1. Reload https://newsomebh.com/ai/admin. Under **Choose the admin password**, type a password twice (at least 10
   characters; a few words work well) and press **Make the line for config.php**. The password itself is not
   kept anywhere: you will need to remember it.
2. Press **Copy the line**. In `config.php` (File Manager, **Edit**), replace the whole line that starts with
   `'ADMIN_PASSWORD_HASH'` with the copied line, and save.
3. Reload the page. It now shows **Sign in**, and the password helper switches itself off.

Do steps 3 to 5 in one sitting: until the admin password line is in `config.php`, anyone who finds the page can
use the helper too. It changes nothing on the server, and it is limited, but each use costs the server some work.

*If you prefer cPanel's Terminal* (under **Advanced**, when your plan has it):
`php ~/nbh-relay/make-admin-hash.php --write` asks for the password twice and puts the line in for you. If it
says the PHP version is too old, run it with a newer one, for example
`/opt/cpanel/ea-php83/root/usr/bin/php ~/nbh-relay/make-admin-hash.php --write`.
Afterwards you may delete `nbh-relay/make-admin-hash.php`; it cannot be run from the website in any case.

## 6. Set a spending limit in the Anthropic Console

In the Console's limits or billing settings, set a **monthly spend limit** for your organization (for example a
few dollars more than you expect to use). Then a mistake, or a passcode in the wrong hands, can never cost more
than that. The relay has its own limits as well (below): a rewrite usually costs 1 to 6 cents, but the most one
can cost is about 21 cents, so the worst possible day under the relay's limits (300 rewrites, all of the
costliest kind) is about $64, and one passcode in the wrong hands can spend at most its session's 300 rewrites,
also about $64, before its session ends. The spend limit is what keeps a month safe.

## 7. Make a passcode and try it

1. At https://newsomebh.com/ai/admin, sign in.
2. Under **New passcode**, optionally type who it is for (only you see this), choose how long it may wait to be
   used, and press **Create passcode**. Write it down or press **Copy**. It looks like `7KQ-M4P-2XD-V9H` and is
   shown only once.
3. Give it to the staff member yourself (in person, by phone or by text message), not inside a saved file.
4. In a form (for example OB-1), they open **Improve wording**, then **Rewrite with Claude**, enter the passcode,
   choose a style, check the text that will be sent, and press **Send**.

## 8. Switch it on in the forms

The relay's address, **https://newsomebh.com/ai**, goes into `tools/blocks/nbh-wording-config.json` as
`{"relay":"https://newsomebh.com/ai"}`. Whoever builds the forms sets it and rebuilds them; then the rebuilt forms
are uploaded to `workstation-rps` as usual. Until then the panel says "Not set up for this copy of the forms."
Rewrite with Claude works in the forms opened from newsomebh.com (not in copies opened from a file).

## 9. Keep browsers on https (once the whole site is)

When every page of newsomebh.com opens with `https://` (check a few, the home page included), set
`'HSTS' => true,` in `config.php`. Browsers that have opened the relay then use https for all of newsomebh.com for
a year, even when someone types the address without it, so a hostile Wi-Fi network cannot show them a fake admin
page. Leave it `false` while any part of the site still works only with `http://`: those pages would stop opening
in those browsers.

---

## How passcodes and sessions work

* **A passcode works once.** It must be used within the time you chose when you made it (24 hours unless you
  pick another; at most 7 days). Unused passcodes are listed on the admin page, where **Revoke** cancels one.
* **Using it opens a session in that browser tab** for up to 8 hours, with up to 300 rewrites of up to 4,000
  characters each. The session ends when the tab is closed or when the 8 hours are up, whichever comes first,
  and it is never saved in a form or a file. A form that the tab opens in a new tab, or a tab the browser
  restores, can carry the session along, so on a shared iPad press **Lock** in the panel when you finish.
* **Open sessions** are listed with the passcode's label, when they end and how many rewrites they used.
  **End** stops one at once; **End all sessions** stops all of them (for example if an iPad is lost).
* **Wrong passcodes** are limited: after 10 wrong tries from one internet address within 15 minutes, that address
  has to wait; after 2,000 wrong tries from anywhere, everyone waits (a passcode cannot be guessed, so this only
  stops floods). The admin page shows the count, and **Clear the wrong tries** lifts the pause.
* **The admin page** signs you out after 30 minutes without use. After 5 wrong passwords from one internet address
  that address waits 15 minutes; after 20 from everywhere together, signing in waits for everyone except on the
  devices that have signed in here before, so wrong passwords from strangers cannot lock you out of your own
  iPad or computer. **Creating a passcode** asks for the password again when it was last typed more than 10
  minutes ago, so that nothing else running on newsomebh.com can make a passcode in your name.
* The relay stops at **300 rewrites in any 24 hours** for everyone together, and at 10 a minute per session.

All of these numbers are settings in `config.php`, explained there.

## What a rewrite costs

The relay calls Claude through Anthropic's API, which you pay for by the "token" (roughly four characters of
English). When this was written (October 2026) the model the relay uses was listed at **$4 per million input
tokens and $20 per million output tokens**; check https://www.anthropic.com/pricing for today's prices. One
rewrite sends the relay's instructions plus the text (about 1,000 to 2,000 input tokens) and gets back the
rewrite with notes, plus the model's thinking (about 500 to 2,500 output tokens). That is roughly **1 to 6 US cents
per rewrite**: a paragraph is near the low end, a full 4,000-character text near the high end. A hundred rewrites a
month is a few dollars. The Console shows the actual use.

**The worst case.** The relay lets one answer use up to 8,000 output tokens (thinking included), and a text that is
full of unusual characters can count as many more input tokens than plain English. At most, then, one rewrite costs
about 21 cents, a session's 300 rewrites about $64, and a day at the relay's limit of 300 rewrites about $64. Text
written to make the answer as long as possible could get near that; ordinary notes do not.

`EFFORT` in `config.php` is `low`: the model thinks briefly, which suits a short rewrite and keeps answers inside
the 60 seconds the forms wait. `medium`, `high`, `xhigh` and `max` make it think longer: each step up is slower
and costs more, and at the higher levels a long text may take longer than the forms wait. The room for thinking
grows with it (16,000, 32,000, 48,000 and 64,000 output tokens), so at `max` one rewrite can cost up to about
$1.30 and the worst cases above grow sixfold.

## Privacy

* **What is sent.** Only the text shown in the panel's preview, after de-identification, and the chosen style. The
  panel replaces the learner's name (whole, first, last, and each half of a double surname) and ID from the form,
  the family's surname where a title or "family" shows it is a parent (`Mr. [Family name]`), and any names typed
  under **Also hide** with placeholders such as `[Student]`, `[ID]`, `[Name 1]` before anything leaves the device.
  The preview points out what may still be a name (a word with a capital, the learner's initials, a nickname
  marked **Student**) and the people the form itself names, each one tap from being hidden. When the answer
  comes, the names are put back on the device, each as it was written; if the answer moved them around, the panel
  says which to check. The relay adds its fixed instructions and nothing else: no names, no passcode labels, no
  internet address.
* **What the relay keeps.** No text at all: neither the text sent nor the rewrite is stored or logged. Its
  database (`nbh-relay/data/relay.sqlite`) holds passcodes and sessions (as hashes), their labels and counts, and
  counters for the limits. Its log (`nbh-relay/data/relay-errors.log`) records events such as "a passcode was
  created" or an error code from the API, never text, passcodes, tokens or keys.
* **De-identified is not anonymous.** Other details in a note (an unusual event, a place, a date) can still point
  to a child. Staff should leave identifying details out of what they send, and read the preview before **Send**.
* **Approval first.** Before staff use Rewrite with Claude for real cases, get your district's or agency's
  approval for sending de-identified clinical text to an outside AI service, and follow the rules that apply to
  your work (your agency's policies, your professional code of ethics, and laws such as FERPA or HIPAA). If those
  rules call for an agreement with every service that handles such text, arrange it with Anthropic first.
* **How Anthropic handles API data.** This is set by Anthropic's own terms, not by the relay. Read them there:
  the Privacy Policy (https://www.anthropic.com/legal/privacy), the Commercial Terms
  (https://www.anthropic.com/legal/commercial-terms), and the Privacy Center (https://privacy.anthropic.com),
  which covers how API inputs and outputs are kept and used.

## Backups and updates

* **Backups.** The only file that changes is `nbh-relay/data/relay.sqlite`. It holds no text; losing it only
  loses the open passcodes and sessions (make new ones). cPanel's **Backup** includes it, or download it from File
  Manager. Keep your own private note of the admin password; for the API key, you can always make a new one.
* **Updates.** Upload a newer `nbh-relay-upload.zip` and extract it in the home folder as in step 2. It replaces
  the program files and never touches `config.php` or the `data` folder. Then reload the admin page.
* **Changing a setting.** Edit `config.php`; the change applies from the next request. Changing `PEPPER` ends
  every passcode, session and admin sign-in, and makes every device sign in again with the password.

## When something does not work

* **Open https://newsomebh.com/ai/admin.** If anything is not set up, the page lists it and says what to do.
* **"The rewrite service is not working right now"** in the forms: in the Anthropic Console check that the key is
  active, that billing is set up and that the spend limit is not used up. Then open
  `nbh-relay/data/relay-errors.log` in File Manager: a line such as
  `upstream_error status=401 ... hint=the_API_key_was_refused...` says what the API answered.
* **A blank page, or "500 Internal Server Error", just after the upload:** check the PHP version (step 1) and that
  `public_html/ai/.htaccess` is there (step 2).
* **"Forbidden" or "Not Found" for every address under /ai/ although index.php is there:** first upload and
  extract the newest zip again (an older `.htaccess` caused "Forbidden" on cPanel's Apache). If it stays, the
  server is not using `.htaccess` rewriting; the relay also answers at **https://newsomebh.com/ai/index.php/...**:
  open the admin page at **https://newsomebh.com/ai/index.php/admin**, and the forms can use
  `https://newsomebh.com/ai/index.php` as the relay's address instead.
* **Some texts fail while others work**, with a "Forbidden" from the server: GoDaddy's web firewall (ModSecurity)
  may be blocking certain words. Ask GoDaddy support to allow requests to `/ai/` on newsomebh.com.
* **The forms say their copy cannot reach the service:** the forms must be opened from newsomebh.com (or
  www.newsomebh.com), over https, not from a file on the device.
* **"Too many passcode tries" for people who typed nothing wrong:** everyone on one school's or office's network
  usually shares one internet address, so one person's 10 wrong tries make everyone there wait 15 minutes; the
  same happens for every visitor if the site sits behind a firewall or content-delivery service (such as GoDaddy's
  Website Security). **Clear the wrong tries** on the admin page lifts the pause.
* **"Too many wrong passwords" when you sign in:** wait 15 minutes. A device that has signed in here before is
  not held up by wrong passwords from elsewhere, only by its own. To let a new device in at once, open
  `config.php`, raise `LOGIN_FAILS_ALL` for a moment (for example to `1000`), sign in, and set it back. If someone
  else may know the password, choose a new one (step 5).
* **To end everything at once without signing in** (a lost device with the admin page open, or a password that
  may be known): change `PEPPER` in `config.php` to another long random text (letters and digits, at least 32).
  Every passcode, every session, every admin sign-in and every remembered device ends at once; then choose a new
  admin password if needed (step 5).

---

## For the developer

**Files** (`tools/relay/`; one owner: the relay):

| path | what |
|---|---|
| `public_html/ai/index.php` | the only program file in the web folder; requires `dirname(__DIR__, 2).'/nbh-relay/bootstrap.php'` (the path is the setting at its top). Kept to old syntax so an old PHP prints a message. |
| `public_html/ai/.htaccess` | everything to `index.php` (existing files included), http to https, no listings; without mod_rewrite, every file but `index.php` refused (only then: Apache checks that refusal before rewriting, for names that are not files too, so with mod_rewrite on it would refuse every address) |
| `nbh-relay/bootstrap.php` | autoloader for `src/`, the SDK's `vendor/autoload.php`, then `App::main()` |
| `nbh-relay/src/` | `App` (routes and the checks before every handler), `Api` (redeem, rewrite), `Admin` (admin API and page), `Pages` (HTML, CSS, JS), `Claude` (the API call: model, system prompt, styles, schema, answer checks), `DeadlineTransport` (the SDK's HTTP transport with one deadline), `Config`, `Setup`, `Db` (schema and migrations), `RateLimiter`, `Crypto`, `Log`, `Request`, `Response` |
| `nbh-relay/config.sample.php` | every setting with its default; copied to `config.php` (with a new `PEPPER`) on the first request |
| `nbh-relay/make-admin-hash.php` | the command-line password helper (`--write` edits `config.php`) |
| `nbh-relay/composer.json`, `composer.lock` | `anthropic-ai/sdk` 0.54.0 and `guzzlehttp/guzzle` 7.15.5, pinned, resolved for PHP 8.1 |
| `install-vendor.sh` | `composer install` from the lock into `nbh-relay/vendor/`, each package cut back to its release contents (`git archive`, so no `.git` or tests); `--update` re-resolves |
| `build-zip.sh` | makes `dist/nbh-relay-upload.zip` (vendor included; refuses to package `config.php`, data, logs or anything key-like) |
| `tests/run.sh` | every test, offline (below) |

`dist/` is not in git (`.gitignore`); `build-zip.sh` makes it again. `nbh-relay/vendor/` is committed, so the
zip can be rebuilt without network; `install-vendor.sh --force` makes it again from `composer.lock` (it sets the
relay's own version, 1.0.0, so a reinstall changes nothing that is not a package).

**Endpoints** (the contract `tools/blocks/nbh-wording.js` uses; JSON in and out; every POST needs an `Origin` or
`Referer` in `ALLOWED_ORIGINS` and `Content-Type: application/json`; no CORS headers, ever):

| | request | answers |
|---|---|---|
| `POST /ai/api/redeem` | `{code}` | 200 `{token, expires (ISO 8601), expires_in}`; 401 `invalid_code`; 429 `rate_limited` `{retry_after}` + `Retry-After` |
| `POST /ai/api/rewrite` | `{token, text, style}` (style `objective`, `concise`, `report`, `grammar`) | 200 `{rewrites:[{style,text}], changes:[], cautions:[]}`; 401 `invalid_token` / `session_expired`; 400 `bad_request`; 413 `too_long`; 429 `session_limit_reached` / `rate_limited`; 422 `refused` / `incomplete`; 502 `upstream`; 503 `upstream_busy`; 504 `upstream_timeout` |
| `GET /ai/admin` | | setup page, sign-in page, or the admin page |
| `/ai/api/admin/...` | `password-hash`, `login`, `logout`, `state`, `codes` (`{label, hours, password?}`: the password again 10 minutes after it was last typed), `codes/revoke`, `sessions/revoke`, `sessions/revoke-all`, `unlock` (both kinds of wrong tries) | cookie `__Secure-nbh_admin` (HttpOnly, Secure, SameSite=Strict, Path=/ai/, 30 minutes sliding, 12 hours at most) and header `X-CSRF-Token`; signing in also sets `__Secure-nbh_device` (180 days, signed with the pepper), which spares that browser the global sign-in pause |
| `GET /ai/api/health` | | 200 `{ok:true}` when set up, else 503 |

Errors are `{error, message}`; any other path is 404, a known path with another method 405. Also 403 `origin`,
403 `https_required`, 415, 503 `setup_required`.

**The API call** (`src/Claude.php`, through the official PHP SDK's beta messages API): the model id in
`Claude::MODEL`; `outputConfig` with `effort` from `EFFORT` (default `low`) and a JSON-schema `format` (text,
changes, cautions); `max_tokens` sized for the effort (8000 at low; thinking counts toward it); no `thinking`
field (adaptive thinking is the model's default); `fallbacks: "default"` with the beta header
`server-side-fallback-2026-07-01`, so a policy decline is retried server-side on the model Anthropic recommends;
`stop_reason` is checked before the content (`refusal` gives 422 `refused`, `max_tokens` 422 `incomplete`). The
SDK makes one retry (`maxRetries: 1`) on 408/409/429/5xx and connection errors. The SDK's own timeout option is
advisory, so `DeadlineTransport` (the SDK's `transporter`) enforces `TIMEOUT_SECONDS` (50) across both attempts
and skips a retry that could not finish in time, keeping every answer inside the panel's 60-second wait. The
user turn is the style's name and the text between `<text_to_rewrite>` tags (a tag inside the text is defused);
the system prompt (fixed, in `Claude::systemPrompt()`) defines the four styles and the rules.

**Tests**: `tools/relay/tests/run.sh` (add `--php81` to fetch PHP 8.1 as php-wasm from npm, about 500 MB, cached
in `~/.cache/nbh-relay-php81`, or point `PHP81` at a PHP 8.1 command; `KEEP=1` keeps screenshots and logs). It
lints every file, builds the zip, extracts it as a home folder, serves it with `php -S` next to
`tests/mock-anthropic.php` (a local stand-in for the Messages API), and runs:

* `relay-test.php`: the package layout (two folders, nothing private in the web folder or the zip), `.htaccess`
  read as text (no Apache here) and every non-route answered 404 by `index.php`, first run and setup, broken
  settings, redeem (single use, at once from six requests, expiry, input, origin checks, brute-force pauses),
  rewrite (the exact request the mock gets: model, effort, schema, system prompt, fallbacks, no names added;
  every style; refusal, fallback, `max_tokens`, bad output, 429/5xx with the one retry, timeouts, a refused key,
  token checks, size and rate limits), admin (sign-in, cookie flags, CSRF, create, list, revoke, labels that try
  HTML), https, the password helpers, and that no text reaches the log or the database;
* `contract-test.js`: the panel's own functions from `nbh-wording.js` read every recorded answer as intended;
* `admin-browser-test.js`: the admin page in Chromium at 390, 820 and 1180 px;
* `php81-test.php`: under PHP 8.1, every file parses, every class loads, and sign-in, redeem and rewrite run
  through the SDK.
