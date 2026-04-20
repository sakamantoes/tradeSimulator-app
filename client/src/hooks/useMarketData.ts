import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWebSocket } from './useWebSocket'
import { useMarketStore } from '@/store/marketStore'
import { marketService } from '@/services/market'

export const useMarketData = () => {
  const { assets, prices, selectedAsset, setAssets, updatePrice } = useMarketStore()
  const { lastMessage } = useWebSocket('ws://localhost:5000/ws/market')

  const { data: initialAssets, isLoading } = useQuery({
    queryKey: ['market-assets'],
    queryFn: () => marketService.getAssets(),
    onSuccess: (data) => setAssets(data),
  })

  useEffect(() => {
    if (lastMessage?.type === 'price_update') {
      const { symbol, price, change, volume } = lastMessage.data
      updatePrice(symbol, { symbol, price, change, volume, timestamp: Date.now() })
    }
  }, [lastMessage, updatePrice])

  const currentPrice = prices.get(selectedAsset)?.price || 
    assets.find(a => a.symbol === selectedAsset)?.currentPrice || 0

  return {
    assets,
    currentPrice,
    selectedAsset,
    isLoading,
    setSelectedAsset: useMarketStore.getState().setSelectedAsset,
  }
}