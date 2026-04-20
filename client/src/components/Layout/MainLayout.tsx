import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'
import { useAuthStore } from '@/store/authStore'
import { useMarketStore } from '@/store/marketStore'

interface MainLayoutProps {
  children?: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { isAuthenticated, user } = useAuthStore()
  const { assets } = useMarketStore()
  const location = useLocation()
  const navigate = useNavigate()

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [location.pathname, isMobile])

  // Don't show layout for auth pages
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname)
  
  if (isAuthPage || !isAuthenticated) {
    return <>{children || <Outlet />}</>
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isMobile={isMobile}
        user={user}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen && !isMobile ? 'md:ml-64' : ''}`}>
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          sidebarOpen={sidebarOpen}
          user={user}
          assets={assets}
        />

        <main className="container mx-auto px-4 py-6 min-h-[calc(100vh-140px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children || <Outlet />}
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer />
      </div>
    </div>
  )
}