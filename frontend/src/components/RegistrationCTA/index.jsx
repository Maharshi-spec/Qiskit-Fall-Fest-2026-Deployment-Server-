import Button from '../Button'

const RegistrationCTA = () => {
  return (
    <section className="registration-cta">
      <div className="container registration-cta__card">
        <div>
          <p className="section-header__label">Get involved</p>
          <h2>Be Part of the Quantum Journey.</h2>
        </div>
        <p>
          Connect with students and enthusiasts exploring quantum computing, practical learning, and collaborative discovery.
        </p>
        <Button to="/register" kind="primary">Register Now →</Button>
      </div>
    </section>
  )
}

export default RegistrationCTA
