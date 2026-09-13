# Atamaqtrs — Music Portfolio & Commission Site

Pure HTML/CSS/JS static site (no build step) meant to be hosted on GitHub Pages.

## Structure

```
index.html          One page, five full-height scroll-snap sections:
                     hero → about → music → portfolio → commission
portfolio.html       Standalone full portfolio gallery (linked from the
                     homepage's "See more portfolio →"), same grid/detail
                     code and styling, just not part of the one-page scroll.
css/style.css        All styling (VHS/CRT hero effect, VCR OSD Mono + Cormorant Garamond type)
js/i18n.js            EN/JA text dictionary + language switcher
js/portfolio.js       Loads data/portfolio.json, renders grid + detail view
                     — shared by index.html AND portfolio.html
js/commission.js      Commission form → EmailJS
js/main.js            Scroll-spy for the side dot nav + hero play/pause OSD
data/portfolio.json   Your portfolio entries (edit this to add/remove work)
assets/video/         hero-vhs.mp4 — the VHS clip playing inside the CRT
assets/img/            crt-monitor.png, commission-form.png, profile.jpg
assets/portfolio/      Portfolio images (thumbnails + detail images)
assets/logo/           logo.png (wordmark) + plaster.png (bust), stacked
                     above each other in the hero
```

## How the site is currently set up

### Language: EN / JA only
Korean was removed on request — `js/i18n.js`'s `SUPPORTED_LANGS` is
`["en", "ja"]` and every dictionary entry only carries those two. To add a
language back, add a key to every entry in the dictionary, a matching
`<button data-lang-btn="...">` in `#lang-switch`, and the code (`SUPPORTED_LANGS`)
picks it up automatically.

### Hero — real photo, not CSS
The CRT is your own reference photo (`assets/img/crt-monitor.png`, cropped
from the monitor shot you sent — tower/keyboard/mouse cropped out). The video
is a separate `<div class="tv-screen">` absolutely positioned on top of it, at
coordinates measured directly from that image's pixels (see the comment above
`.tv-screen` in `css/style.css`). **If you ever swap in a different photo,
those percentages need re-measuring against the new image** — they won't
land on the right spot otherwise. The top-left OSD badge (■ STOP / ▶ START)
reflects the video's actual play state and updates on hover/click; the video
plays with no color filter (its own footage, untouched).

### Music player
The embed plays the album, "More Music →" links to your artist page. One
platform limitation worth knowing: **Spotify's iframe cannot be forced into a
white/light skin** — the `theme=0` URL parameter that used to do this no
longer has an effect (confirmed by testing). The player itself will keep
Spotify's own dark widget skin regardless of this site's own white theme;
it's framed in a white card so at least everything around it stays on-brand.

### Commission form — filled out on your own form photo
Same idea as the hero: `assets/img/commission-form.png` is the background,
and transparent `<input>`/`<textarea>` elements are positioned exactly on its
printed ruled lines (percentages measured from that image — see the `.cf-*`
rules in `css/style.css`). Typed text appears directly on the paper. Two
things worth knowing:
- The form's own title/labels ("NAME", "EMAIL", ...) are baked into the photo
  in English, so they won't change when switching to Japanese — only the
  submit button and status message below the photo are translated.
- **If you replace this photo with a different form design, the input
  positions need re-measuring** the same way — they're tied to this exact
  image's pixel layout, not a generic template.

### Logo & profile photo
- `assets/logo/logo.png` — drop it in to show a logo above the (now smaller)
  ATAMAQTRS title; the `<img>` fails silently until the file exists.
- `assets/img/profile.jpg` — already in place, shown as a circular photo in
  the About section.

### Fonts
Headings/logo use **VCR OSD Mono** (loaded from cdnfonts.com — a third-party
CDN, not Google Fonts; if it ever goes down or you want it self-hosted for
reliability, download the `.woff2` yourself and swap the `<link>` in
`index.html` for a local `@font-face`). Body text uses **Cormorant Garamond**
from Google Fonts.

### Portfolio content
Edit `data/portfolio.json`. Each entry:
```json
{
  "id": "unique-slug",
  "year": "2024",
  "category": { "en": "...", "ja": "..." },
  "title": { "en": "...", "ja": "..." },
  "thumbnail": "assets/portfolio/your-image-thumb.jpg",
  "images": ["assets/portfolio/your-image-full.jpg"],
  "description": { "en": "...", "ja": "..." }
}
```
Add or remove entries freely — the grid and detail view are fully data-driven.

**Yes, you can manage this yourself later, no code needed:** add the image
file(s) to `assets/portfolio/`, then add one matching entry to
`data/portfolio.json` (copy an existing entry, change the `id`, image paths,
and text). You can even do this straight from github.com's web editor after
the site is pushed — no local setup required. The polaroid card look, the
rotation, and the detail/back navigation are all automatic.

### Commission form email setup
GitHub Pages only serves static files, so sending an email on submit needs a
third-party mail relay. This site is wired for **EmailJS** (free tier, no
backend required):

1. Create a free account at https://www.emailjs.com (you'll need to sign up
   yourself — that's not something I can do on your behalf).
2. **Email Services** → Add New Service → connect the personal inbox you want
   commission requests to land in → copy the **Service ID**.
3. **Email Templates** → Create New Template. Use variables `{{name}}`,
   `{{email}}`, `{{company}}`, `{{message}}` in the template body → copy the
   **Template ID**.
4. **Account** → **General** → copy your **Public Key**.
5. Open `js/commission.js` and replace the three `REPLACE_WITH_...` constants
   at the top of the file with those values.

Until those three values are filled in, the form shows a friendly error
instead of silently failing.

### About / education text
Edit the EN/JA strings directly in `js/i18n.js` under `about.body` and
`about.education.placeholder` (or turn the education list into multiple
`<li>` items in `index.html` if you have more than one line).

## Running locally

No build step — just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

then visit http://localhost:8000

## Deploying to GitHub Pages

```bash
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: Deploy from a branch → Branch:
main / (root)**. The site will be live at
`https://<your-username>.github.io/<repo-name>/` within a minute or two.
