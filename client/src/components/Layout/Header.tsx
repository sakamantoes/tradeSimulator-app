import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import { formatCurrency } from '@/utils/formatters'
import { MarketAsset } from '@/types/market'
import { User } from '@/types/user'
import toast from 'react-hot-toast'

interface HeaderProps {
  onMenuClick: () => void
  sidebarOpen: boolean
  user: User | null
  assets: MarketAsset[]
}

export const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  sidebarOpen, 
  user,
  assets 
}) => {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const { lastMessage } = useWebSocket('ws://localhost:5000/ws/notifications')

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle new notifications
  useEffect(() => {
    if (lastMessage?.type === 'notification') {
      setNotifications(prev => [lastMessage.data, ...prev].slice(0, 10))
      toast(lastMessage.data.message, {
        icon: lastMessage.data.type === 'success' ? '✅' : 
              lastMessage.data.type === 'error' ? '❌' : 'ℹ️',
      })
    }
  }, [lastMessage])

  const handleLogout = async () => {
    try {
      logout()
      navigate({ to: '/login' })
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-40 bg-base-200 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="btn btn-ghost btn-circle"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {sidebarOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                TradeSim
              </div>
              <div className="hidden md:block text-sm text-base-content/60">
                | Simulated Trading
              </div>
            </Link>
          </div>

          {/* Center section - Market Ticker */}
          <div className="hidden lg:flex items-center gap-4 overflow-x-auto max-w-md">
            {assets.slice(0, 5).map(asset => (
              <div key={asset.symbol} className="flex items-center gap-2 text-sm">
                <span className="font-bold">{asset.symbol}</span>
                <span className="text-primary">
                  ${asset.currentPrice.toFixed(2)}
                </span>
                <span className={`text-xs ${asset.trend >= 0 ? 'text-success' : 'text-error'}`}>
                  {asset.trend >= 0 ? '▲' : '▼'} {Math.abs(asset.trend * 100).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="btn btn-ghost btn-circle relative"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 badge badge-error badge-sm">
                    {notifications.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-80 bg-base-100 rounded-lg shadow-xl z-50"
                  >
                    <div className="p-4 border-b border-base-300">
                      <h3 className="font-bold">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-base-content/60">
                          No new notifications
                        </div>
                      ) : (
                        notifications.map((notif, idx) => (
                          <div
                            key={idx}
                            className="p-4 border-b border-base-200 hover:bg-base-200 transition-colors"
                          >
                            <p className="text-sm">{notif.message}</p>
                            <p className="text-xs text-base-content/60 mt-1">
                              {new Date(notif.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-base-300 transition-colors"
              >
                <div className="avatar placeholder">
                  <div className="bg-primary text-primary-content rounded-full w-8">
                    <span className="text-xs">{user ? getInitials(user.fullName) : 'U'}</span>
                  </div>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium">{user?.fullName}</div>
                  <div className="text-xs text-base-content/60">{user?.accountLevel || 'Basic'}</div>
                </div>
                <svg
                  className="w-4 h-4 hidden md:block"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-64 bg-base-100 rounded-lg shadow-xl z-50"
                  >
                    <div className="p-4 border-b border-base-300">
                      <p className="font-medium">{user?.fullName}</p>
                      <p className="text-sm text-base-content/60">{user?.email}</p>
                    </div>
                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-base-200 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/deposit"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-base-200 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Deposit</span>
                      </Link>
                      <Link
                        to="/withdraw"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-base-200 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Withdraw</span>
                      </Link>
                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-base-200 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.66c1.583-.84 3.264.84 2.42 2.42a1.724 1.724 0 001.66 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.66 2.573c.84 1.583-.84 3.264-2.42 2.42a1.724 1.724 0 00-2.573 1.66c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.66c-1.583.84-3.264-.84-2.42-2.42a1.724 1.724 0 00-1.66-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.66-2.573c-.84-1.583.84-3.264 2.42-2.42a1.724 1.724 0 002.573-1.66z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Admin Panel</span>
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-base-300 py-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 hover:bg-base-200 transition-colors text-left"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}