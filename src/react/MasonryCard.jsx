import { memo, useCallback, useState } from 'react'
import { useModal } from './modalContext.jsx'

function pickAspectRatio(post) {
  const first = post.images?.[0]
  const ar = first?.aspectRatio
  if (ar?.width && ar?.height) {
    return ar.width / ar.height
  }
  return 1
}

export const MasonryCard = memo(function MasonryCard({
  data: post,
  width,
  priorityLoad = false,
  onThumbLoad,
}) {
  const { openModal } = useModal()
  const [overlay, setOverlay] = useState(0)
  const ratio = pickAspectRatio(post)
  const minHeight = width / ratio

  const onEnter = useCallback(() => setOverlay(0.6), [])
  const onLeave = useCallback(() => setOverlay(0), [])
  const onClick = useCallback(() => openModal(post), [openModal, post])

  return (
    <div
      className="image-item masonry-cell"
      data-image-id={post.id}
      style={{ minHeight }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {renderThumbContent(post, priorityLoad, onThumbLoad)}
      <div
        className="image-overlay"
        style={{ opacity: overlay }}
        aria-hidden="true"
      />
    </div>
  )
})

function renderThumbContent(post, priorityLoad, onThumbLoad) {
  const notifyLoad = onThumbLoad
    ? () => {
        onThumbLoad(post.id)
      }
    : undefined

  if (post.images && Array.isArray(post.images)) {
    if (post.images.length === 1) {
      return createImg(post.images[0], priorityLoad, notifyLoad)
    }
    if (post.images.length === 2) {
      return (
        <div className="multi-image-grid two-images">
          {post.images.map((imgData, i) => (
            <span key={i}>{createImg(imgData, priorityLoad, notifyLoad)}</span>
          ))}
        </div>
      )
    }
    if (post.images.length === 3) {
      return (
        <div className="multi-image-grid three-images">
          <div className="image-left">
            {createImg(post.images[0], priorityLoad, notifyLoad)}
          </div>
          <div className="image-right">
            {post.images.slice(1, 3).map((imgData, i) => (
              <span key={i}>{createImg(imgData, priorityLoad, notifyLoad)}</span>
            ))}
          </div>
        </div>
      )
    }
    return (
      <div className="multi-image-grid four-plus-images">
        {post.images.slice(0, 4).map((imgData, i) => (
          <span key={i}>{createImg(imgData, priorityLoad, notifyLoad)}</span>
        ))}
        {post.images.length > 4 ? (
          <div className="image-count-badge">
            +{post.images.length - 4}
          </div>
        ) : null}
      </div>
    )
  }

  return createImg(
    { thumbUrl: post.thumbUrl, alt: post.alt, aspectRatio: null },
    priorityLoad,
    notifyLoad
  )
}

function createImg(imgData, priorityLoad = false, onLoad) {
  const ar =
    imgData.aspectRatio?.width && imgData.aspectRatio?.height
      ? `${imgData.aspectRatio.width}/${imgData.aspectRatio.height}`
      : undefined
  return (
    <img
      src={imgData.thumbUrl}
      alt={imgData.alt || ''}
      loading={priorityLoad ? 'eager' : 'lazy'}
      fetchPriority={priorityLoad ? 'high' : undefined}
      decoding={priorityLoad ? 'sync' : 'async'}
      data-aspect-ratio={ar}
      onLoad={onLoad}
      onError={(e) => {
        e.currentTarget.src =
          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E'
        onLoad?.()
      }}
    />
  )
}
