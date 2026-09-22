import { motion } from 'framer-motion'
import Button from '../../components/Button'
import { useAuth } from '../../context/AuthContext'
import { useEventProfile } from '../../context/EventProfileContext'
import { workshops } from '../../data/workshops'
import sticker05 from '../../assets/qiskit/Sticker 05.svg'
import sticker06 from '../../assets/qiskit/Sticker 06.svg'

const Workshops = () => {
  const { isLoggedIn } = useAuth()
  const { getProfilePath, isRegistrationOpen } = useEventProfile()

  return (
    <motion.section className="detail-page workshops-page" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="container detail-page__header">
        <div className="detail-page__intro">
          <p className="page-shell__eyebrow">Workshops</p>
          <h1>Learn by building.</h1>
          <p>
            Structured hands-on workshop sessions designed to introduce quantum computing fundamentals, Qiskit programming, and algorithm design across all experience levels.
          </p>
        </div>
        <div className="detail-page__visual">
          <img src={sticker05} alt="" className="detail-page__sticker" />
        </div>
      </div>

      <div className="container detail-page__grid detail-page__grid--three">
        {workshops.map((item) => (
          <motion.article key={item.id} className="detail-card detail-card--workshop" whileHover={{ y: -4 }}>
            <div className="detail-card__topline">
              <span className="tag-pill tag-pill--muted">{item.difficulty}</span>
              <span className="tag-pill">{item.category}</span>
            </div>
            <h3 className="workshop-card__title">{item.title}</h3>
            <p className="workshop-card__description">{item.description}</p>
            <ul className="detail-list detail-list--compact">
              {item.duration && <li><strong>Duration:</strong> {item.duration}</li>}
              {item.location && <li><strong>Location:</strong> {item.location}</li>}
            </ul>
          </motion.article>
        ))}
      </div>

      <div className="container detail-page__panel">
        <div className="detail-page__panel-copy">
          <p className="page-shell__eyebrow">Workshop experience</p>
          <h2>Practical exploration across levels.</h2>
          <p>
            Each workshop combines core theoretical concepts with live coding exercises in Qiskit, enabling participants to build, execute, and analyze quantum circuits under mentor guidance.
          </p>
        </div>
        <div className="detail-page__visual-row detail-page__visual-row--inline">
          <img src={sticker06} alt="" className="detail-page__sticker detail-page__sticker--small" />
        </div>
      </div>

      <div className="container detail-page__cta-row">
        {isRegistrationOpen ? (
          !isLoggedIn && <Button to={getProfilePath('register')} kind="primary">Register for Qiskit Fall Fest</Button>
        ) : (
          <Button to={getProfilePath('')} kind="primary">Explore Event Overview</Button>
        )}
        <Button to={getProfilePath('day-1')} kind="secondary">View Day 1 Bootcamp</Button>
      </div>
    </motion.section>
  )
}

export default Workshops

