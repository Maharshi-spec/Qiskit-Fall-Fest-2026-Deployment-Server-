const EventCard = ({ eyebrow, title, description }) => {
  return (
    <article className="event-card">
      {eyebrow && <p className="event-card__eyebrow">{eyebrow}</p>}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </article>
  )
}

export default EventCard
