# Putting the workstation on a website

The workstation is a folder of files that run entirely in the browser. A web
host only hands the files to the browser; nothing typed into a form is ever sent
back to it. Hosted, the tool works exactly as it does from a folder, with two
things better: Safari's local-file restriction no longer applies, and staff get
a link instead of a download.

## What is needed

An ordinary web host that serves files — on GoDaddy, that is a **Web Hosting**
plan (cPanel). GoDaddy's *Websites + Marketing* site builder cannot host this: it
builds pages from its own templates and has nowhere to put a folder of files. If
that is what the domain uses, either add a Web Hosting plan, or host the folder
elsewhere (Cloudflare Pages and Netlify serve folders like this for free) and
point a subdomain at it from GoDaddy's DNS.

## On GoDaddy Web Hosting (cPanel)

1. In cPanel, open **File Manager** and go to `public_html`.
2. Create a folder, for example `workstation`, and open it.
3. **Upload** the zip, then select it and choose **Extract**. Delete the zip.
   The files land directly in `workstation` (`public_html/workstation/index.html`);
   upload the whole folder, `nbh-pictos.js` included (Forms SM-1, VS-1 and TK-1 load their pictures
   from it; since v21.43 it also holds the practice's own cards, so an older copy left on the site
   leaves those cards without a picture), `nbh-pictures.js` (v21.62: My pictures, the camera library of Forms VS-1, SM-1, TK-1
   and TV-1; without it their pickers have no My pictures), `nbh-tk1-narration.js` (v21.44: the recorded narration of Form TK-1's
   walkthrough, kept beside the form so the form stays well under 2 MB; 2.1 MB since v21.49, with the bus ride's lines; without it the walkthrough reads its captions
   with the device's own voice), `nbh-tk1-video.js` (v21.44: TK-1's *Save as video*, also used by Form SM-1's walkthrough), `nbh-sm1-narration.js` (v21.45: the recorded narration of Form SM-1's walkthrough, 1.2 MB, the same way), `nbh-dd1-narration.js` (v21.47: the recorded narration of Form DD-1's walkthrough, 0.9 MB, the same way) and `nbh-respond.js` with `respond.html` (the questionnaires
   Form IA-1 sends to informants; a link to `respond.html` on the site carries the questionnaire, so
   the page must be served from the same folder); the zip has no folder inside it, so there is nothing
   to move.
4. **First time only:** turn on *Settings → Show Hidden Files*, then *+ File*,
   name it `.htaccess`, select it, *Edit*, and paste:

       <IfModule mod_headers.c>
         <FilesMatch "\.(html|js)$">
           Header set Cache-Control "no-cache, must-revalidate"
         </FilesMatch>
         Header set X-Robots-Tag "noindex, nofollow"
       </IfModule>

   It tells browsers to check for a newer copy of each form on every visit,
   and keeps the folder out of search engines. The zip deliberately does not
   contain this file (see *Updating*).
5. Open `https://yourdomain/workstation/` (plain `http://` until the certificate
   below is in). Press **Diagnostics**: *Page origin* should show your domain,
   and *PDF tools* should say present.

GoDaddy's servers insert a snippet of their own into every HTML page they
serve. Versions before 21.5 broke under it (the workstation showed its own
code as text); 21.5 and later are unaffected.

## Two settings worth turning on

**A password on the folder.** In cPanel, *Directory Privacy* → `public_html` →
`workstation` → tick *Password protect this directory*, save, then create a user
below. Until a user exists nobody, including you, can open the folder. The tool
holds no student data, but it is a working tool for your staff, and the forms
carry your practice's clinical content. Share the one login with the people
who use it.

**HTTPS.** A new cPanel account starts every domain on a *self-signed*
placeholder certificate, which browsers do not trust; until a real one is
installed the site only works over plain `http://`, and the folder password
crosses the network unencrypted.

- *Web Hosting Economy* includes one free certificate for the first year -
  **but only on annual billing.** On a monthly Economy plan there is no free
  certificate, the domain stays on the self-signed placeholder, and none of
  the steps in cPanel will change that. Switching the plan to annual is the fix:
  GoDaddy then issues and installs the certificate by itself, within minutes.
  Switching created a fresh hosting account, so the folder had to be uploaded
  and the password set again.
- *Deluxe* and higher include **AutoSSL**: free certificates that renew
  themselves. On those plans, cPanel → *SSL/TLS Status* → tick the domains →
  **Run AutoSSL**. On Economy that button is absent — which is why waiting does
  not fix a self-signed certificate there.
- It is done when *SSL/TLS Status* no longer says *Self-signed* against the
  domain and `www`. Then cPanel → *Domains* → switch on **Force HTTPS
  Redirect** (it stays greyed out until a valid certificate is installed). That
  redirect is applied by the server before the password is asked for, so the
  login never travels over `http://`. Do not add a redirect rule to
  `.htaccess` instead: rules there run after the password prompt.
- Check: `http://yourdomain/workstation/` should jump to `https://` with a
  padlock before it asks for the password, and Diagnostics should show
  *Secure context* `true`.
- If the password was ever used over plain `http://`, change it now
  (*Directory Privacy* → `workstation` → the user).
- **Before the first year ends,** decide between renewing the certificate and
  upgrading to Deluxe, whose AutoSSL removes the yearly step. Compare GoDaddy's
  prices at the time.

**Compression (v21.43).** Text files shrink by about two thirds when the server
compresses them, so forms open faster on school Wi-Fi and the installed app's first
offline copy finishes sooner. It changes nothing in the forms or in what they save.

- cPanel → *Software* → **Optimize Website** → choose **Compress All Content** →
  **Update Settings**. (On some cPanel versions the choice is *Compress the specified
  MIME types*; then enter `text/html text/css text/plain application/javascript
  text/javascript application/json image/svg+xml`.)
- Check: open a form, then Diagnostics in the shell; or, from a computer, the browser's
  developer tools → Network → the form's file → *Content-Encoding* shows `gzip` (or `br`).
- Images, videos and zips are already compressed and are left as they are.
- To undo it: the same page → **Disabled** → **Update Settings**.
- The cost is a little extra work for the server on each request, which is negligible
  at the workstation's traffic. Every current browser on an iPad, Mac or PC handles it.

## What stays exactly the same

- **Nothing leaves the machine.** Save case downloads a file to the computer in
  use; Autosave keeps its safety copy in that browser only. The forms have no
  account, no upload and no database, and they should not: the moment a server
  holds student data you become its custodian, with everything that brings.
  The one exception is **Rewrite with Claude** in the writing help (v21.43),
  and only once its relay is set up (below) and a passcode unlocks it: it sends
  the text shown in its preview, with the student's name and ID already
  replaced, to the relay on this site and from there to Anthropic's API. The
  relay keeps no text. **Check wording** runs on the device and sends nothing.
- **Save cases to the district drive**, as before. A case file in a browser's
  Downloads folder on a shared computer is a case file left on a desk.
- **Chrome or Edge 131 or later, on a computer,** for the master print and
  Finish PDF; Diagnostics says so. Forms can be filled on an iPad, but every
  iPad and iPhone browser, Chrome included, is Apple's engine underneath and
  prints the packet without its page headers. Build the packet on a computer.

## Updating

Upload the new zip into `workstation`, **Extract** it there, and delete the
zip. The new files replace the old ones of the same name, and that is the
whole update. (`nbh-pictos.js` is in the zip too; v21.43's copy is larger,
about 1.7 MB, because it holds the practice's own cards.) The zip holds only
the workstation's own files, so it never touches `.htaccess` - which is where
cPanel keeps the folder's password setting. (A zip that carried its own
`.htaccess` would replace that file and silently switch the password off;
that is why this one does not.)

The writing-help relay has a zip of its own, which goes in the home folder,
not here (see the last section); the workstation's zip never touches it.

Because of the cache rule, everyone gets the new version on their next visit.
If a form still looks old, a hard reload (⌘⇧R, Ctrl⇧R) settles it.

## The public page at newsomebh.com

The practice's landing page is a single file, `index.html`, kept in
`public_html` itself (the workstations sit in folders beneath it). It is plain
HTML and CSS with the logo and tab icon embedded, no scripts, and loads only
two Google Fonts (Source Serif 4, Source Sans 3), falling back to Georgia and
the system sans if they cannot load. It is built from `site/index.template.html`
by inserting the logo and icon as data URIs; `qa/site-check.js` renders it at
phone, tablet and desktop widths and runs axe-core's WCAG 2.1 A/AA rules.

To publish or update it: File Manager → `public_html` → **Upload**
`index.html` → overwrite. GoDaddy's "Future home of something quite cool"
placeholder may be its own file in `public_html` (`default.htm`, `index.php`
or similar); if the placeholder still shows after the upload and a hard reload,
delete that file. Force HTTPS and the certificate already cover the page. The
footer's *Staff sign-in* link goes to `/workstation/`, which keeps its own
password.


## Respondent links when `/workstation/` has a password

A respondent link points at `respond.html` beside the forms. If the
workstation folder is behind cPanel's Directory Privacy (the staff
password), everyone who opens such a link is asked for that password,
which informants do not have; on the assessor's own computer the
browser has the password cached, so the link appears to work there.
Fix: make a public folder, for example `public_html/respond/`, upload
only `respond.html` and `nbh-respond.js` into it (no student data is
ever in those two files; the questionnaire travels in the link
itself), and in Form IA-1's Respondent pages dialog enter its address
in **Address of respond.html for links**, for example
`https://newsomebh.com/respond/respond.html`. The address is
remembered on the device and saved with the file. Links then open
without a sign-in; the workstation folder keeps its password. Update
the two files in the public folder whenever a new edition is
uploaded (v21.44: the short links need the new `nbh-respond.js`; an
old copy in the public folder says the link does not open). Page files (Save the page as a file) need no hosting.

The easier way (v21.44): leave the two files where they are and let
them through the password. In cPanel's File Manager, turn on
**Show Hidden Files** (Settings), open the workstation folder's
`.htaccess` (Directory Privacy wrote it), and add at the end:

```
# The questionnaire pages informants open: no password (they hold no student data; the questionnaire travels in the link)
<FilesMatch "^(respond\.html|nbh-respond\.js)$">
  <IfModule mod_authz_core.c>
    Require all granted
  </IfModule>
  <IfModule !mod_authz_core.c>
    Order allow,deny
    Allow from all
    Satisfy Any
  </IfModule>
</FilesMatch>
```

Everything else in the folder keeps its password; the links work as
the forms make them, and the two files are updated with every upload.
Leave **Address of respond.html for links** empty. If Directory
Privacy is turned off and on again, it rewrites `.htaccess`: add the
lines again.

## Emailing a questionnaire (v21.44)

Forms IA-1, IN-1, SV-1 and CF-1 have **Email it…** beside **Copy
link** in the Respondent pages dialog. It opens a ready email: the
informant's address (remembered on the device), a subject naming the
questionnaire and the student's initials, and a short message with
the link. **Open in Mail** hands it to the device's own mail app
(Mail on the iPad, or whichever app is set as the default), where it
is checked and sent from the user's own account; nothing goes through
the website. **Share…** (on the iPad) offers Messages and the other
apps; **Copy the message** puts it on the clipboard for webmail. The
links need the workstation on its website; opened from a folder, save
the page as a file and attach it instead.

The links are short (v21.44): about 200 to 450 characters for SV-1,
CF-1 and IN-1, and about 1,000 to 2,000 for IA-1, whose questions are
the wording pasted on its Setup sheet. `nbh-respond.js` carries the
forms' own question wording, so a link holds only the questionnaire's
case details (the behavior, its definition, the initials, the due date,
the address answers go to) and any wording that was changed, packed
small. Nothing is stored on the website. Links sent before v21.44 still
open.

## The writing-help relay (`public_html/ai`, v21.43)

Every form has an **Improve wording** button on its text boxes. Two of its
three kinds of help need nothing on the website: **Check wording** runs on
the device, and Apple's **Writing Tools** are the iPad's own. The third,
**Rewrite with Claude**, goes through a small PHP program on this same site,
the relay, which holds the Anthropic API key (so the key is never in the
forms) and lets in only the browser tabs that a passcode from the BCBA has
unlocked. Both editions use the one relay, at `https://newsomebh.com/ai`;
the forms already carry that address.

- **What to upload.** `nbh-relay-upload.zip`, which comes with the release
  beside the workstation's zip. It goes in the **home folder**, the one that
  holds `public_html`, not in the workstation's folder. Extracted there, it
  adds `public_html/ai/` (the web address `https://newsomebh.com/ai/`) and
  `nbh-relay/` beside `public_html`, where nothing can be downloaded from
  the web. Nothing else in `public_html` is touched.
- **The steps.** They are in the zip's `nbh-relay/README.md` (in the workshop,
  `tools/relay/README.md`): PHP 8.1 or newer for the domain, the API key, the
  admin password at `https://newsomebh.com/ai/admin`, a monthly spend limit in
  the Anthropic Console, and a first passcode to try. About 20 minutes, once.
- **No folder password on `ai`.** Do not put a Directory Privacy password on
  `public_html/ai`: the forms call it without one, and the passcode does that
  job. The workstation's own folder keeps its password as before.
- **https.** Rewrite with Claude works only in the forms opened from
  newsomebh.com (or www.newsomebh.com) over https, which the Force HTTPS
  Redirect above already ensures. A copy opened from a file says so in the
  panel; Check wording still works there.
- **Before real cases,** get the district's or agency's approval for sending
  de-identified clinical text to an outside service; the README's Privacy
  section says what is sent and what is kept (no text).
- **Updating.** A newer `nbh-relay-upload.zip` is extracted the same way, in
  the home folder. It replaces the program and never touches the relay's
  settings (`nbh-relay/config.php`) or its data (`nbh-relay/data/`). The
  workstation's zip never touches the relay, and the relay's zip never
  touches the workstation.

## The reply box (`public_html/reply`, v21.65)

Form IA-1's respondent pages (the FAST, QABF, MAS, PBQ and WEFA an
informant answers on a phone) used to send their answers back in an
email, as a code pasted into **Collect responses**. With the reply box
the page locks the answers on the informant's device so that only the
form's own file can open them, and sends them to a small PHP program on
this site; Form IA-1 collects them itself (the Send-outs sheet does it
while it is open, **Collect from the reply box now** at once) and places
them on the worksheets. The informant presses Send and is done. The site
keeps only what it cannot read.

- **What to upload.** `nbh-reply-box-upload.zip`, which comes with the
  release beside the workstation's zip. It goes in the **home folder**, the
  one that holds `public_html`. Extracted there, it adds
  `public_html/reply/` (the web address `https://newsomebh.com/reply/`)
  with `box.php` and `.htaccess`. Nothing else in `public_html` is touched.
- **The steps.** They are in the zip's `README.md` (in the workshop,
  `tools/reply-box/README.md`): PHP 8.1 or newer for the domain (already
  the case if the writing-help relay is set up), upload, extract, and open
  `https://newsomebh.com/reply/box.php?a=ping` once to see
  `{"ok":true,...}`. About ten minutes, once. No key, no password, no
  database.
- **The forms find it by themselves.** A workstation opened from
  newsomebh.com (either edition) uses `https://newsomebh.com/reply/box.php`
  unless the **Reply box** field in IA-1's Respondent pages dialog names
  another address (remembered on the device, like the wording). Each IA-1
  file makes its own keys and registers its own box the first time a page
  or link is made; the file carries the keys, so a copy opened from a
  folder still collects. A form opened from a folder with no address known
  makes pages that send email, as before.
- **No folder password on `reply`.** Do not put a Directory Privacy
  password on `public_html/reply`: the respondent pages post to it from any
  device and any origin (CORS `*`; a page opened from an email attachment
  has no origin of its own). The workstation's own folder keeps its
  password as before.
- **What the site keeps.** A box id and a hash of the form's read token
  (both random, made by the form), each reply's ciphertext with the
  informant's one-time public key and the time, and a count of replies per
  address for an hour (a hash of the address) against abuse. No name, no
  score, no student, no email. A reply stays until the form removes it
  (**Remove the collected replies from the site**) or 60 days pass; a box
  nothing has reached for 60 days is removed. Limits: 64 KB per reply, 300
  replies per box, 120 replies an hour from one address. Keys: ECDH P-256
  and HKDF-SHA-256 for the shared secret, AES-GCM-256 for the answers,
  all done by the browsers (WebCrypto); the private key lives only in the
  IA-1 file.
- **If the box cannot be reached** (no internet, the program not uploaded,
  the address wrong), the respondent page says so and offers **Open the
  email** with the code, the way it always worked; the form's line under
  the address says what went wrong.
- **Updating.** A newer `nbh-reply-box-upload.zip` is extracted the same
  way; it replaces `box.php` and leaves the data folder (`reply/data/`,
  closed to the web by its own `.htaccess`) as it is. The workstation's
  zip never touches the box, and the box's zip never touches the
  workstation. To keep the data outside `public_html`, the README shows
  the one line (`SetEnv NBH_REPLY_DATA ...`).
