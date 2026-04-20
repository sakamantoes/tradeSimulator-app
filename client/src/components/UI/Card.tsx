import React from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = true,
}) => {
  return (
    <motion.div
      className={`
        bg-base-100 rounded-xl shadow-lg
        ${hoverable ? 'transition-all duration-200 hover:shadow-xl' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      whileHover={hoverable ? { y: -2 } : {}}
      onClick={onClick}
    >
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  )
}