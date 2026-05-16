import { useEffect, useMemo } from 'react'
import state from './state.js'
import { connectFirehose, disconnectFirehose } from './firehose.js'
import { useAppVersion } from './react/useAppVersion.js'
import { ModalProvider } from './react/modalContext.jsx'
import { FilterBar } from './react/FilterBar.jsx'
import { MasonryGallery } from './react/MasonryGallery.jsx'
import { VirtualRowGallery } from './react/VirtualRowGallery.jsx'
import { ModalHost } from './react/ModalHost.jsx'
function ConnectionStatus() {
  const version = useAppVersion()
  const { status, color } = useMemo(() => {
    const s = state.connectionStatus
    const statusColors = {
      connecting: 'yellow',
      connected: 'green',
      disconnected: 'orange',
      error: 'red',
    }
    return { status: s, color: statusColors[s] || 'white' }
  }, [version])

  return (
    <div id="connection-status" style={{ color: color }}>
      Status: {status}
    </div>
  )
}

export default function App() {
  const version = useAppVersion()
  const filtered = useMemo(() => state.getFilteredImages(), [version])
  const layoutMode = useMemo(() => state.layoutMode, [version])

  useEffect(() => {
    connectFirehose()
    return () => disconnectFirehose()
  }, [])

  return (
    <ModalProvider filteredImages={filtered}>
      <div id="app">
        <header className="header">
          <h1 className="title">Bluesky Firehose Gallery</h1>
          <FilterBar />
        </header>
        <main className="main">
          {layoutMode === 'dense' ? (
            <MasonryGallery items={filtered} />
          ) : (
            <VirtualRowGallery items={filtered} />
          )}
        </main>
        <ConnectionStatus />
        <ModalHost />
      </div>
    </ModalProvider>
  )
}
