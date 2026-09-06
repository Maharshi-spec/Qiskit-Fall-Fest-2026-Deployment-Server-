import { motion } from 'framer-motion'

const SpeakerCard = ({ name, role, organization, bio, session, link, image, alt }) => {
  const hasImage = Boolean(image)

  return (
    <motion.article
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`speaker-card ${hasImage ? '' : 'speaker-card--placeholder'}`}
    >
      <div className="speaker-card__media" aria-label={alt || 'Speaker announcement coming soon'}>
        {hasImage ? (
          <img src={image} alt={alt || name || 'Speaker'} className="speaker-card__image" />
        ) : (
          <div className="speaker-card__placeholder">
            <span>Speaker announcement coming soon</span>
          </div>
        )}
      </div>

      <div className="speaker-card__body">
        <h3>{name || 'Speaker details coming soon'}</h3>
        {role && <p className="speaker-card__role">{role}</p>}
        {organization && <p className="speaker-card__organization">{organization}</p>}
        {bio && <p>{bio}</p>}
        {session && <p className="speaker-card__session"><strong>Session focus:</strong> {session}</p>}
        {link && (
          <a className="speaker-card__link" href={link} target="_blank" rel="noreferrer">
            View profile →
          </a>
        )}
      </div>
    </motion.article>
  )
}

export default SpeakerCard
