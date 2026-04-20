import React from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/UI/Card'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: number
  isLoading?: boolean
  color?: 'primary' | 'success' | 'error' | 'warning' | 'info'
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  isLoading = false,
  color = 'primary',
}) => {
  const colorClasses = {
    primary: 'text-primary',
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning',
    info: 'text-info',
  }

  const bgColorClasses = {
    primary: 'bg-primary/10',
    success: 'bg-success/10',
    error: 'bg-error/10',
    warning: 'bg-warning/10',
    info: 'bg-info/10',
  }

  const getTrendColor = (trend: number): string => {
    if (trend > 0) return 'text-success'
    if (trend < 0) return 'text-error'
    return 'text-gray-500'
  }

  const getTrendIcon = (trend: number): string => {
    if (trend > 0) return '▲'
    if (trend < 0) return '▼'
    return '•'
  }

  const formatTrend = (trend: number): string => {
    return `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="relative"
    >
      <Card className="overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              {title}
            </p>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                {subtitle && (
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                )}
              </div>
            ) : (
              <>
                <div className={`text-3xl font-bold ${colorClasses[color]}`}>
                  {value}
                </div>
                {subtitle && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {subtitle}
                  </p>
                )}
                {trend !== undefined && (
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${getTrendColor(trend)}`}>
                      {getTrendIcon(trend)} {formatTrend(trend)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      vs last period
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          
          {icon && (
            <div className={`p-3 rounded-lg ${bgColorClasses[color]} ${colorClasses[color]}`}>
              <div className="text-2xl">{icon}</div>
            </div>
          )}
        </div>
        
        {/* Animated progress bar for trend */}
        {trend !== undefined && !isLoading && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(Math.abs(trend), 100)}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className={`absolute bottom-0 left-0 h-1 ${
              trend > 0 ? 'bg-success' : trend < 0 ? 'bg-error' : 'bg-gray-400'
            }`}
          />
        )}
      </Card>
    </motion.div>
  )
}