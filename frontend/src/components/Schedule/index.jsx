const Schedule = ({ items = [] }) => {
  const visibleItems = items.length ? items : [
    { day: 'Day 01', title: 'Program details coming soon', summary: 'The full event schedule will be shared as it is finalized.' },
  ]

  return (
    <div className="schedule-grid">
      {visibleItems.map((item) => (
        <article key={`${item.day}-${item.title}`} className="schedule-card">
          <p className="schedule-card__day">{item.day}</p>
          <h3>{item.title}</h3>
          {item.summary && <p>{item.summary}</p>}
        </article>
      ))}
    </div>
  )
}

export default Schedule
