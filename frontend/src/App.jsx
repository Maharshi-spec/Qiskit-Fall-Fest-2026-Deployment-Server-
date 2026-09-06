import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
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
import { initializeGsap } from './utils/animation'

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
          <Route path="/" element={<AnimatedPage><MainLayout><Home /></MainLayout></AnimatedPage>} />
          <Route path="/register" element={<AnimatedPage><MainLayout><Registration /></MainLayout></AnimatedPage>} />
          <Route path="/attendance" element={<AnimatedPage><MainLayout><Attendance /></MainLayout></AnimatedPage>} />
          <Route path="/hackathon" element={<AnimatedPage><MainLayout><Hackathon /></MainLayout></AnimatedPage>} />
          <Route path="/workshops" element={<AnimatedPage><MainLayout><Workshops /></MainLayout></AnimatedPage>} />
          <Route path="/day-1" element={<AnimatedPage><MainLayout><Day1 /></MainLayout></AnimatedPage>} />
          <Route path="/day-2" element={<AnimatedPage><MainLayout><Day2 /></MainLayout></AnimatedPage>} />
          <Route path="/day-3" element={<AnimatedPage><MainLayout><Day3 /></MainLayout></AnimatedPage>} />
          <Route path="/day-4" element={<AnimatedPage><MainLayout><Day4 /></MainLayout></AnimatedPage>} />
          <Route path="/certificates" element={<AnimatedPage><MainLayout><Certificates /></MainLayout></AnimatedPage>} />
          <Route path="/profile" element={<AnimatedPage><MainLayout><Profile /></MainLayout></AnimatedPage>} />
          <Route path="/organizer/*" element={<AnimatedPage><OrganizerPage /></AnimatedPage>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  )
}

export default App
