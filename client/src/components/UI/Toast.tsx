import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  id: string
  type: ToastType
  message: string
  duration?: number
  onClose: (id: string) => void
}

const icons = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  info: InformationCircleIcon,
  warning: ExclamationTriangleIcon,
}

const colors = {
  success: 'alert-success',
  error: 'alert-error',
  info: 'alert-info',
  warning: 'alert-warning',
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const Icon = icons[type]

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(id), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, id, onClose])

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
      className={`alert ${colors[type]} shadow-lg mb-3`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <span>{message}</span>
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onClose(id), 300)
          }}
          className="btn btn-sm btn-ghost btn-circle"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

// Toast Container
interface ToastContainerProps {
  toasts: Array<{
    id: string
    type: ToastType
    message: string
    duration?: number
  }>
  onClose: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={onClose}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Toast Hook
interface ToastMessage {
  type: ToastType
  message: string
  duration?: number
}

interface ToastState {
  id: string
  type: ToastType
  message: string
  duration?: number
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastState[]>([])

  const addToast = ({ type, message, duration = 5000 }: ToastMessage) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message, duration }])
    
    // Auto remove after duration + animation
    setTimeout(() => {
      removeToast(id)
    }, duration + 300)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const success = (message: string, duration?: number) => {
    addToast({ type: 'success', message, duration })
  }

  const error = (message: string, duration?: number) => {
    addToast({ type: 'error', message, duration })
  }

  const info = (message: string, duration?: number) => {
    addToast({ type: 'info', message, duration })
  }

  const warning = (message: string, duration?: number) => {
    addToast({ type: 'warning', message, duration })
  }

  return {
    toasts,
    success,
    error,
    info,
    warning,
    removeToast,
  }
}

// Toast Provider Component
interface ToastProviderProps {
  children: React.ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const { toasts, removeToast } = useToast()

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}

// Individual Toast Component with Progress Bar
interface ProgressToastProps extends ToastProps {
  onClose: (id: string) => void
}

export const ProgressToast: React.FC<ProgressToastProps> = ({
  id,
  type,
  message,
  duration = 5000,
  onClose,
}) => {
  const [progress, setProgress] = useState(100)
  const Icon = icons[type]

  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      
      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 16)

    return () => clearInterval(interval)
  }, [duration])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden bg-base-100 border border-base-300 rounded-lg shadow-lg mb-3`}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${
            type === 'success' ? 'text-success' :
            type === 'error' ? 'text-error' :
            type === 'warning' ? 'text-warning' : 'text-info'
          }`} />
          <span className="flex-1 text-sm">{message}</span>
          <button
            onClick={() => onClose(id)}
            className="btn btn-xs btn-ghost btn-circle"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        className={`h-1 transition-all duration-100 ${
          type === 'success' ? 'bg-success' :
          type === 'error' ? 'bg-error' :
          type === 'warning' ? 'bg-warning' : 'bg-info'
        }`}
        style={{ width: `${progress}%` }}
      />
    </motion.div>
  )
}

// Toast with Actions
interface ActionToastProps extends ToastProps {
  actionLabel?: string
  onAction?: () => void
}

export const ActionToast: React.FC<ActionToastProps> = ({
  id,
  type,
  message,
  actionLabel = 'Undo',
  onAction,
  duration = 5000,
  onClose,
}) => {
  const Icon = icons[type]

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, id, onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`bg-base-100 border border-base-300 rounded-lg shadow-lg mb-3`}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${
            type === 'success' ? 'text-success' :
            type === 'error' ? 'text-error' :
            type === 'warning' ? 'text-warning' : 'text-info'
          }`} />
          <span className="flex-1 text-sm">{message}</span>
          {actionLabel && onAction && (
            <button
              onClick={() => {
                onAction()
                onClose(id)
              }}
              className="btn btn-sm btn-primary"
            >
              {actionLabel}
            </button>
          )}
          <button
            onClick={() => onClose(id)}
            className="btn btn-xs btn-ghost btn-circle"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}