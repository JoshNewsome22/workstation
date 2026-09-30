# Putting the workstation on a website

*Royal Palm School edition.* It lives in its own folder, `workstation-rps`, beside the
Newsome Behavioral Health one in `workstation`, with its own password; its autosave is
kept apart from the other edition's. Each folder needs its own `.htaccess` (step 4).

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
2. Create a folder, for example `workstation-rps`, and open it.
3. **Upload** the zip, then select it and choose **Extract**. Delete the zip.
   The files land directly in `workstation-rps` (`public_html/workstation-rps/index.html`);
   the zip has no folder inside it, so there is nothing to move.
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
5. Open `https://yourdomain/workstation-rps/` (plain `http://` until the certificate
   below is in). Press **Diagnostics**: *Page origin* should show your domain,
   and *PDF tools* should say present.

GoDaddy's servers insert a snippet of their own into every HTML page they
serve. Versions before 21.5 broke under it (the workstation showed its own
code as text); 21.5 and later are unaffected.

## Two settings worth turning on

**A password on the folder.** In cPanel, *Directory Privacy* → `public_html` →
`workstation-rps` → tick *Password protect this directory*, save, then create a user
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
- Check: `http://yourdomain/workstation-rps/` should jump to `https://` with a
  padlock before it asks for the password, and Diagnostics should show
  *Secure context* `true`.
- If the password was ever used over plain `http://`, change it now
  (*Directory Privacy* → `workstation-rps` → the user).
- **Before the first year ends,** decide between renewing the certificate and
  upgrading to Deluxe, whose AutoSSL removes the yearly step. Compare GoDaddy's
  prices at the time.

## What stays exactly the same

- **Nothing leaves the machine.** Save case downloads a file to the computer in
  use; Autosave keeps its safety copy in that browser only. There is no account,
  no upload and no database, and there should not be: the moment a server holds
  student data you become its custodian, with everything that brings.
- **Save cases to the district drive**, as before. A case file in a browser's
  Downloads folder on a shared computer is a case file left on a desk.
- **Chrome or Edge 131 or later, on a computer,** for the master print and
  Finish PDF; Diagnostics says so. Forms can be filled on an iPad, but every
  iPad and iPhone browser, Chrome included, is Apple's engine underneath and
  prints the packet without its page headers. Build the packet on a computer.

## Updating

Upload the new zip into `workstation-rps`, **Extract** it there, and delete the
zip. The new files replace the old ones of the same name, and that is the
whole update. The zip holds only the workstation's own files, so it never
touches `.htaccess` - which is where cPanel keeps the folder's password
setting. (A zip that carried its own `.htaccess` would replace that file and
silently switch the password off; that is why this one does not.)

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
footer's *Staff sign-in* link goes to `/workstation-rps/`, which keeps its own
password.

