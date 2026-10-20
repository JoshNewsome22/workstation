# Start here

The FBA and BIP workstation: the forms of a functional behavior assessment and a behavior intervention plan, in one
page that runs in the browser (Safari on an iPad or iPhone, any current browser on a laptop or a Chromebook). This
page is for a BCBA starting with it or covering for a colleague, and for the person who looks after the website. It
describes the workstation as it is now. SETUP.md holds the release notes, one section a release; README.txt is a
longer tour of the features.

## Opening it

- **From the website**: the address the workstation was put at (for example `https://yourdomain/workstation/`). The
  site may ask for its password first.
- **As an app**: in Safari on the iPad, Share, *Add to Home Screen*. It then opens from the home screen, also without
  the internet (Help, *Offline, installing and updates*).
- **Which release is running**: **Help** says it at the top, and **Diagnostics** (under **More**) says it with this
  device's storage and what its browser supports. Quote it when asking about a problem.

## The first hour

1. Open **Help** (in the bar): five steps at the top, then a section for each part of the workstation. **Case map**
   (in the bar) lists the forms stage by stage, from referral to exit, and ends with the shortest defensible path
   through a case: DM-1, IC-1, TB-1, IA-1 with OB-1 or ABC-1 (and DD-1 for baseline), FS-1, TD-1, GB-1, CF-1,
   ST-1, DD-1 with TI-1, PR-1.
2. Try a form on the simulated student first: pick it from the list on the left (on an iPad, from the **Forms**
   button) and press **Load simulation** on its toolbar. It fills a worked example and says so; the form's Guide
   explains what the example shows. Nothing in a simulation is a real record.
3. For a real student, type the student's details once in the bar (**Edit details**). They go into every form you
   open, into empty fields only. Define the target behaviors on TB-1: they reach the other forms, with the function
   from FS-1, the goals from GB-1 and the reinforcer menu from PA-1.
4. **Save case** (above the form) whenever it shows a dot. The case file is the record. Autosave keeps a safety copy
   in this browser only, and the caseload keeps a copy of each student on this device.
5. **Caseload** (in the bar): every student kept on this device, the most urgent first. A card's Open button opens
   that student's case with one form loaded: the one it names (Open DD-1), else the one open when the case was saved.
   The case's other forms load when you open them.
   **Today**: what needs you in the case on screen. **Log it now**: an incident, time-stamped, into Form DD-1.
6. The packet for a meeting: tick the forms on the list, **Build master print**, then **Finish PDF** for bookmarks
   and page numbers.

## Where a student's information goes

What is typed stays on this device unless you send it. Help, *Where the student's data goes*, lists each way
information can leave the device, every one something you set up or press (a case file you save and send, Google
Drive if you turn it on, a questionnaire you email, and the rest), with how long each copy is kept, and prints a data
map for the district. Ask the district before using any of them for real cases.

## Working with a colleague

- **Share for editing** (under **More**): a file of the case, or of the forms you choose, to send by school email or
  AirDrop. The colleague opens it with **Open case**, works on it, and sends it back the same way; the workstation then
  puts both people's work together and asks only where both of you changed the same thing.
- With Google Drive turned on for both of you, the case can be shared in Drive with the colleague's school account
  instead, with no file to send. Help, *Working on a case with a colleague*, has both ways.
- On an iPad or computer more than one person uses: Help, *On a shared iPad* (*On a shared computer* on a laptop).

## Google, if you use it

Four parts of the workstation can use your school Google account: Form DD-1 reading the team's Google Sheet, sending
questionnaires from your school Gmail, keeping the caseload in your school Google Drive, and opening a case a colleague
shared with you there. Help, *Google, set up once*, is the one checklist, with boxes to keep the keys on each device
and what to ask the school's IT when Google blocks the app.

## When something does not work

- **Diagnostics** (under **More**) first: the version, this device's storage and what its browser supports.
- A form that says it did not take its saved work: the case keeps that work as the file holds it, and **Save case**
  writes it. Close the form and open it again.
- Safari refusing a save, or storage nearly full: delete old safety copies under **Autosave** in the bar, and save the
  cases you need to files first.
- Each form also works on its own, opened from the same folder, if the workstation itself misbehaves.

## For the person who looks after the website

- **What to upload**: the whole folder in the release zip, extracted into the workstation's own folder on the site.
  The files go together: a form uploaded without the shared `nbh-*.js` files beside it loses its letterhead, its
  Autosave and its writing help. HOSTING.md, *On GoDaddy Web Hosting (cPanel)*, has the steps, and the first-time
  `.htaccess` file the zip leaves out.
- **Updating**: upload and extract the new zip the same way (HOSTING.md, *Updating*); `release.json` goes with it. The
  devices pick the new release up the next time they open the workstation online.
- **The reply box** (questionnaire answers and staff phone entries come back through it) and its upload zip have
  their own README; HOSTING.md, *The reply box*, says where it goes.
- **Google**: the sign-in key's web address must be the site's (Help, *Google, set up once*, step 5).
- **Checking it**: open the workstation from the site and press **Diagnostics**: *Page origin* should be your domain
  and *PDF tools* should say present.
