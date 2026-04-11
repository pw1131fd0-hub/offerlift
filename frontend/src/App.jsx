import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import NavBar from './components/NavBar/NavBar'
import Home from './pages/Home'
import Evaluate from './pages/Evaluate'
import Dashboard from './pages/Dashboard'
import Market from './pages/Market'
import Forum from './pages/Forum'
import Scripts from './pages/Scripts'
import { useOfferStore } from './store/offerStore'
import './i18n'

export default function App() {
  const darkMode = useOfferStore((s) => s.darkMode)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
        <NavBar />
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/evaluate" element={<Evaluate />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/market" element={<Market />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/scripts" element={<Scripts />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
