import { useRef, useState, useEffect } from 'react'
import OrganizerCard from '../OrganizerCard'

const HorizontalTeamCarousel = ({ title, members = [], category }) => {
  const scrollRef = useRef(null)

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    const el = scrollRef.current

    if (!el) return

    const maxScrollLeft = el.scrollWidth - el.clientWidth

    setCanScrollLeft(el.scrollLeft > 5)
    setCanScrollRight(el.scrollLeft < maxScrollLeft - 5)
  }

  useEffect(() => {
    const el = scrollRef.current

    if (!el) return

    // Always start at the first card
    el.scrollLeft = 0

    // Wait for cards/images/layout to finish rendering
    requestAnimationFrame(() => {
      el.scrollLeft = 0
      checkScroll()
    })

    el.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [members, category])

  const scroll = (direction) => {
    const el = scrollRef.current

    if (!el) return

    const firstCard = el.querySelector('.team-carousel-item')

    if (!firstCard) return

    const cardWidth = firstCard.getBoundingClientRect().width

    const styles = window.getComputedStyle(firstCard)
    const marginRight = parseFloat(styles.marginRight) || 0
    const marginLeft = parseFloat(styles.marginLeft) || 0

    const scrollAmount =
      (cardWidth + marginLeft + marginRight) * 2

    el.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    })
  }

  if (!members.length) {
    return null
  }

  return (
    <section className="team-carousel-section">
      <h3 className="team-carousel-title">
        {title}
      </h3>

      <div className="team-carousel-container">

        {canScrollLeft && (
          <button
            type="button"
            className="carousel-control carousel-control--left"
            onClick={() => scroll('left')}
            aria-label={`Scroll ${title} left`}
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
        )}

        <div
          className="team-carousel-scroll"
          ref={scrollRef}
        >
          {members.map((member, index) => (
            <div
              key={`${category}-${member.name}-${index}`}
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
        </div>

        {canScrollRight && (
          <button
            type="button"
            className="carousel-control carousel-control--right"
            onClick={() => scroll('right')}
            aria-label={`Scroll ${title} right`}
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
        )}

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