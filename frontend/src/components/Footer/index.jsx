import { Link } from 'react-router-dom'
import { useEventProfile } from '../../context/EventProfileContext'

const Footer = () => {
  const { getProfilePath, isRegistrationOpen } = useEventProfile()

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand-block">
          <p className="site-footer__title">Qiskit Fall Fest 2026</p>
          <p className="site-footer__meta">Centurion University of Technology and Management, Vizianagaram</p>
        </div>

        <nav className="site-footer__nav" aria-label="Footer navigation">
          <Link to={getProfilePath('')}>Home</Link>
          {isRegistrationOpen && <Link to={getProfilePath('register')}>Register</Link>}
          <Link to={getProfilePath('hackathon')}>Hackathon</Link>
          <Link to={getProfilePath('workshops')}>Workshops</Link>
          <Link to={getProfilePath('certificates')}>Certificates</Link>
        </nav>
      </div>
    </footer>
  )
}

export default Footer
