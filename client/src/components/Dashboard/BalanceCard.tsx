import React from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/UI/Card'

interface BalanceCardProps {
  title: string
  amount: number
  change?: number
  isLoading?: boolean
  icon?: React.ReactNode
  currency?: string
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  title,
  amount,
  change,
  isLoading = false,
  icon,
  currency = '$',
}) => {
  const formatAmount = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatChange = (value: number): string => {
    const formatted = value.toFixed(2)
    return value >= 0 ? `+${formatted}` : formatted
  }

  const getChangeColor = (value: number): string => {
    if (value > 0) return 'text-success'
    if (value < 0) return 'text-error'
    return 'text-gray-500'
  }

  const getChangeIcon = (value: number): string => {
    if (value > 0) return '↑'
    if (value < 0) return '↓'
    return '→'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden"
    >
      <Card className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              {title}
            </p>
            {isLoading ? (
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currency}{formatAmount(amount)}
                </h3>
                {change !== undefined && (
                  <p className={`text-sm mt-1 ${getChangeColor(change)}`}>
                    <span className="font-medium">
                      {getChangeIcon(change)} {formatChange(change)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                      (24h)
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="text-3xl text-primary opacity-75">
              {icon}
            </div>
          )}
        </div>
        
        {/* Gradient background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
      </Card>
    </motion.div>
  )
}