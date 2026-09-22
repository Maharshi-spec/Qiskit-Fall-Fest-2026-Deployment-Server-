import { useEventProfile } from '../../context/EventProfileContext'
import Button from '../Button'

const RegistrationCTA = () => {
  const { getProfilePath, isRegistrationOpen } = useEventProfile()
  const isClosed = !isRegistrationOpen

  return (
    <section className="registration-cta">
      <div className="container registration-cta__card">
        <div>
          <p className="section-header__label">{isClosed ? 'Event Overview' : 'Get involved'}</p>
          <h2>{isClosed ? 'Explore the Quantum Experience.' : 'Be Part of the Quantum Journey.'}</h2>
        </div>
        <p>
          {isClosed
            ? 'Browse schedule sessions, workshop materials, hackathon challenges, and quantum community resources.'
            : 'Connect with students and enthusiasts exploring quantum computing, practical learning, and collaborative discovery.'}
        </p>
        <Button to={isClosed ? getProfilePath('day-1') : getProfilePath('register')} kind="primary">
          {isClosed ? 'Explore Schedule →' : 'Register Now →'}
        </Button>
      </div>
    </section>
  )
}

export default RegistrationCTA
