import { useRef, useState, useEffect } from 'react'
import OrganizerCard from '../OrganizerCard'

const HorizontalTeamCarousel = ({
  title,
  members = [],
  category,
  items,
  renderItem,
  children,
  className = '',
  desktopGrid = false,
  ariaLabel,
}) => {
  const scrollRef = useRef(null)

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const hasInitializedRef = useRef(false)
  const isCheckingRef = useRef(false)

  const checkScroll = () => {
    if (isCheckingRef.current) return
    isCheckingRef.current = true

    requestAnimationFrame(() => {
      isCheckingRef.current = false
      const el = scrollRef.current
      if (!el) return

      const maxScrollLeft = el.scrollWidth - el.clientWidth
      const left = el.scrollLeft > 5
      const right = el.scrollLeft < maxScrollLeft - 5

      setCanScrollLeft((prev) => (prev !== left ? left : prev))
      setCanScrollRight((prev) => (prev !== right ? right : prev))
    })
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    // Only reset scroll position on initial mount, NEVER during resize or normal interaction
    if (!hasInitializedRef.current) {
      el.scrollLeft = 0
      hasInitializedRef.current = true
    }

    const timer = setTimeout(() => {
      checkScroll()
    }, 100)

    const handleScroll = () => checkScroll()
    const handleResize = () => checkScroll()

    el.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timer)
      el.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [category, desktopGrid])

  const scroll = (direction) => {
    const el = scrollRef.current
    if (!el) return

    const firstCard = el.querySelector('.team-carousel-item')
    if (!firstCard) return

    const cardWidth = firstCard.getBoundingClientRect().width
    const styles = window.getComputedStyle(firstCard)
    const marginRight = parseFloat(styles.marginRight) || 0
    const marginLeft = parseFloat(styles.marginLeft) || 0
    const parentStyles = window.getComputedStyle(el)
    const gap = parseFloat(parentStyles.gap) || parseFloat(parentStyles.columnGap) || 0

    // Single card step: card width + margins + gap
    const singleStep = cardWidth + marginLeft + marginRight + gap
    // On mobile / single-card view, scroll 1 card; on desktop view with multiple cards, scroll 2
    const isSingleCard = cardWidth > el.clientWidth * 0.45
    const scrollAmount = isSingleCard ? singleStep : singleStep * 2

    el.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    })
  }

  const hasMembers = Array.isArray(members) && members.length > 0
  const hasItems = Array.isArray(items) && items.length > 0
  const hasChildren = Boolean(children)

  if (!hasMembers && !hasItems && !hasChildren) {
    return null
  }

  const label = ariaLabel || title || 'items'

  return (
    <section
      className={`team-carousel-section ${desktopGrid ? 'team-carousel-section--desktop-grid' : ''} ${className}`.trim()}
    >
      {title && (
        <h3 className="team-carousel-title">
          {title}
        </h3>
      )}

      <div className="team-carousel-container">
        <button
          type="button"
          className={`carousel-control carousel-control--left ${!canScrollLeft ? 'carousel-control--disabled' : ''}`}
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          aria-label={`Scroll ${label} left`}
          aria-hidden={!canScrollLeft}
          tabIndex={canScrollLeft ? 0 : -1}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div
          className="team-carousel-scroll"
          ref={scrollRef}
        >
          {hasMembers &&
            members.map((member, index) => (
              <div
                key={`${category || 'member'}-${member.name}-${index}`}
                className="team-carousel-item"
              >
                <OrganizerCard
                  name={member.name}
                  role={member.role}
                  department={member.department}
                  year={member.year}
                  college={member.college}
                  image={member.photo}
                  linkedin={member.linkedin}
                  alt={member.name}
                />
              </div>
            ))}

          {hasItems && renderItem &&
            items.map((item, index) => (
              <div
                key={`${category || 'item'}-${item.id || item.name || index}`}
                className="team-carousel-item"
              >
                {renderItem(item, index)}
              </div>
            ))}

          {hasChildren && children}
        </div>

        <button
          type="button"
          className={`carousel-control carousel-control--right ${!canScrollRight ? 'carousel-control--disabled' : ''}`}
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          aria-label={`Scroll ${label} right`}
          aria-hidden={!canScrollRight}
          tabIndex={canScrollRight ? 0 : -1}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <div
          className="carousel-fade carousel-fade--left"
          style={{ opacity: canScrollLeft ? 1 : 0 }}
        />

        <div
          className="carousel-fade carousel-fade--right"
          style={{ opacity: canScrollRight ? 1 : 0 }}
        />
      </div>
    </section>
  )
}

export default HorizontalTeamCarousel