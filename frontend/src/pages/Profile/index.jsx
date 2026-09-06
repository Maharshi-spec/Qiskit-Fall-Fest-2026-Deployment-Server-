import { useAuth } from '../../context/AuthContext'

const Profile = () => {
  const { userRegistration } = useAuth()

  const profileName = userRegistration?.fullName || 'Qiskit Participant'
  const email = userRegistration?.email || 'Not available'
  const role = userRegistration?.role || 'Participant'

  return (
    <div className="page-shell">
      <div className="container page-shell__inner">
        <div className="detail-page__header">
          <div className="detail-page__intro">
            <p className="page-shell__eyebrow">Profile</p>
            <h1>{profileName}</h1>
            <p>Welcome back to your Qiskit Fall Fest 2026 account.</p>
          </div>
        </div>

        <div className="detail-cards-grid">
          <article className="detail-card">
            <p className="detail-card__eyebrow">Email</p>
            <h3>{email}</h3>
          </article>
          <article className="detail-card">
            <p className="detail-card__eyebrow">Role</p>
            <h3>{role}</h3>
          </article>
          <article className="detail-card">
            <p className="detail-card__eyebrow">Registration</p>
            <h3>{userRegistration?.registrationId || 'Pending'}</h3>
          </article>
        </div>
      </div>
    </div>
  )
}

export default Profile
