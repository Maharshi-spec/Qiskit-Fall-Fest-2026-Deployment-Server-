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
import Workshops from './pages/Workshops'
import Day1 from './pages/Day1'
import Day2 from './pages/Day2'
import Day3 from './pages/Day3'
import Day4 from './pages/Day4'
import Certificates from './pages/Certificates'
import OrganizerPage from './pages/Organizer'
import Profile from './pages/Profile'
import ProfileSelection from './pages/ProfileSelection'
import { initializeGsap } from './utils/animation'
import { ALLOWED_PROFILES } from './config/eventProfiles'

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
          <Route path="/register" element={<Navigate to="/pre-qiskit/register" replace />} />
          <Route path="/attendance" element={<Navigate to="/pre-qiskit/attendance" replace />} />
          <Route path="/hackathon" element={<Navigate to="/pre-qiskit/hackathon" replace />} />
          <Route path="/workshops" element={<Navigate to="/pre-qiskit/workshops" replace />} />
          <Route path="/day-1" element={<Navigate to="/pre-qiskit/day-1" replace />} />
          <Route path="/day-2" element={<Navigate to="/pre-qiskit/day-2" replace />} />
          <Route path="/day-3" element={<Navigate to="/pre-qiskit/day-3" replace />} />
          <Route path="/day-4" element={<Navigate to="/pre-qiskit/day-4" replace />} />
          <Route path="/certificates" element={<Navigate to="/pre-qiskit/certificates" replace />} />
          <Route path="/profile" element={<Navigate to="/pre-qiskit/profile" replace />} />
          <Route path="/organizer/*" element={<Navigate to="/pre-qiskit/organizer" replace />} />
          <Route path="/:profile" element={<ProfileHome />} />
          <Route path="/:profile/register" element={<ProfilePage><Registration /></ProfilePage>} />
          <Route path="/:profile/attendance" element={<ProfilePage><Attendance /></ProfilePage>} />
          <Route path="/:profile/hackathon" element={<ProfilePage><Hackathon /></ProfilePage>} />
          <Route path="/:profile/workshops" element={<ProfilePage><Workshops /></ProfilePage>} />
          <Route path="/:profile/day-1" element={<ProfilePage><Day1 /></ProfilePage>} />
          <Route path="/:profile/day-2" element={<ProfilePage><Day2 /></ProfilePage>} />
          <Route path="/:profile/day-3" element={<ProfilePage><Day3 /></ProfilePage>} />
          <Route path="/:profile/day-4" element={<ProfilePage><Day4 /></ProfilePage>} />
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

const ProfilePageContent = ({ children }) => {
  const { profile } = useParams()
  if (!ALLOWED_PROFILES.includes(profile)) return <Navigate to="/" replace />
  return <AnimatedPage><MainLayout>{children}</MainLayout></AnimatedPage>
}

const ProfileHome = () => {
  const { profile } = useParams()
  if (!ALLOWED_PROFILES.includes(profile)) return <Navigate to="/" replace />
  return <ProfilePage><Home /></ProfilePage>
}

export default App
