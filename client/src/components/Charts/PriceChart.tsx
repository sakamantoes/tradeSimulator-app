import React, { useEffect, useRef } from 'react'
import { createChart, ColorType, IChartApi, CandlestickData, CandlestickSeries } from 'lightweight-charts'
import { useMarketData } from '@/hooks/useMarketData'
import { marketService } from '@/services/market'
import { useQuery } from '@tanstack/react-query'

interface PriceChartProps {
  symbol: string
  currentPrice: number
  onAssetChange: (symbol: string) => void
}

export const PriceChart: React.FC<PriceChartProps> = ({
  symbol,
  currentPrice,
  onAssetChange,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  const { data: historicalData } = useQuery({
    queryKey: ['historical-data', symbol],
    queryFn: () => marketService.getHistoricalData(symbol, '1m', 100),
    refetchInterval: 30000,
  })

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1e293b' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#334155' },
        horzLines: { color: '#334155' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    })

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    })

    if (historicalData) {
      const data: CandlestickData[] = historicalData.map(item => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }))
      candlestickSeries.setData(data)
    }

    chartRef.current = chart

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [historicalData])

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <div>
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
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              ${currentPrice.toFixed(2)}
            </div>
          </div>
        </div>
        <div ref={chartContainerRef} />
      </div>
    </div>
  )
}