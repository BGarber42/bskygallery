import { useEffect, useRef, useState } from 'react'
import { useModal } from './modalContext.jsx'

function formatTimestamp(isoString) {
  try {
    return new Date(isoString).toLocaleString()
  } catch {
    return isoString
  }
}

export function ModalHost() {
  const { openPost, closeModal, navigate } = useModal()
  const [carouselIndex, setCarouselIndex] = useState(0)
  const modalRef = useRef(null)

  useEffect(() => {
    setCarouselIndex(0)
  }, [openPost?.id])

  useEffect(() => {
    if (!openPost) {
      return
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        closeModal()
      } else if (e.key === 'ArrowLeft') {
        navigate(-1)
      } else if (e.key === 'ArrowRight') {
        navigate(1)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [openPost, closeModal, navigate])

  useEffect(() => {
    if (!openPost) {
      return
    }
    const id = requestAnimationFrame(() => {
      modalRef.current?.classList.add('visible')
    })
    return () => cancelAnimationFrame(id)
  }, [openPost])

  if (!openPost) {
    return null
  }

  const multi = openPost.images && openPost.images.length > 1

  return (
    <div
      ref={modalRef}
      className="modal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeModal()
        }
      }}
    >
      <div className="modal-content">
        <button
          type="button"
          className="modal-close"
          aria-label="Close modal"
          onClick={closeModal}
        >
          ×
        </button>
        <div className="modal-image-wrapper">
          {multi ? (
            <>
              {openPost.images.map((imgData, index) => (
                <img
                  key={imgData.fullsizeUrl}
                  src={imgData.fullsizeUrl}
                  alt={imgData.alt || ''}
                  loading="lazy"
                  style={{ display: index === carouselIndex ? 'block' : 'none' }}
                  onError={(e) => {
                    e.currentTarget.src = imgData.thumbUrl
                  }}
                />
              ))}
              <button
                type="button"
                className="carousel-button prev"
                aria-label="Previous image"
                style={{ display: carouselIndex === 0 ? 'none' : 'block' }}
                onClick={(e) => {
                  e.stopPropagation()
                  setCarouselIndex((i) => Math.max(0, i - 1))
                }}
              >
                ‹
              </button>
              <button
                type="button"
                className="carousel-button next"
                aria-label="Next image"
                style={{
                  display:
                    carouselIndex === openPost.images.length - 1
                      ? 'none'
                      : 'block',
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setCarouselIndex((i) =>
                    Math.min(openPost.images.length - 1, i + 1)
                  )
                }}
              >
                ›
              </button>
            </>
          ) : openPost.images && openPost.images.length === 1 ? (
            <img
              src={openPost.images[0].fullsizeUrl}
              alt={openPost.images[0].alt || ''}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = openPost.images[0].thumbUrl
              }}
            />
          ) : (
            <img
              src={openPost.fullsizeUrl || openPost.thumbUrl}
              alt={openPost.alt || ''}
              onError={(e) => {
                e.currentTarget.src = openPost.thumbUrl
              }}
            />
          )}
        </div>
        <div className="modal-info">
          <p className="modal-text">{openPost.text || '(no text)'}</p>
          <div className="modal-author">
            @{openPost.authorHandle || openPost.authorDid}
          </div>
          <div className="modal-timestamp">
            {formatTimestamp(openPost.timestamp)}
          </div>
          <a
            href={openPost.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="modal-link"
          >
            View on Bluesky →
          </a>
        </div>
      </div>
    </div>
  )
}
