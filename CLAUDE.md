# Bluesky Firehose Gallery (dev notes)

## Stack

- **Vite 5** + **React 18** (`@vitejs/plugin-react` 4.x)
- **Feed layout (default):** `@tanstack/react-virtual` row grid in [`src/react/VirtualRowGallery.jsx`](src/react/VirtualRowGallery.jsx)
- **Dense layout:** Masonic in [`src/react/MasonryGallery.jsx`](src/react/MasonryGallery.jsx)
- Jetstream: [`src/firehose.js`](src/firehose.js); state: [`src/state.js`](src/state.js)

## Layout modes

- `state.layoutMode`: `'feed'` (default) or `'dense'`. FilterBar **Dense wall** / **Feed grid**.
- Feed columns: [`getFeedColumnCount`](src/constants.js) — 2 / 4 / 8 (8 columns from 720px scroll width).
- Dense: `GALLERY_COLUMN_COUNT` (8) for masonry + eviction batching.

## Incoming row + main grid (feed and dense)

[`useIncomingRowFeed`](src/react/useIncomingRowFeed.js) splits the live view in **feed** and **dense** modes:

- **`incomingRow`** — up to `columnCount` newest posts in a fixed top strip; fills **left→right**; thumbs use **eager** load (`priorityLoad` + `onThumbLoad` on [`MasonryCard`](src/react/MasonryCard.jsx)).
- **Batching** — rapid firehose heads are coalesced for [`INCOMING_ROW_BATCH_MS`](src/constants.js) (350ms) before entering the strip.
- **`mainItems`** — virtualized body; merges only when **dwell** ([`INCOMING_ROW_MIN_DWELL_MS`](src/constants.js), 2.5s) **and** strip thumbs have fired `load`/`error`, or after [`INCOMING_ROW_MAX_WAIT_MS`](src/constants.js) (6s). Partial rows also wait [`INCOMING_ROW_MERGE_DEBOUNCE_MS`](src/constants.js) idle (3s).
- **Not following** (`scrollTop` > ~120px): freeze grid (tail posts are **not** removed when global state evicts old images); buffer new heads; scroll **anchoring** when rows prepend. Re-follow only within ~24px of top.
- **Scroll container:** `#root { height: 100%; display: flex }` so `.gallery-scroll` gets a bounded height and `overflow-y: auto` works.
- **Virtualizer** incoming strip in **normal flow** above the spacer (no `scrollMargin` — spacer is already offset). `measureElement` on rows. No `content-visibility` on feed cells (breaks row measurement).
- [`NewPostsPill`](src/react/NewPostsPill.jsx) for buffered posts when scrolled away.

**Dense:** same hook with `GALLERY_COLUMN_COUNT` (8); fixed top strip + Masonic body in [`MasonryGallery.jsx`](src/react/MasonryGallery.jsx). Merges still relayout masonry, but only in row-sized batches (not per-post shuffle).

## React state

`snapshotVersion` + [`useAppVersion`](src/react/useAppVersion.js). Post ids: `` `${did}-${rkey}` ``.

## Manual checks

- At top: new posts fill incoming strip only; main grid shifts down on row merge, not sideways per post
- Debounced partial-row merge; scroll down → buffer pill; jump to latest
- Dense toggle; pause; filter; modal + arrows
- Resize: column count change merges incoming strip first
- `npm run build`

## Gotchas

- Filter/search: hook resets feed when `mainItems` no longer overlaps `items` ids.
- Masonic dense: `usePositioner` deps include `mainItems.length`.
- `React.StrictMode` doubles effects; firehose connect/disconnect idempotent.
