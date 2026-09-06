import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

const MainLayout = ({ children }) => {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="site-main">{children}</main>
      <Footer />
    </div>
  )
}

export default MainLayout
