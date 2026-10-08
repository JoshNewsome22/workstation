# The reply box: answers that come straight back to Form IA-1 (v21.65)

A respondent page (the FAST, QABF, MAS, PBQ or WEFA a teacher, aide or parent answers on a phone or computer)
used to send its answers back in an email, as a code the BCBA pasted into the form. With the reply box the page
encrypts the answers on the respondent's device and sends them to a small program on your own website; Form
IA-1 collects them itself, decrypts them with the key that lives only in its file, and places them on the
worksheets. The respondent presses Send and is done. The website keeps only what it cannot read.

It takes about ten minutes, once. You need your GoDaddy cPanel login for newsomebh.com and the file
**nbh-reply-box-upload.zip**, which comes with the release beside the workstation's zips (a developer makes it
again with `tools/reply-box/build-zip.sh`).

## 1. PHP 8.1 or newer

The writing-help relay already needed this; if it is set up, nothing to do. Otherwise, in cPanel open
**MultiPHP Manager** (under Software), tick **newsomebh.com**, choose PHP 8.1 or newer and press **Apply**.

## 2. Upload and extract

1. In cPanel open **File Manager**, go to the **home folder** (the one that holds `public_html`).
2. Press **Upload**, choose `nbh-reply-box-upload.zip`, wait for 100%, go back to File Manager.
3. Select the zip, press **Extract**, confirm. It adds `public_html/reply/` with `box.php` and `.htaccess`.
   Nothing else in `public_html` is touched. Delete the zip.
4. Open `https://newsomebh.com/reply/box.php?a=ping` in a browser: it answers `{"ok":true,"v":1,"days":60}`.

The program makes a `data` folder beside itself the first time a form registers a box, and writes an
`.htaccess` that keeps the web away from it. If you prefer the data outside `public_html`, make a folder there
(for example `nbh-reply-data`) and put `SetEnv NBH_REPLY_DATA /home/<account>/nbh-reply-data` in
`public_html/reply/.htaccess`.

## 3. No folder password on `reply`

Do not put a Directory Privacy password on `public_html/reply`: the respondent pages post to it from any device.
The workstation's own folder keeps its password as before.

## How it works, and what is kept

- Form IA-1 makes a key pair for each file and registers a box (a random id and a read token) with the program,
  once. Every respondent link it makes carries the box id and the public key.
- The respondent page makes a key of its own for the one reply, derives a shared secret with the form's public
  key (ECDH on the P-256 curve, HKDF), encrypts the answers (AES-GCM 256) and posts the ciphertext. If the box
  cannot be reached (no internet, the program not set up), the page falls back to the email with the code.
- The form lists its box with the read token (sent in the request, kept as a hash on the server), decrypts each
  reply with its private key, places the answers, and remembers which replies it has taken. A reply stays on the
  site until the form removes it (Remove the collected replies from the site) or 60 days pass.
- The program stores: the box id, the hash of the read token, each reply's ciphertext, the respondent's one-time
  public key and the time. It never sees a name, a score or the student. It keeps a count of replies per address
  for an hour (a hash of the address) against abuse. There is no log of requests beyond what the web server keeps.
- Limits: 64 KB per reply, 300 replies per box, 120 replies an hour from one address.
- Checked by `qa/reply-box-test.js` in the workshop (the API, then a form and two respondent pages against a
  copy of the program run with `php -S`).

## Updating

Extract a newer `nbh-reply-box-upload.zip` the same way; it replaces `box.php` and leaves the data folder as it is.
