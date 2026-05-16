/** Dense masonry columns + eviction batching (keep aligned with state.addImage). */
export const GALLERY_COLUMN_COUNT = 8

export const GALLERY_COLUMN_GAP_PX = 12
export const GALLERY_ROW_GAP_PX = 12

/** Coalesce rapid firehose posts before updating the incoming strip (ms). */
export const INCOMING_ROW_BATCH_MS = 350

/** Idle time before merging a partial incoming strip (ms). */
export const INCOMING_ROW_MERGE_DEBOUNCE_MS = 3000

/** Minimum time posts stay in the incoming strip before merging (lets thumbs load). */
export const INCOMING_ROW_MIN_DWELL_MS = 2500

/** Force merge even if thumbs still loading (ms since strip started). */
export const INCOMING_ROW_MAX_WAIT_MS = 6000

/** Scroll below this to stop following the live edge. */
export const FOLLOWING_UNFOLLOW_THRESHOLD_PX = 120

/** Scroll above this (near top) to resume following. */
export const FOLLOWING_REFOLLOW_THRESHOLD_PX = 24

/** Feed grid column breakpoints (width in px → columns). */
export const FEED_COLUMN_BREAKPOINTS = [
  { minWidth: 720, columns: 8 },
  { minWidth: 480, columns: 4 },
  { minWidth: 0, columns: 2 },
]

export function getFeedColumnCount(containerWidth) {
  for (const { minWidth, columns } of FEED_COLUMN_BREAKPOINTS) {
    if (containerWidth >= minWidth) {
      return columns
    }
  }
  return 2
}
