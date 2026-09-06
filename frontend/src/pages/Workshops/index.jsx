import { motion } from 'framer-motion'
import Button from '../../components/Button'
import { useAuth } from '../../context/AuthContext'
import { workshops } from '../../data/workshops'
import sticker05 from '../../assets/qiskit/Sticker 05.svg'
import sticker06 from '../../assets/qiskit/Sticker 06.svg'

const Workshops = () => {
  const { isLoggedIn } = useAuth()

  return (
    <motion.section className="detail-page" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="container detail-page__header">
        <div className="detail-page__intro">
          <p className="page-shell__eyebrow">Workshops</p>
          <h1>Learn by building.</h1>
          <p>
            These workshop experiences are designed to help participants explore quantum ideas in an accessible, hands-on environment rooted in Qiskit learning and experimentation.
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
              <span className="tag-pill">{item.category}</span>
              <span className="tag-pill tag-pill--muted">{item.difficulty}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <ul className="detail-list detail-list--compact">
              {item.duration && <li>Duration: {item.duration}</li>}
              {item.location && <li>Location: {item.location}</li>}
            </ul>
          </motion.article>
        ))}
      </div>

      <div className="container detail-page__panel">
        <div className="detail-page__panel-copy">
          <p className="page-shell__eyebrow">Workshop experience</p>
          <h2>Practical exploration across levels.</h2>
          <p>
            Workshop sessions combine conceptual grounding with guided practice so participants can understand what is happening as they explore quantum ideas and Qiskit workflows.
          </p>
        </div>
        <div className="detail-page__visual-row detail-page__visual-row--inline">
          <img src={sticker06} alt="" className="detail-page__sticker detail-page__sticker--small" />
        </div>
      </div>

      <div className="container detail-page__cta-row">
        {!isLoggedIn && <Button to="/register" kind="primary">Register your interest</Button>}
        <Button to="/day-1" kind="secondary">See day 1 program</Button>
      </div>
    </motion.section>
  )
}

export default Workshops
