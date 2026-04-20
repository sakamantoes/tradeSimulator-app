import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  createChart,
  ColorType,
  IChartApi,
  CandlestickData,
  LineData,
  Time,
  UTCTimestamp,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  CrosshairMode,
  PriceScaleMode,
} from 'lightweight-charts'
import { useMarketData } from '@/hooks/useMarketData'
import { marketService } from '@/services/market'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

interface CandlestickChartProps {
  symbol: string
  currentPrice: number
  onAssetChange?: (symbol: string) => void
  interval?: string
  height?: number
  showVolume?: boolean
  showMA?: boolean
}

interface ChartData {
  candlestick: CandlestickData[]
  volume: Array<{
    time: Time
    value: number
    color: string
  }>
  ma20: LineData[]
  ma50: LineData[]
}

const intervals = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
]

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  symbol,
  currentPrice,
  onAssetChange,
  interval = '1m',
  height = 500,
  showVolume = true,
  showMA = true,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [selectedInterval, setSelectedInterval] = useState(interval)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showIndicators, setShowIndicators] = useState({
    ma20: showMA,
    ma50: showMA,
    volume: showVolume,
  })
  const [chartData, setChartData] = useState<ChartData>({
    candlestick: [],
    volume: [],
    ma20: [],
    ma50: [],
  })

  // Fetch historical data
  const { data: historicalData, isLoading, error } = useQuery({
    queryKey: ['candlestick-data', symbol, selectedInterval],
    queryFn: () => marketService.getHistoricalData(symbol, selectedInterval, 200),
    refetchInterval: selectedInterval === '1m' ? 60000 : 300000,
    staleTime: 30000,
  })

  // Calculate moving averages
  const calculateMA = useCallback((data: CandlestickData[], period: number): LineData[] => {
    const ma: LineData[] = []
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0)
      const average = sum / period
      ma.push({
        time: data[i].time,
        value: average,
      })
    }
    return ma
  }, [])

  // Process chart data
  useEffect(() => {
    if (historicalData && historicalData.length > 0) {
      const candlestick: CandlestickData[] = historicalData.map(item => ({
        time: item.time as UTCTimestamp,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }))

      const volume = historicalData.map(item => ({
        time: item.time as UTCTimestamp,
        value: item.volume,
        color: item.close >= item.open ? '#10b981' : '#ef4444',
      }))

      const ma20 = showIndicators.ma20 ? calculateMA(candlestick, 20) : []
      const ma50 = showIndicators.ma50 ? calculateMA(candlestick, 50) : []

      setChartData({ candlestick, volume, ma20, ma50 })
    }
  }, [historicalData, calculateMA, showIndicators.ma20, showIndicators.ma50])

  // Create and update chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove()
    }

    // Create new chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1e293b' },
        textColor: '#94a3b8',
        fontSize: 12,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: '#334155', style: 1 },
        horzLines: { color: '#334155', style: 1 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#fbbf24',
          width: 1,
          style: 2,
          labelBackgroundColor: '#fbbf24',
        },
        horzLine: {
          color: '#fbbf24',
          width: 1,
          style: 2,
          labelBackgroundColor: '#fbbf24',
        },
      },
      rightPriceScale: {
        borderColor: '#334155',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        mode: PriceScaleMode.Normal,
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
        secondsVisible: selectedInterval === '1m' || selectedInterval === '5m',
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000)
          if (selectedInterval === '1m' || selectedInterval === '5m') {
            return format(date, 'HH:mm')
          }
          return format(date, 'MM/dd HH:mm')
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: isFullscreen ? window.innerHeight - 100 : height,
    })

    chartRef.current = chart

    // candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    })

    // volume series if enabled
    let volumeSeries: any = null
    if (showIndicators.volume) {
      volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#10b981',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      })
    }

    // MA lines if enabled
    let ma20Series: any = null
    let ma50Series: any = null
    if (showIndicators.ma20) {
      ma20Series = chart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 1,
        lineStyle: 1,
        priceLineVisible: false,
        lastValueVisible: true,
        title: 'MA 20',
      })
    }
    if (showIndicators.ma50) {
      ma50Series = chart.addSeries(LineSeries, {
        color: '#8b5cf6',
        lineWidth: 1,
        lineStyle: 1,
        priceLineVisible: false,
        lastValueVisible: true,
        title: 'MA 50',
      })
    }

    // Set data
    if (chartData.candlestick.length > 0) {
      candlestickSeries.setData(chartData.candlestick)
      if (volumeSeries && chartData.volume.length > 0) {
        volumeSeries.setData(chartData.volume)
      }
      if (ma20Series && chartData.ma20.length > 0) {
        ma20Series.setData(chartData.ma20)
      }
      if (ma50Series && chartData.ma50.length > 0) {
        ma50Series.setData(chartData.ma50)
      }

      // Fit content
      chart.timeScale().fitContent()
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: isFullscreen ? window.innerHeight - 100 : height,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [chartData, height, isFullscreen, selectedInterval, showIndicators])

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
    setTimeout(() => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: !isFullscreen ? window.innerHeight - 100 : height,
        })
        chartRef.current.timeScale().fitContent()
      }
    }, 100)
  }, [isFullscreen, height])

  // Handle interval change
  const handleIntervalChange = useCallback((newInterval: string) => {
    setSelectedInterval(newInterval)
  }, [])

  // Toggle indicator
  const toggleIndicator = useCallback((indicator: keyof typeof showIndicators) => {
    setShowIndicators(prev => ({
      ...prev,
      [indicator]: !prev[indicator],
    }))
  }, [])

  // Format current price change
  const priceChange = historicalData && historicalData.length > 1
    ? ((currentPrice - historicalData[historicalData.length - 1].close) / historicalData[historicalData.length - 1].close) * 100
    : 0

  const isPositive = priceChange >= 0

  if (isLoading && chartData.candlestick.length === 0) {
    return (
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex justify-center items-center" style={{ height: `${height}px` }}>
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex justify-center items-center" style={{ height: `${height}px` }}>
            <div className="text-center">
              <p className="text-error">Failed to load chart data</p>
              <button 
                className="btn btn-sm btn-primary mt-2"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`card bg-base-200 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
        style={isFullscreen ? { top: 0, left: 0, right: 0, bottom: 0 } : {}}
      >
        <div className="card-body p-4">
          {/* Chart Header */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            <div className="flex items-center gap-4">
              {onAssetChange && (
                <select
                  className="select select-bordered select-sm"
                  value={symbol}
                  onChange={(e) => onAssetChange(e.target.value)}
                >
                  <option value="AAC">AAC/USD</option>
                  <option value="TBC">TBC/USD</option>
                  <option value="ZNX">ZNX/USD</option>
                  <option value="QRT">QRT/USD</option>
                  <option value="LMX">LMX/USD</option>
                  <option value="OPX">OPX/USD</option>
                  <option value="VTR">VTR/USD</option>
                </select>
              )}
              <div>
                <div className="text-2xl font-bold text-primary">
                  ${currentPrice.toFixed(2)}
                </div>
                <div className={`text-sm ${isPositive ? 'text-success' : 'text-error'}`}>
                  {isPositive ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Interval Selector */}
              <div className="join">
                {intervals.map((int) => (
                  <button
                    key={int.value}
                    onClick={() => handleIntervalChange(int.value)}
                    className={`join-item btn btn-sm ${selectedInterval === int.value ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {int.label}
                  </button>
                ))}
              </div>

              {/* Indicator Toggles */}
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-sm btn-ghost">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Indicators
                </label>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                  <li>
                    <label className="cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showIndicators.ma20}
                        onChange={() => toggleIndicator('ma20')}
                        className="checkbox checkbox-sm"
                      />
                      <span>MA 20</span>
                    </label>
                  </li>
                  <li>
                    <label className="cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showIndicators.ma50}
                        onChange={() => toggleIndicator('ma50')}
                        className="checkbox checkbox-sm"
                      />
                      <span>MA 50</span>
                    </label>
                  </li>
                  <li>
                    <label className="cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showIndicators.volume}
                        onChange={() => toggleIndicator('volume')}
                        className="checkbox checkbox-sm"
                      />
                      <span>Volume</span>
                    </label>
                  </li>
                </ul>
              </div>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="btn btn-sm btn-ghost"
              >
                {isFullscreen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Chart Container */}
          <div
            ref={chartContainerRef}
            className="w-full"
            style={{ height: isFullscreen ? 'calc(100vh - 120px)' : `${height}px` }}
          />

          {/* Chart Legend */}
          <div className="flex flex-wrap gap-4 mt-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-success"></div>
              <span>Bullish</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-error"></div>
              <span>Bearish</span>
            </div>
            {showIndicators.ma20 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-amber-500"></div>
                <span>MA 20</span>
              </div>
            )}
            {showIndicators.ma50 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-purple-500"></div>
                <span>MA 50</span>
              </div>
            )}
            {showIndicators.volume && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500/30"></div>
                <span>Volume</span>
              </div>
            )}
          </div>

          {/* Loading Overlay */}
          {isLoading && chartData.candlestick.length > 0 && (
            <div className="absolute inset-0 bg-base-200/50 flex items-center justify-center">
              <div className="loading loading-spinner loading-md"></div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}