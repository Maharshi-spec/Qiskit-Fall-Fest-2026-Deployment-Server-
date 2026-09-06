import { motion } from 'framer-motion'

const OrganizerCard = ({
  name,
  role,
  department,
  year,
  college,
  image,
  linkedin,
  alt
}) => {
  const hasImage = Boolean(image)

  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`organizer-card ${hasImage ? '' : 'organizer-card--placeholder'}`}
    >
      <div
        className="organizer-card__media"
        aria-label={alt || name || 'Organizer'}
      >
        {hasImage ? (
          <img
            src={image}
            alt={alt || name || 'Organizer'}
            className="organizer-card__image"
          />
        ) : (
          <div className="organizer-card__mark">
            <span>
              {name ? name.charAt(0).toUpperCase() : 'Q'}
            </span>
          </div>
        )}
      </div>

      <div className="organizer-card__content">
        <h3>{name || 'Team Member'}</h3>

        {role && (
          <p className="organizer-card__role">
            {role}
          </p>
        )}

        {(department || year) && (
          <p className="organizer-card__details">
            {department && department}
            {department && year && ' • '}
            {year && year}
          </p>
        )}

        {college && (
          <p className="organizer-card__organization">
            {college}
          </p>
        )}

        {linkedin && (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="organizer-card__linkedin"
            aria-label={`${name}'s LinkedIn Profile`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>

            <span>LinkedIn</span>
          </a>
        )}
      </div>
    </motion.article>
  )
}

export default OrganizerCard