import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const ModalContext = createContext(null)

export function ModalProvider({ filteredImages, children }) {
  const [openPost, setOpenPost] = useState(null)
  const indexRef = useRef(0)

  const openModal = useCallback(
    (post) => {
      const idx = filteredImages.findIndex((p) => p.id === post.id)
      indexRef.current = idx >= 0 ? idx : 0
      setOpenPost(post)
    },
    [filteredImages]
  )

  const closeModal = useCallback(() => {
    setOpenPost(null)
  }, [])

  const navigate = useCallback(
    (direction) => {
      if (filteredImages.length === 0) {
        return
      }
      let next =
        (indexRef.current + direction + filteredImages.length) %
        filteredImages.length
      indexRef.current = next
      setOpenPost(filteredImages[next])
    },
    [filteredImages]
  )

  useEffect(() => {
    if (!openPost) {
      return
    }
    if (!filteredImages.some((p) => p.id === openPost.id)) {
      setOpenPost(null)
    }
  }, [filteredImages, openPost])

  const value = useMemo(
    () => ({
      openModal,
      closeModal,
      navigate,
      openPost,
      filteredImages,
    }),
    [openModal, closeModal, navigate, openPost, filteredImages]
  )

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  )
}

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) {
    throw new Error('useModal requires ModalProvider')
  }
  return ctx
}
