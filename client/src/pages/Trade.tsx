import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { tradeService } from '@/services/trade'
import { useMarketData } from '@/hooks/useMarketData'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { Button } from '@/components/UI/Button'
import { Card } from '@/components/UI/Card'
import { PriceChart } from '@/components/Charts/PriceChart'

const tradeSchema = z.object({
  amount: z.number().min(1, 'Minimum trade amount is $1'),
  prediction: z.enum(['UP', 'DOWN']),
  duration: z.number().min(1).max(10),
})

type TradeForm = z.infer<typeof tradeSchema>

const Trade: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { selectedAsset, currentPrice, assets, setSelectedAsset } = useMarketData()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TradeForm>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      amount: 10,
      prediction: 'UP',
      duration: 1,
    },
  })

  const amount = watch('amount')
  const prediction = watch('prediction')
  const potentialProfit = amount * 0.1

  const onSubmit = async (data: TradeForm) => {
    if (!user) {
      toast.error('Please login to trade')
      return
    }

    setIsSubmitting(true)
    try {
      await tradeService.openTrade({
        asset: selectedAsset,
        amount: data.amount,
        prediction: data.prediction,
        duration: data.duration,
      })
      
      toast.success('Trade opened successfully!')
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['trade-stats'] })
      
      // Reset form
      setValue('amount', 10)
      setValue('prediction', 'UP')
      setValue('duration', 1)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to open trade')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <PriceChart
          symbol={selectedAsset}
          currentPrice={currentPrice}
          onAssetChange={setSelectedAsset}
        />
        
        <Card className="mt-6">
          <h3 className="text-lg font-bold mb-4">Recent Trades</h3>
          {/* Add trade history component here */}
        </Card>
      </div>

      <div>
        <Card className="sticky top-24">
          <h2 className="text-2xl font-bold mb-4">Place a Trade</h2>
          
          <div className="form-control">
            <label className="label">Asset</label>
            <select
              className="select select-bordered"
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
            >
              {assets.map(asset => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.symbol} - ${asset.currentPrice}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control mt-4">
            <label className="label">Current Price</label>
            <div className="text-2xl font-bold text-primary">
              ${currentPrice.toFixed(2)}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="form-control">
              <label className="label">Amount ($)</label>
              <input
                type="number"
                {...register('amount', { valueAsNumber: true })}
                className="input input-bordered"
                step="1"
                min="1"
              />
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div className="form-control">
              <label className="label">Prediction</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setValue('prediction', 'UP')}
                  className={`btn flex-1 ${prediction === 'UP' ? 'btn-success' : 'btn-outline'}`}
                >
                  UP 📈
                </button>
                <button
                  type="button"
                  onClick={() => setValue('prediction', 'DOWN')}
                  className={`btn flex-1 ${prediction === 'DOWN' ? 'btn-error' : 'btn-outline'}`}
                >
                  DOWN 📉
                </button>
              </div>
            </div>

            <div className="form-control">
              <label className="label">Duration (minutes)</label>
              <input
                type="range"
                {...register('duration', { valueAsNumber: true })}
                className="range range-primary"
                min="1"
                max="10"
                step="1"
              />
              <div className="flex justify-between text-xs px-2">
                <span>1m</span>
                <span>5m</span>
                <span>10m</span>
              </div>
              <div className="text-center mt-2">
                {watch('duration')} minute{watch('duration') !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="bg-base-300 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Investment:</span>
                <span className="font-bold">${amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Potential Profit (10%):</span>
                <span className="font-bold text-green-500">+${potentialProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Payout if Win:</span>
                <span className="font-bold">${(amount + potentialProfit).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Risk if Loss:</span>
                <span className="font-bold text-red-500">-${amount.toFixed(2)}</span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isSubmitting}
            >
              Open Trade
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default Trade