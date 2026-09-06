import { motion } from 'framer-motion'

const WorkshopCard = ({
  title,
  category,
  difficulty,
  description,
  duration,
  instructor,
  location,
  image,
  isExpanded,
  onToggle,
}) => {
  const infoItems = [
    duration && `Duration: ${duration}`,
    instructor && `Instructor: ${instructor}`,
    location && `Location: ${location}`,
  ].filter(Boolean)

  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`card-item workshop-card ${isExpanded ? 'workshop-card--expanded' : ''}`}
    >
      {image ? (
        <div className="workshop-card__image" aria-hidden="true">
          <img src={image} alt="" />
        </div>
      ) : null}

      <div className="workshop-card__content">
        {category && <span className="card-item__badge">{category}</span>}
        {difficulty && <span className="workshop-card__difficulty">{difficulty}</span>}

        <h3>{title}</h3>
        <p className="workshop-card__body">{description}</p>

        {infoItems.length > 0 && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            className="workshop-toggle"
            onClick={onToggle}
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Hide details' : 'View details'}
          </motion.button>
        )}

        {isExpanded && infoItems.length > 0 && (
          <div className="workshop-card__details">
            <ul>
              {infoItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.article>
  )
}

export default WorkshopCard
