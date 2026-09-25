import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import LoginModal from './components/LoginModal'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import Registration from './pages/Registration'
import Attendance from './pages/Attendance'
import Hackathon from './pages/Hackathon'
import HackathonProblemStatements from './pages/Hackathon/ProblemStatements'
import Workshops from './pages/Workshops'
import Day1 from './pages/Day1'
import Day2 from './pages/Day2'
import Day3 from './pages/Day3'
import Day4 from './pages/Day4'
import Day5 from './pages/Day5'
import Day6 from './pages/Day6'
import Certificates from './pages/Certificates'
import OrganizerPage from './pages/Organizer'
import Profile from './pages/Profile'
import ProfileSelection from './pages/ProfileSelection'
import { initializeGsap } from './utils/animation'
import { ALLOWED_PROFILES } from './config/eventProfiles'
import { useEventProfile } from './context/EventProfileContext'

const AnimatedPage = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -18 }}
    transition={{ duration: 0.45, ease: 'easeInOut' }}
    style={{ width: '100%' }}
  >
    {children}
  </motion.div>
)

const ProfileRedirect = ({ target }) => {
  const { activeProfile, postQiskitEnabled, postQiskitConfigLoading } = useEventProfile()

  if (postQiskitConfigLoading) {
    return null
  }

  const effectiveProfile = (activeProfile === 'post-qiskit' && postQiskitEnabled)
    ? 'post-qiskit'
    : (activeProfile === 'post-qiskit' && !postQiskitEnabled)
      ? 'pre-qiskit'
      : (activeProfile || 'pre-qiskit')

  return <Navigate to={`/${effectiveProfile}/${target}`} replace />
}

const OrganizerRedirect = () => {
  const { activeProfile, postQiskitEnabled, postQiskitConfigLoading } = useEventProfile()

  if (postQiskitConfigLoading) {
    return null
  }

  const effectiveProfile = (activeProfile === 'post-qiskit' && postQiskitEnabled)
    ? 'post-qiskit'
    : (activeProfile === 'post-qiskit' && !postQiskitEnabled)
      ? 'pre-qiskit'
      : (activeProfile || 'pre-qiskit')

  return <Navigate to={`/${effectiveProfile}/organizer`} replace />
}

function App() {
  const location = useLocation()

  useEffect(() => {
    initializeGsap()
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    ScrollTrigger.refresh()
  }, [location.pathname])

  return (
    <>
      <LoginModal />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<ProfileSelection />} />
          <Route path="/register" element={<ProfileRedirect target="register" />} />
          <Route path="/attendance" element={<ProfileRedirect target="attendance" />} />
          <Route path="/hackathon" element={<ProfileRedirect target="hackathon" />} />
          <Route path="/hackathon/problem-statements" element={<ProfileRedirect target="hackathon/problem-statements" />} />
          <Route path="/workshops" element={<ProfileRedirect target="workshops" />} />
          <Route path="/day-1" element={<ProfileRedirect target="day-1" />} />
          <Route path="/day-2" element={<ProfileRedirect target="day-2" />} />
          <Route path="/day-3" element={<ProfileRedirect target="day-3" />} />
          <Route path="/day-4" element={<ProfileRedirect target="day-4" />} />
          <Route path="/day-5" element={<Navigate to="/post-qiskit/day-5" replace />} />
          <Route path="/day-6" element={<Navigate to="/post-qiskit/day-6" replace />} />
          <Route path="/certificates" element={<ProfileRedirect target="certificates" />} />
          <Route path="/profile" element={<ProfileRedirect target="profile" />} />
          <Route path="/organizer/*" element={<OrganizerRedirect />} />
          <Route path="/:profile" element={<ProfileHome />} />
          <Route path="/:profile/register" element={<ProfilePage><Registration /></ProfilePage>} />
          <Route path="/:profile/attendance" element={<ProfilePage><Attendance /></ProfilePage>} />
          <Route path="/:profile/hackathon" element={<ProfilePage><Hackathon /></ProfilePage>} />
          <Route path="/:profile/hackathon/problem-statements" element={<ProfilePage><HackathonProblemStatements /></ProfilePage>} />
          <Route path="/:profile/workshops" element={<ProfilePage><Workshops /></ProfilePage>} />
          <Route path="/:profile/day-1" element={<ProfilePage><Day1 /></ProfilePage>} />
          <Route path="/:profile/day-2" element={<ProfilePage><Day2 /></ProfilePage>} />
          <Route path="/:profile/day-3" element={<ProfilePage><Day3 /></ProfilePage>} />
          <Route path="/:profile/day-4" element={<ProfilePage><Day4 /></ProfilePage>} />
          <Route path="/:profile/day-5" element={<ProfilePage><Day5 /></ProfilePage>} />
          <Route path="/:profile/day-6" element={<ProfilePage><Day6 /></ProfilePage>} />
          <Route path="/:profile/certificates" element={<ProfilePage><Certificates /></ProfilePage>} />
          <Route path="/:profile/profile" element={<ProfilePage><Profile /></ProfilePage>} />
          <Route path="/:profile/organizer/*" element={<AnimatedPage><OrganizerPage /></AnimatedPage>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  )
}

const ProfilePage = ({ children }) => (
  <ProfilePageContent>{children}</ProfilePageContent>
)

// Guard: validates profile param; if post-qiskit is disabled, redirects to /
const ProfilePageContent = ({ children }) => {
  const { profile } = useParams()
  const { postQiskitEnabled, postQiskitConfigLoading } = useEventProfile()

  if (!ALLOWED_PROFILES.includes(profile)) return <Navigate to="/" replace />

  // If navigating to post-qiskit and it's disabled (and config has finished loading), redirect to /
  if (profile === 'post-qiskit' && !postQiskitConfigLoading && !postQiskitEnabled) {
    return <Navigate to="/" replace />
  }

  // While loading config for post-qiskit, show nothing briefly (prevents flash)
  if (profile === 'post-qiskit' && postQiskitConfigLoading) {
    return null
  }

  return <AnimatedPage><MainLayout>{children}</MainLayout></AnimatedPage>
}

const ProfileHome = () => {
  const { profile } = useParams()
  const { postQiskitEnabled, postQiskitConfigLoading } = useEventProfile()

  if (!ALLOWED_PROFILES.includes(profile)) return <Navigate to="/" replace />

  if (profile === 'post-qiskit' && !postQiskitConfigLoading && !postQiskitEnabled) {
    return <Navigate to="/" replace />
  }

  if (profile === 'post-qiskit' && postQiskitConfigLoading) {
    return null
  }

  return <ProfilePage><Home /></ProfilePage>
}

export default App
