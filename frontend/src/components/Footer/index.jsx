import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div>
          <p className="site-footer__title">Qiskit Fall Fest 2026</p>
          <p className="site-footer__meta">CUTM, Vizianagaram</p>
        </div>

        <nav className="site-footer__nav" aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/register">Register</Link>
          <Link to="/workshops">Workshops</Link>
          <Link to="/certificates">Certificates</Link>
        </nav>
      </div>
    </footer>
  )
}

export default Footer
