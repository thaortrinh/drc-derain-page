# CG&A Project Page (GitHub Pages)

Static supplementary page for IEEE Computer Graphics & Applications — **submit-prep** version (anonymous-friendly).

## Structure

```
publish/
├── img/                    # SOURCE images (edit here)
│   ├── compare/            # i387 / c387 / o387
│   ├── loupe/              # i387 (input) / op387 (GT) / c387 / o387
│   ├── sample/             # input.png / ours.png — the two control demos
│   └── slider/1..6/        # i*.png (input) + o*.png (ours)
└── cga-project-page/       # the deployable site
    ├── index.html
    ├── css/style.css
    ├── js/compare-slider.js
    ├── js/loupe-row.js      # 4-up synced magnifier (independent of the sliders)
    ├── test/compare-slider.test.js   # node test/… (no deps)
    ├── test/loupe-row.test.js
    ├── sync-assets.sh      # copies ../img -> ./assets, atomically
    ├── .nojekyll           # Pages: skip Jekyll
    ├── assets/             # generated copies + figures, video, poster
    │   ├── compare/
    │   ├── loupe/
    │   ├── sample/
    │   └── slider/1..6/
    └── README.md
```

## Pre-deploy checklist

Reviewed and fixed already (see git history): overlay subpixel alignment, aria
churn during the auto sweep, feature-detection guards, atomic `sync-assets.sh`,
dead CSS, dev notes leaking onto the page, and the two sections that pointed at
missing files (now commented out).

**Still blocking — these need your words, not code:**

| # | Where | What |
|---|-------|------|
| 1 | `index.html` `<title>` | still `Project Title — IEEE CG&A` |
| 2 | `index.html` `<h1>` | still `Your Project Title Goes Here` |
| 3 | Overview section | still the instruction text ("Write 2–3 sentences on…") |
| 4 | 5 header buttons | all `href="#"` — Paper / Supplementary / Code / Dataset / Video |
| 5 | Supplementary Materials | 3 more `href="#"` |
| 6 | BibTeX block | `title = {Your Project Title}` |
| 7 | Footer | reads "Template for IEEE CG&A supplementary project page." |
| 8 | Footer | "Last updated: 2026" |

Commented out until their assets exist — uncomment when ready:

- **System Overview** — needs `assets/pipeline.png`
- **Video Demo** — needs `assets/teaser.mp4` (see the `.gitignore` note) or a
  YouTube/Vimeo iframe

Run the slider regression test before pushing:

```bash
node test/compare-slider.test.js
node test/loupe-row.test.js
```

## Blind-review hygiene

The page text says "Anonymous Author(s)" and "withheld for double-blind
review", so the hosting must not undo that:

- A `USER.github.io/...` URL names you. So does the git author on every commit
  (`git config user.email`).
- `<meta name="robots" content="noindex, nofollow">` is set in `index.html` to
  keep the page out of search results and caches. **Remove it after
  acceptance** or the page will never be findable.
- Page source, CSS, JS and PNG metadata were checked — no names, emails, or
  local paths in any of them.
- To commit without your usual identity:

  ```bash
  git -c user.name="Anonymous" -c user.email="anon@example.com" commit -m "..."
  ```

  Set it per-repo instead of per-command with
  `git config user.email "anon@example.com"` right after `git init`.

## Before you publish (submit stage)

1. Replace placeholder title, overview text, and asset paths.
2. Keep **Anonymous Author(s)** until acceptance (if blind review).
3. Use **unlisted** YouTube/Vimeo or private hosting for review links in the paper.
4. Upload official supplementary files via **IEEE Author Portal** — this page is optional support.

## Deploy (free, static — no build step)

Every path in `index.html` is relative (`./assets/...`), so the page works at
any subpath. No bundler, no server, no backend.

### During blind review — anonymous host

A `USER.github.io/...` URL and the git author email both leak your identity.
While the paper is under review, deploy somewhere neutral instead:

- **https://app.netlify.com/drop** — drag the whole `cga-project-page` folder
  in. No account needed; URL is a random subdomain. Sign up (free) to keep the
  link permanent.
- Or `npx surge . my-derain-page.surge.sh` — needs only an email.

### Recommended long-term — GitHub Pages from the code repo's `docs/`

Best when the project page should hang off the main source-code repo: one repo,
one `git push`, and `user.github.io/repo` visibly matches `github.com/user/repo`.

```
your-code-repo/
├── src/ ...              # main code
├── figures/              # source images (this repo's ../img)
│   ├── compare/
│   └── slider/1..6/
└── docs/                 # this folder → Pages root
    ├── index.html
    ├── .nojekyll
    ├── css/  js/  assets/
    └── sync-assets.sh
```

Then: **Settings → Pages → Deploy from branch `main` / folder `/docs`**.
URL: `https://YOUR_USER.github.io/YOUR_REPO/`

`sync-assets.sh` auto-detects `../img` or `../figures`, so it keeps working
after the move. Override explicitly if your layout differs:

```bash
SRC=../figures ./sync-assets.sh
```

**Requires a public repo.** GitHub Pages on a private repo needs GitHub Pro.
If the code must stay private, either publish the page from a separate public
repo and cross-link it from the code README, or use Netlify (its free tier
deploys private repos).

### Standalone repo — page only

```bash
cd cga-project-page
git init && git add . && git commit -m "Add CG&A project page"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

**Settings → Pages → Deploy from branch `main` / folder `/ (root)`**.

Push this folder as the repo root — not the parent `publish/` — since
`assets/` is already a self-contained copy and `img/` is not needed on the
server.

### Gotchas

- `.gitignore` ignores `*.mp4`, so `assets/teaser.mp4` will **not** be
  committed. Add `!assets/teaser.mp4` to `.gitignore`, or embed an unlisted
  YouTube/Vimeo iframe instead (lighter — Pages repos are capped at 1 GB).
- `.nojekyll` is present so Pages skips Jekyll, which would otherwise drop any
  file or folder starting with `_`.
- Pages limits: 1 GB repo, 100 GB bandwidth/month, 10 builds/hour. This page is
  ~1.4 MB.

## After acceptance

- [ ] Replace anonymous blocks with real authors and affiliations
- [ ] Add IEEE Xplore DOI link on Paper button
- [ ] Update BibTeX with volume, issue, pages, DOI
- [ ] Add contact emails
- [ ] Enable Open Graph meta tags in `index.html`

## Compare sliders (image deraining)

Two slider sections, both driven by `js/compare-slider.js` (vanilla JS, no deps):

| Section | Sliders | Mode | Images |
|---------|---------|------|--------|
| **Interactive Demo** | 1 standalone + 6, three per row | the standalone one auto-sweeps for good; the six are manual | `assets/loupe/` + `assets/slider/1…6/` |

**Qualitative Comparison** above it is not a slider section at all — it is the
four-up synced magnifier documented below.

Both `data-position` and `aria-valuenow` are written only for user-driven
moves. The auto sweep deliberately leaves them alone so a decorative 60 fps
animation does not make screen readers announce a changing value.

- **Handle fully left (0%):** derained output visible
- **Handle fully right (100%):** rainy input visible
- Keyboard: arrows nudge 2%, Shift+arrows 10%, Home/End jump to the ends


### Tile sizing

Every result tile on the page renders at one size, set by the Qualitative
Comparison row: it is 4-up, so its track is `T = (C - 3g)/4` for container
width `C` and `--tile-gap` `g`.

The Interactive Demo is 3-up and would otherwise be a third wider, so
`.compare-grid--results` and `.compare-solo` are capped to the width that fits
`n` of those tracks plus their own gaps — `calc(75% - g*0.25)` for `n = 3`,
`calc(50% - g*0.5)` for `n = 2` — and centred. Both grids read `g` from the same
`--tile-gap` custom property, because the cap is only correct if they agree on
it.

| Viewport | Qualitative | Interactive |
|----------|-------------|-------------|
| ≥ 932 px | 216 px | 216 px |
| 850 px | 195.5 px | 195.5 px |
| 700 px | 158 px | 158 px |
| 600 px | 278 px | 278 px |
| < 560 px | 2-up | 1-up, full width |

Below 560 px the Interactive Demo deliberately breaks step and goes full width:
a slider that small is not draggable, and nobody is comparing tile sizes across
two sections on a phone.

### Hover magnifier (loupe)

Every slider gets a circular 2.5x lens that follows the pointer. Inside the lens
the handle split is preserved — left of it our result, right of it the rainy
input — so the two are compared **at the same pixel** instead of from memory.
Residual streaks and over-smoothed texture are the whole argument in a
deraining paper, and at the rendered tile size (216 px) they are well below the
threshold of what an unaided eye resolves.

It is built by `js/compare-slider.js`, so there is nothing to add to
`index.html`. It appears only on hover-capable, fine-pointer devices: on touch
a finger would cover the lens, and the drag gesture already owns that pointer.
It hides while the handle is being dragged and returns on release.

The handle sits **above** the lens (`z-index` 4 vs 3), so the grab knob is never
swallowed by the magnifier -- and its line runs continuously through the circle,
reading as one split rather than two. Because the knob then covers the pixels
you just zoomed into, it turns into a hollow ring while the lens is up.

| Attribute | Default | Meaning |
|-----------|---------|---------|
| `data-loupe` | *(on)* | Set to `"false"` to opt one slider out |
| `data-loupe-size` | `112` | Lens diameter, in px |
| `data-loupe-zoom` | `2.5` | Magnification |

**These match `loupe-row.js` exactly, and must.** Every result tile on the page
now renders the same 256 px source at the same size (see *Tile sizing* below),
so the two magnifiers have no honest reason to disagree about how far to zoom.

**Why 2.5x and not 4x.** All source images are 256 x 256 and a tile renders one
at 216 px — *down*-scaled. A 2.5x lens therefore samples about 2.1x past native,
which smooth interpolation still carries. Going higher would show the upscaler,
not the model. To raise the zoom, re-export the pairs at 512 or 1024 px first —
the lens reads the same `src` as the slider, so higher-resolution files need no
code change.

The lens is `aria-hidden` and pointer-transparent: it is a pointing aid, and
the keyboard path (arrows / Home / End on the handle) is unaffected.


### Four-up synced magnifier (Input / GT / CSUD / Ours)

The first block of the **CSUD vs. Ours** section is a row of four plain images
for one scene. Hovering anywhere over any tile puts a lens on **all four** at
the same normalised point, so the reader picks one streak in the input and
follows what every method did to it — against the ground truth — instead of
holding a crop in memory while their eye travels across four thumbnails.

Entirely separate from the sliders below it, on purpose: these are images, not
sliders, and nothing here can perturb the demonstration slider.

**A separate one-tile demo shows that it exists.** Zoom is otherwise an
invisible feature — nothing in a still row of images announces it — so a
`.zoom-solo` row of one tile sits above the results, carrying
`data-zoom-auto="true"`: its lens drifts along a slow closed path with a ghost
cursor following it, until a real pointer arrives. The results row itself gets
no attribute and therefore never moves on its own; four result images twitching
at once is a distraction, and the hint only has to be given once.

The demo runs on `assets/sample/input.png`, a throwaway pair rather than a
result scene, so nobody mistakes a control demo for a claim about a particular
image. `.zoom-solo` takes its width from the results row's own track formula,
so what the reader practises on is exactly the size of what they get.

The tour pauses while a real pointer is in the row (and the ghost vanishes at
once — two cursors is worse than none), while the row is off-screen, while the
tab is hidden, and under `prefers-reduced-motion`, where `cursor: zoom-in` on
the tiles is left carrying the message on its own.

On leaving, the tour waits ~320 ms before taking back over. It is nowhere near
where the reader left the pointer, and teleporting the lens across the tile
reads as a glitch rather than as a resumption; the delay lets it fade out
first.

| Piece | File |
|-------|------|
| Behaviour | `js/loupe-row.js` (own `<script>` tag) |
| Styles | `.zoom-row` / `.zoom-item` / `.zoom-tile` / `.zoom-tile__lens` |
| Images | `assets/loupe/` (results), `assets/sample/` (the demo tile) |
| Test | `node test/loupe-row.test.js` |

Naming in `img/loupe/` — `i` = input, `op` = output ground truth, `c` = CSUD,
`o` = ours:

```
img/loupe/i387.png   Input          img/loupe/c387.png   CSUD
img/loupe/op387.png  Ground truth   img/loupe/o387.png   Ours
```

Tuning attributes on the `.zoom-row` element:

| Attribute | Default | Meaning |
|-----------|---------|---------|
| `data-zoom` | *(on)* | Set to `"false"` to disable the row's lens |
| `data-zoom-size` | `112` | Lens diameter, in px |
| `data-zoom-factor` | `2.5` | Magnification |
| `data-zoom-auto` | *(off)* | `"true"` self-demonstrates: drifts the lens with a ghost cursor until a real pointer arrives. Opt-in, so a row of results stays still |
| `data-zoom-path` | `figure8` | `figure8` or `sweep` (straight across the middle) |
| `data-zoom-duration` | `9000` | One full loop of the path, in ms |
| `data-zoom-spread` | `0.30` | How far the path reaches horizontally, 0..0.5 |
| `data-zoom-rise` | `0.20` | ...and vertically |

`figure8` is the default because it reads as someone *scanning* the image: it
is closed, so the loop has no seam; it covers both axes; and at the default
amplitudes it stays inside 0.2–0.8 of the tile, never reaching the edges where
a half-clipped lens says nothing and the ghost arrow would be sliced in two.
`sweep` is the plainer alternative for when the drift should not draw the eye.

Syncing is normalised (`u`, `v` in 0..1), not in pixels, so the row stays
correct when it reflows to two columns at ≤640 px and the tiles change size.
Leaving is watched on the row rather than per tile: crossing the gap between
two tiles would otherwise fire leave-then-enter and flicker all four lenses.

Adding a fifth method is markup only — one more `<figure class="zoom-item">`
plus its PNG in `img/loupe/` — but drop `.zoom-row`'s
`grid-template-columns: repeat(4, 1fr)` to match.

### Image sources

Source images live in `../img/` and are copied into `assets/` so this folder
deploys standalone. **After changing anything in `../img/`, re-run:**

```bash
./sync-assets.sh
```

Naming convention (from `../img/`):

```
img/loupe/            i387 = input, op387 = GT, c387 = CSUD, o387 = Ours
img/sample/           input.png = rainy, ours.png = derained (control demos only)
img/slider/1..6/      i*.png = rainy input, o*.png = Ours
img/compare/          unused — superseded by img/loupe/
```

All pairs must share identical width × height. Current set is 256 × 256.

### The standalone demonstration slider

The Interactive Demo opens with one slider of its own (`.compare-solo`, running
on `assets/sample/input.png` vs `ours.png` — the same throwaway pair the
magnifier demo uses, so neither control demo reads as a claim about a result)
carrying
`data-auto="true" data-auto-hint="true"`. `.compare-solo` mirrors
`.compare-grid--results` — same columns, same gap, same breakpoints, same cap —
and puts the figure in the middle track, so it is **exactly one tile wide** at
every viewport width and centred on desktop. A fixed `max-width` would not do:
it would overtake the tiles as soon as the viewport narrowed enough to shrink
them. For the same reason it shares the tiles' trimmed handle, labels and
caption sizes rather than the full-width defaults. It sweeps for as long as the page is
open, with a **↔ Drag to compare** pill over it that fades on hover or focus so
it never fights the magnifier.

It is a worked example, not a one-shot hint: a still picture of a slider does
not say "drag me", and the six manual scenes below refer back to it. It stops
only for the ordinary reasons — hover, drag, keyboard focus, scrolled out of
view, hidden tab, `prefers-reduced-motion` — and resumes every time. That
resume is the point, so it is what `test/compare-slider.test.js` §10 pins down:
a reader who grabs the demo, lets go, and finds it dead has been shown the
opposite of the message.

This replaces the two auto-sweeping CSUD-vs-Ours sliders that used to open the
page. The four-up synced magnifier now carries that comparison, so the pair was
left demonstrating an effect rather than making a point — which is exactly the
job it now does here, once, in the section where the effect matters.

### Auto-sweeping sliders

Add `data-auto="true"` to a `.compare` element and it animates by itself —
no GIF file needed, so the output keeps its full colour depth. It pauses on
hover, while dragging, on keyboard focus, when scrolled out of view, when the
tab is hidden, and under `prefers-reduced-motion: reduce`.

```html
<div class="compare compare--square" data-position="50"
     data-auto="true" data-auto-group="cmp">
```

| Attribute | Default | Meaning |
|-----------|---------|---------|
| `data-auto-duration` | `4200` | One full left → right → left sweep, in ms |
| `data-auto-min` | `8` | Leftmost handle position, in % |
| `data-auto-max` | `92` | Rightmost handle position, in % |
| `data-auto-group` | — | Sliders sharing a name run off one clock and pause/resume together, so a head-to-head is always read at the same handle position |
| `data-auto-hint` | — | `"true"` draws the "Drag to compare" pill over the slider. Styling only — `css/style.css` reads it, `compare-slider.js` does not, and the sweep is unchanged |

To make the 6 Interactive Demo sliders auto-sweep too, add
`data-auto="true" data-auto-group="demo"` to each of their `.compare` divs.

## Assets checklist

| File | Purpose |
|------|---------|
| `assets/loupe/i387,op387,c387,o387.png` | Input / GT / CSUD / Ours for the 4-up synced magnifier |
| `assets/sample/input.png`, `ours.png` | Throwaway pair driving both self-demonstrating widgets (auto sweep, auto magnifier) |
| `assets/compare/*.png` | **No longer rendered.** Fed the auto-sweeping head-to-head; `assets/loupe/` supersedes it. Safe to delete `img/compare/` and re-run `./sync-assets.sh` — the script treats the folder as optional |
| `assets/slider/1…6/i*.png` | Rainy inputs for the 6 demo sliders |
| `assets/slider/1…6/o*.png` | Our results for the 6 demo sliders |
| `assets/pipeline.png` | System / method diagram **(not added yet)** |
| `assets/teaser.mp4` | 2–3 min demo (also submit to IEEE) |
| `assets/teaser-poster.png` | Video thumbnail (optional) |

Pairs must share the same dimensions. Everything under `assets/compare/`,
`assets/loupe/` and `assets/slider/` is generated by `./sync-assets.sh` from `../img/` — edit the
sources there, not the copies.


====
python -m http.server 8080