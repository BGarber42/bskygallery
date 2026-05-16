export function NewPostsPill({ count, onClick }) {
  if (count <= 0) {
    return null
  }

  const label = count === 1 ? '1 new post' : `${count} new posts`

  return (
    <button type="button" className="new-posts-pill" onClick={onClick}>
      {label}
    </button>
  )
}
