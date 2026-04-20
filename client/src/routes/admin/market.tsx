import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { adminService } from '@/services/admin'
import { marketService } from '@/services/market'
import { Button } from '@/components/UI/Button'
import { Card } from '@/components/UI/Card'
import { Modal } from '@/components/UI/Modal'
import { formatCurrency } from '@/utils/formatters'

export const Route = createFileRoute('/admin/market')({
  component: MarketSettings,
})

interface MarketAsset {
  symbol: string
  name: string
  currentPrice: number
  volatility: number
  trend: number
  volume: number
  isActive: boolean
}

const assetSchema = z.object({
  symbol: z.string().min(2).max(10).regex(/^[A-Z]+$/, 'Symbol must be uppercase letters'),
  name: z.string().optional(),
  currentPrice: z.number().min(0.01, 'Price must be at least 0.01'),
  volatility: z.number().min(0).max(0.5, 'Volatility must be between 0 and 0.5'),
  trend: z.number().min(-0.1).max(0.1, 'Trend must be between -0.1 and 0.1'),
  volume: z.number().min(0),
})

const bulkUpdateSchema = z.object({
  volatility: z.number().min(0).max(0.5).optional(),
  trend: z.number().min(-0.1).max(0.1).optional(),
})

type AssetForm = z.infer<typeof assetSchema>
type BulkUpdateForm = z.infer<typeof bulkUpdateSchema>

function MarketSettings() {
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(null)
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const queryClient = useQueryClient()

  const { data: assets, isLoading } = useQuery({
    queryKey: ['market-assets'],
    queryFn: () => marketService.getAssets(),
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['market-stats'],
    queryFn: () => adminService.getMarketStats(),
  })

  const createAssetMutation = useMutation({
    mutationFn: (data: AssetForm) => adminService.createAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-assets'] })
      queryClient.invalidateQueries({ queryKey: ['market-stats'] })
      toast.success('Asset created successfully')
      setIsAssetModalOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create asset')
    },
  })

  const updateAssetMutation = useMutation({
    mutationFn: ({ symbol, data }: { symbol: string; data: Partial<AssetForm> }) =>
      adminService.updateAsset(symbol, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-assets'] })
      queryClient.invalidateQueries({ queryKey: ['market-stats'] })
      toast.success('Asset updated successfully')
      setIsAssetModalOpen(false)
      setSelectedAsset(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update asset')
    },
  })

  const deleteAssetMutation = useMutation({
    mutationFn: (symbol: string) => adminService.deleteAsset(symbol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-assets'] })
      queryClient.invalidateQueries({ queryKey: ['market-stats'] })
      toast.success('Asset deactivated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate asset')
    },
  })

  const bulkUpdateMutation = useMutation({
    mutationFn: (data: BulkUpdateForm) => adminService.bulkUpdateAssets(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-assets'] })
      toast.success('Market settings updated successfully')
      setIsBulkModalOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update market settings')
    },
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AssetForm>({
    resolver: zodResolver(assetSchema),
  })

  const { register: registerBulk, handleSubmit: handleBulkSubmit, formState: { errors: bulkErrors } } = useForm<BulkUpdateForm>({
    resolver: zodResolver(bulkUpdateSchema),
  })

  const handleOpenCreateModal = () => {
    setIsEditing(false)
    reset({
      symbol: '',
      name: '',
      currentPrice: 100,
      volatility: 0.02,
      trend: 0,
      volume: 1000,
    })
    setIsAssetModalOpen(true)
  }

  const handleOpenEditModal = (asset: MarketAsset) => {
    setIsEditing(true)
    setSelectedAsset(asset)
    reset({
      symbol: asset.symbol,
      name: asset.name,
      currentPrice: asset.currentPrice,
      volatility: asset.volatility,
      trend: asset.trend,
      volume: asset.volume,
    })
    setIsAssetModalOpen(true)
  }

  const onSubmitAsset = (data: AssetForm) => {
    if (isEditing && selectedAsset) {
      updateAssetMutation.mutate({ symbol: selectedAsset.symbol, data })
    } else {
      createAssetMutation.mutate(data)
    }
  }

  const onBulkUpdate = (data: BulkUpdateForm) => {
    bulkUpdateMutation.mutate(data)
  }

  if (isLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Market Settings</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsBulkModalOpen(true)}>
            Bulk Update
          </Button>
          <Button variant="primary" onClick={handleOpenCreateModal}>
            Add Asset
          </Button>
        </div>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Total Assets</div>
            <div className="stat-value">{stats?.totalAssets || 0}</div>
            <div className="stat-desc">Active: {stats?.activeAssets || 0}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Average Price</div>
            <div className="stat-value">{formatCurrency(stats?.averagePrice || 0)}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Total Volume</div>
            <div className="stat-value">{stats?.totalVolume?.toLocaleString() || 0}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Open Trades</div>
            <div className="stat-value text-warning">{stats?.openTrades || 0}</div>
            <div className="stat-desc">Closed: {stats?.closedTrades || 0}</div>
          </div>
        </Card>
      </div>

      {/* Assets Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th>Price</th>
              <th>Volatility</th>
              <th>Trend</th>
              <th>Volume</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets?.map((asset) => (
              <tr key={asset.symbol}>
                <td className="font-bold">{asset.symbol}</td>
                <td>{asset.name || asset.symbol}</td>
                <td className="text-primary font-bold">{formatCurrency(asset.currentPrice)}</td>
                <td>{(asset.volatility * 100).toFixed(2)}%</td>
                <td className={asset.trend > 0 ? 'text-success' : asset.trend < 0 ? 'text-error' : ''}>
                  {asset.trend > 0 ? '+' : ''}{(asset.trend * 100).toFixed(2)}%
                </td>
                <td>{asset.volume.toLocaleString()}</td>
                <td>
                  <span className={`badge ${asset.isActive ? 'badge-success' : 'badge-error'}`}>
                    {asset.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleOpenEditModal(asset)}
                    >
                      Edit
                    </Button>
                    {asset.isActive && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (confirm(`Are you sure you want to deactivate ${asset.symbol}?`)) {
                            deleteAssetMutation.mutate(asset.symbol)
                          }
                        }}
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Asset Modal (Create/Edit) */}
      <Modal
        isOpen={isAssetModalOpen}
        onClose={() => {
          setIsAssetModalOpen(false)
          setSelectedAsset(null)
        }}
        title={isEditing ? 'Edit Asset' : 'Create Asset'}
      >
        <form onSubmit={handleSubmit(onSubmitAsset)} className="space-y-4">
          <div>
            <label className="label">Symbol</label>
            <input
              {...register('symbol')}
              className="input input-bordered w-full"
              placeholder="AAC"
              disabled={isEditing}
            />
            {errors.symbol && (
              <p className="text-red-500 text-sm mt-1">{errors.symbol.message}</p>
            )}
          </div>

          <div>
            <label className="label">Name (Optional)</label>
            <input
              {...register('name')}
              className="input input-bordered w-full"
              placeholder="Asset Name"
            />
          </div>

          <div>
            <label className="label">Current Price ($)</label>
            <input
              type="number"
              step="0.01"
              {...register('currentPrice', { valueAsNumber: true })}
              className="input input-bordered w-full"
            />
            {errors.currentPrice && (
              <p className="text-red-500 text-sm mt-1">{errors.currentPrice.message}</p>
            )}
          </div>

          <div>
            <label className="label">Volatility (%)</label>
            <input
              type="number"
              step="0.01"
              {...register('volatility', { valueAsNumber: true })}
              className="input input-bordered w-full"
            />
            <span className="text-xs text-gray-500">0-50% (default: 2%)</span>
            {errors.volatility && (
              <p className="text-red-500 text-sm mt-1">{errors.volatility.message}</p>
            )}
          </div>

          <div>
            <label className="label">Trend (%)</label>
            <input
              type="number"
              step="0.01"
              {...register('trend', { valueAsNumber: true })}
              className="input input-bordered w-full"
            />
            <span className="text-xs text-gray-500">-10% to +10% (default: 0%)</span>
            {errors.trend && (
              <p className="text-red-500 text-sm mt-1">{errors.trend.message}</p>
            )}
          </div>

          <div>
            <label className="label">Volume</label>
            <input
              type="number"
              {...register('volume', { valueAsNumber: true })}
              className="input input-bordered w-full"
            />
            {errors.volume && (
              <p className="text-red-500 text-sm mt-1">{errors.volume.message}</p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAssetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createAssetMutation.isPending || updateAssetMutation.isPending}
            >
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Update Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Market Update"
      >
        <form onSubmit={handleBulkSubmit(onBulkUpdate)} className="space-y-4">
          <div>
            <label className="label">Global Volatility (%)</label>
            <input
              type="number"
              step="0.01"
              {...registerBulk('volatility', { valueAsNumber: true })}
              className="input input-bordered w-full"
              placeholder="Leave empty to keep current"
            />
            <span className="text-xs text-gray-500">Applies to all active assets</span>
            {bulkErrors.volatility && (
              <p className="text-red-500 text-sm mt-1">{bulkErrors.volatility.message}</p>
            )}
          </div>

          <div>
            <label className="label">Global Trend (%)</label>
            <input
              type="number"
              step="0.01"
              {...registerBulk('trend', { valueAsNumber: true })}
              className="input input-bordered w-full"
              placeholder="Leave empty to keep current"
            />
            <span className="text-xs text-gray-500">Positive = Bullish, Negative = Bearish</span>
            {bulkErrors.trend && (
              <p className="text-red-500 text-sm mt-1">{bulkErrors.trend.message}</p>
            )}
          </div>

          <div className="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>This will affect all active assets. Use with caution!</span>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsBulkModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="warning"
              isLoading={bulkUpdateMutation.isPending}
            >
              Apply Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}