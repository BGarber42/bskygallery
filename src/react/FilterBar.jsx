import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import state from '../state.js'
import { useAppVersion } from './useAppVersion.js'

export function FilterBar() {
  const version = useAppVersion()
  const [searchDraft, setSearchDraft] = useState(() => state.filters.searchText)
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    setSearchDraft(state.filters.searchText)
  }, [version])

  const statsText = useMemo(() => {
    const n = state.getFilteredImages().length
    return `${n} images | ${state.connectionStatus}`
  }, [version])

  const onSearchChange = useCallback((e) => {
    const value = e.target.value
    setSearchDraft(value)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      state.setSearchText(value)
    }, 300)
  }, [])

  const onLayout = useCallback(() => {
    state.toggleLayoutMode()
  }, [])

  const onPause = useCallback(() => {
    state.togglePaused()
  }, [])

  return (
    <div className="filter-bar">
      <input
        type="text"
        className="filter-control search-input"
        placeholder="Search..."
        value={searchDraft}
        onChange={onSearchChange}
      />
      <button
        type="button"
        className="filter-control layout-toggle"
        onClick={onLayout}
      >
        {state.layoutMode === 'dense' ? 'Feed grid' : 'Dense wall'}
      </button>
      <button type="button" className="filter-control pause-toggle" onClick={onPause}>
        {state.isPaused ? 'Resume' : 'Pause'}
      </button>
      <div className="filter-control stats">{statsText}</div>
    </div>
  )
}
