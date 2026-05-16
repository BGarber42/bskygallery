import { useSyncExternalStore } from 'react'
import state from '../state.js'

export function useAppVersion() {
  return useSyncExternalStore(
    (onStoreChange) => state.subscribe(onStoreChange),
    () => state.snapshotVersion,
    () => state.snapshotVersion
  )
}
