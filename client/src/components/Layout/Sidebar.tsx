import React, { useEffect, useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useMarketStore } from '@/store/marketStore'
import { User } from '@/types/user'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isMobile: boolean
  user: User | null
}

interface NavItem {
  name: string
  path: string
  icon: React.ReactNode
  adminOnly?: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isMobile, user }) => {
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()
  const { assets } = useMarketStore()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Trade',
      path: '/trade',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      name: 'Deposit',
      path: '/deposit',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      name: 'Withdraw',
      path: '/withdraw',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M12 4v16" />
        </svg>
      ),
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ]

  // Admin items
  if (user?.role === 'admin') {
    navItems.push(
      {
        name: 'Admin Panel',
        path: '/admin',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.66c1.583-.84 3.264.84 2.42 2.42a1.724 1.724 0 001.66 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.66 2.573c.84 1.583-.84 3.264-2.42 2.42a1.724 1.724 0 00-2.573 1.66c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.66c-1.583.84-3.264-.84-2.42-2.42a1.724 1.724 0 00-1.66-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.66-2.573c-.84-1.583.84-3.264 2.42-2.42a1.724 1.724 0 002.573-1.66z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        adminOnly: true,
      }
    )
  }

  const sidebarVariants = {
    open: {
      x: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    closed: {
      x: '-100%',
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    }
  }

  const overlayVariants = {
    open: { opacity: 1, display: 'block' },
    closed: { opacity: 0, transitionEnd: { display: 'none' } }
  }

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial={isMobile ? 'closed' : 'open'}
        animate={isOpen ? 'open' : 'closed'}
        className={`fixed top-0 left-0 h-full w-64 bg-base-200 shadow-xl z-50 flex flex-col ${!isMobile && 'translate-x-0'}`}
      >
        {/* Logo Area */}
        <div className="p-6 border-b border-base-300">
          <Link to="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              TradeSim
            </div>
          </Link>
          {user && (
            <div className="mt-4 p-3 bg-base-300 rounded-lg">
              <div className="text-sm font-medium truncate">{user.fullName}</div>
              <div className="text-xs text-base-content/60 mt-1">
                Level: {user.accountLevel}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto">
          <div className="px-4 space-y-1">
            {navItems.map((item) => (
              <motion.div
                key={item.path}
                whileHover={{ x: 4 }}
                onHoverStart={() => setHoveredItem(item.path)}
                onHoverEnd={() => setHoveredItem(null)}
              >
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActivePath(item.path) 
                      ? 'bg-primary text-primary-content shadow-lg' 
                      : 'hover:bg-base-300 text-base-content'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="flex-1">{item.name}</span>
                  {hoveredItem === item.path && !isActivePath(item.path) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-1 h-6 bg-primary rounded-full"
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Market Stats Section */}
          <div className="mt-8 px-4">
            <div className="divider text-xs text-base-content/60">Market Overview</div>
            <div className="space-y-2">
              {assets.slice(0, 5).map(asset => (
                <div key={asset.symbol} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-base-300 transition-colors">
                  <span className="font-medium">{asset.symbol}</span>
                  <div className="text-right">
                    <div className="font-mono">${asset.currentPrice.toFixed(2)}</div>
                    <div className={`text-xs ${asset.trend >= 0 ? 'text-success' : 'text-error'}`}>
                      {asset.trend >= 0 ? '▲' : '▼'} {Math.abs(asset.trend * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-base-300 text-xs text-base-content/60">
          <div className="flex justify-between">
            <span>Version</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Status</span>
            <span className="text-success">● Online</span>
          </div>
        </div>
      </motion.aside>
    </>
  )
}