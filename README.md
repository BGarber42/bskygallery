# Bluesky Firehose Gallery

A real-time, 100% client-side image gallery that streams photos from the Bluesky/ATProto network via [Jetstream](https://docs.bsky.app/). Watch images appear as they are posted, in a scrollable feed tuned for live updates.

## Features

- **Live image feed** — WebSocket stream of new posts with image embeds
- **Feed grid** (default) — Responsive row grid (2 / 4 / 8 columns) with virtual scrolling
- **Dense wall** — 8-column Masonic layout for a Pinterest-style wall
- **Incoming row** — New posts land in a fixed top strip (left→right), then merge in batches so the grid shifts down instead of shuffling sideways on every post
- **Scroll away** — Scroll down to freeze the view; new posts buffer behind a “new posts” pill; jump back to latest
- **Search** — Filter by keywords in alt text, post text, or handles (debounced)
- **Pause** — Stop accepting new images without disconnecting
- **Modal** — Full-size view with keyboard navigation between filtered images
- **Responsive** — Works on desktop and mobile

## Tech stack

- **React 18** + **Vite 5**
- **[@tanstack/react-virtual](https://tanstack.com/virtual)** — Feed grid virtualization
- **[masonic](https://github.com/jaredLunde/masonic)** — Dense masonry layout
- **Jetstream** — JSON firehose (no CAR/CBOR decoding in the browser)
- **Plain CSS** — Layout and theming in `src/styles/main.css`

## Local development

### Prerequisites

- Node.js 18+ and npm

### Setup

```bash
git clone <your-repo-url>
cd bskygallery
npm install
npm run dev
```

Opens at `http://localhost:3000` (see `vite.config.js`).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |

## Deployment

Static site — build output is `dist/`. `vite.config.js` sets `base: './'` for subdirectory hosting (e.g. GitHub Pages project sites).

### GitHub Pages

1. Enable **GitHub Pages** for the repo (source: **GitHub Actions**).
2. Push to `main` — [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs `npm ci`, `npm run build`, and deploys `dist/`.

No need to commit `dist/` or set the Pages branch to `/root`.

### Vercel / Netlify

Use the included [`vercel.json`](vercel.json) or [`netlify.toml`](netlify.toml), or connect the repo in the host dashboard (build: `npm run build`, output: `dist`).

## Architecture

```
bskygallery/
├── index.html
├── package.json
├── vite.config.js
├── CLAUDE.md                 # Dev notes for contributors / agents
├── src/
│   ├── main.jsx              # React entry
│   ├── App.jsx               # Shell, layout mode, firehose lifecycle
│   ├── state.js              # Images, filters, layoutMode, subscribers
│   ├── firehose.js           # Jetstream WebSocket + post parsing
│   ├── constants.js          # Column counts, dwell/batch timings
│   ├── react/
│   │   ├── VirtualRowGallery.jsx   # Feed grid (default)
│   │   ├── MasonryGallery.jsx    # Dense wall
│   │   ├── useIncomingRowFeed.js   # Incoming strip + merge (both layouts)
│   │   ├── MasonryCard.jsx
│   │   ├── FilterBar.jsx
│   │   ├── ModalHost.jsx
│   │   ├── NewPostsPill.jsx
│   │   └── galleryLayout.js
│   ├── utils/
│   │   ├── imageUrl.js
│   │   └── filters.js
│   └── styles/
│       └── main.css
└── .github/workflows/
    └── deploy.yml
```

### Data flow

1. **`firehose.js`** connects to Jetstream, parses `app.bsky.feed.post` creates with images, builds stable post ids (`did-rkey`), calls `state.addImage()`.
2. **`state.js`** keeps newest-first list (max **200** images; tail evicted in batches of 8). Notifies React via `snapshotVersion`.
3. **`App.jsx`** passes filtered items to **Feed grid** or **Dense wall**.
4. **`useIncomingRowFeed`** (both layouts) holds up to one row of newest posts in an **incoming strip**, then prepends them to the main list when dwell/thumb-load rules pass. When you scroll away from the top, the visible list freezes and new heads go to a buffer until you jump to latest.

### Layout modes

| Mode | UI label | Implementation |
|------|----------|----------------|
| `feed` (default) | **Dense wall** toggles away | `VirtualRowGallery` — row-major virtual rows |
| `dense` | **Feed grid** toggles back | `MasonryGallery` — 8-column Masonic + same incoming strip |

Feed column count follows viewport width (see `getFeedColumnCount` in `src/constants.js`).

## Performance

- Virtualized feed rows (only visible rows mounted)
- Masonic overscan for dense mode
- Lazy-loaded thumbnails in the main grid; eager load in the incoming strip
- Rolling cap of 200 posts in global state
- Debounced search (300ms)

## Browser support

Modern browsers with ES modules, CSS Grid, and WebSocket. Tested on recent Chrome, Firefox, Safari, and Edge.

## Limitations

- Public Jetstream endpoint; high-volume network firehose
- No auth or private feeds
- ~200 posts retained in memory at the live edge (more may remain visible while scrolled away from top until you jump to latest)
- Dense mode still relayouts the masonry wall when a full incoming row merges (batched, not per-post)

## License

MIT

## Acknowledgments

- [AT Protocol](https://atproto.com/) / [Bluesky](https://bsky.app/)
