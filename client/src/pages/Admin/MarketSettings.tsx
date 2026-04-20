import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/hooks/useToast';
import { MarketAsset } from '@/types/market';

interface MarketSettings {
  volatility: number;
  defaultVolatility: number;
  minVolatility: number;
  maxVolatility: number;
  marketTrend: number;
  defaultTrend: number;
  minTrend: number;
  maxTrend: number;
  tradingHours: {
    start: string;
    end: string;
    enabled: boolean;
  };
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

const MarketSettings: React.FC = () => {
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [settings, setSettings] = useState<MarketSettings>({
    volatility: 0.02,
    defaultVolatility: 0.02,
    minVolatility: 0.01,
    maxVolatility: 0.1,
    marketTrend: 0,
    defaultTrend: 0,
    minTrend: -0.05,
    maxTrend: 0.05,
    tradingHours: {
      start: '00:00',
      end: '23:59',
      enabled: false,
    },
    maintenanceMode: false,
    maintenanceMessage: 'System is under maintenance. Please check back later.',
  });
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [assetForm, setAssetForm] = useState<Partial<MarketAsset>>({
    symbol: '',
    name: '',
    currentPrice: 100,
    volatility: 0.02,
    trend: 0,
    volume: 1000,
    isActive: true,
  });
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: fetchedAssets, isLoading } = useQuery<MarketAsset[]>({
    queryKey: ['admin-market-assets'],
    queryFn: () => adminService.getMarketAssets(),
  });

  const { data: fetchedSettings } = useQuery<MarketSettings>({
    queryKey: ['admin-market-settings'],
    queryFn: () => adminService.getMarketSettings(),
  });

  const updateAssetMutation = useMutation({
    mutationFn: ({ symbol, data }: { symbol: string; data: Partial<MarketAsset> }) =>
      adminService.updateMarketAsset(symbol, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-market-assets'] });
      showToast('Asset updated successfully', 'success');
      setIsAssetModalOpen(false);
    },
    onError: () => {
      showToast('Failed to update asset', 'error');
    },
  });

  const createAssetMutation = useMutation({
    mutationFn: (data: Partial<MarketAsset>) => adminService.createMarketAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-market-assets'] });
      showToast('Asset created successfully', 'success');
      setIsAssetModalOpen(false);
      setAssetForm({
        symbol: '',
        name: '',
        currentPrice: 100,
        volatility: 0.02,
        trend: 0,
        volume: 1000,
        isActive: true,
      });
    },
    onError: () => {
      showToast('Failed to create asset', 'error');
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<MarketSettings>) => adminService.updateMarketSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-market-settings'] });
      showToast('Settings updated successfully', 'success');
      setIsSettingsModalOpen(false);
    },
    onError: () => {
      showToast('Failed to update settings', 'error');
    },
  });

  useEffect(() => {
    if (fetchedAssets) {
      setAssets(fetchedAssets);
    }
  }, [fetchedAssets]);

  useEffect(() => {
    if (fetchedSettings) {
      setSettings(fetchedSettings);
    }
  }, [fetchedSettings]);

  const handleEditAsset = (asset: MarketAsset) => {
    setSelectedAsset(asset);
    setAssetForm(asset);
    setIsAssetModalOpen(true);
  };

  const handleCreateAsset = () => {
    setSelectedAsset(null);
    setAssetForm({
      symbol: '',
      name: '',
      currentPrice: 100,
      volatility: 0.02,
      trend: 0,
      volume: 1000,
      isActive: true,
    });
    setIsAssetModalOpen(true);
  };

  const handleSaveAsset = () => {
    if (selectedAsset) {
      updateAssetMutation.mutate({
        symbol: selectedAsset.symbol,
        data: assetForm,
      });
    } else {
      createAssetMutation.mutate(assetForm);
    }
  };

  const handleToggleAsset = async (symbol: string, isActive: boolean) => {
    try {
      await adminService.updateMarketAsset(symbol, { isActive: !isActive });
      queryClient.invalidateQueries({ queryKey: ['admin-market-assets'] });
      showToast(`Asset ${!isActive ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (error) {
      showToast('Failed to update asset status', 'error');
    }
  };

  const handleUpdateSettings = () => {
    updateSettingsMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Market Settings</h1>
          <p className="text-base-content/70 mt-1">
            Configure market parameters, assets, and trading conditions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsSettingsModalOpen(true)}>
            General Settings
          </Button>
          <Button onClick={handleCreateAsset}>
            Add New Asset
          </Button>
        </div>
      </div>

      {/* Market Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Market Volatility</div>
            <div className="stat-value">{(settings.volatility * 100).toFixed(1)}%</div>
            <div className="stat-desc">Current market volatility</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Market Trend</div>
            <div className={`stat-value ${settings.marketTrend > 0 ? 'text-success' : settings.marketTrend < 0 ? 'text-error' : ''}`}>
              {settings.marketTrend > 0 ? '+' : ''}{(settings.marketTrend * 100).toFixed(1)}%
            </div>
            <div className="stat-desc">Overall market direction</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Trading Status</div>
            <div className={`stat-value ${settings.tradingHours.enabled && !settings.maintenanceMode ? 'text-success' : 'text-error'}`}>
              {settings.maintenanceMode ? 'Maintenance' : settings.tradingHours.enabled ? 'Open' : 'Closed'}
            </div>
            <div className="stat-desc">
              {settings.tradingHours.enabled && !settings.maintenanceMode && 
                `Hours: ${settings.tradingHours.start} - ${settings.tradingHours.end}`}
            </div>
          </div>
        </Card>
      </div>

      {/* Assets Table */}
      <Card>
        <div className="card-body">
          <h3 className="card-title">Trading Assets</h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Current Price</th>
                  <th>Volatility</th>
                  <th>Trend</th>
                  <th>Volume</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.symbol}>
                    <td className="font-mono font-bold">{asset.symbol}</td>
                    <td>{asset.name}</td>
                    <td className="font-mono">${asset.currentPrice.toFixed(2)}</td>
                    <td>{(asset.volatility * 100).toFixed(1)}%</td>
                    <td className={asset.trend > 0 ? 'text-success' : asset.trend < 0 ? 'text-error' : ''}>
                      {asset.trend > 0 ? '+' : ''}{(asset.trend * 100).toFixed(1)}%
                    </td>
                    <td>{asset.volume.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${asset.isActive ? 'badge-success' : 'badge-error'}`}>
                        {asset.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-xs btn-info"
                          onClick={() => handleEditAsset(asset)}
                        >
                          Edit
                        </button>
                        <button
                          className={`btn btn-xs ${asset.isActive ? 'btn-error' : 'btn-success'}`}
                          onClick={() => handleToggleAsset(asset.symbol, asset.isActive)}
                        >
                          {asset.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Asset Modal */}
      <Modal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        title={selectedAsset ? 'Edit Asset' : 'Create New Asset'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">Symbol *</label>
              <input
                type="text"
                className="input input-bordered"
                value={assetForm.symbol}
                onChange={(e) => setAssetForm({ ...assetForm, symbol: e.target.value.toUpperCase() })}
                placeholder="e.g., AAC"
                disabled={!!selectedAsset}
              />
            </div>
            <div className="form-control">
              <label className="label">Name</label>
              <input
                type="text"
                className="input input-bordered"
                value={assetForm.name}
                onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                placeholder="Asset Name"
              />
            </div>
            <div className="form-control">
              <label className="label">Current Price ($)</label>
              <input
                type="number"
                className="input input-bordered"
                value={assetForm.currentPrice}
                onChange={(e) => setAssetForm({ ...assetForm, currentPrice: parseFloat(e.target.value) })}
                step="0.01"
                min="0.01"
              />
            </div>
            <div className="form-control">
              <label className="label">Volatility (%)</label>
              <input
                type="number"
                className="input input-bordered"
                value={assetForm.volatility ? assetForm.volatility * 100 : 2}
                onChange={(e) => setAssetForm({ ...assetForm, volatility: parseFloat(e.target.value) / 100 })}
                step="0.1"
                min="0"
                max="50"
              />
              <label className="label-text-alt">Current: {(assetForm.volatility || 0) * 100}%</label>
            </div>
            <div className="form-control">
              <label className="label">Trend (%)</label>
              <input
                type="number"
                className="input input-bordered"
                value={assetForm.trend ? assetForm.trend * 100 : 0}
                onChange={(e) => setAssetForm({ ...assetForm, trend: parseFloat(e.target.value) / 100 })}
                step="0.1"
                min="-10"
                max="10"
              />
            </div>
            <div className="form-control">
              <label className="label">Volume</label>
              <input
                type="number"
                className="input input-bordered"
                value={assetForm.volume}
                onChange={(e) => setAssetForm({ ...assetForm, volume: parseInt(e.target.value) })}
                step="100"
                min="0"
              />
            </div>
            <div className="form-control col-span-2">
              <label className="cursor-pointer label">
                <span className="label-text">Active</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={assetForm.isActive}
                  onChange={(e) => setAssetForm({ ...assetForm, isActive: e.target.checked })}
                />
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="secondary" onClick={() => setIsAssetModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsset} isLoading={updateAssetMutation.isPending || createAssetMutation.isPending}>
              {selectedAsset ? 'Update Asset' : 'Create Asset'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Market Settings"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">Global Volatility (%)</label>
              <input
                type="number"
                className="input input-bordered"
                value={settings.volatility * 100}
                onChange={(e) => setSettings({ ...settings, volatility: parseFloat(e.target.value) / 100 })}
                step="0.1"
                min={settings.minVolatility * 100}
                max={settings.maxVolatility * 100}
              />
              <label className="label-text-alt">Range: {settings.minVolatility * 100}% - {settings.maxVolatility * 100}%</label>
            </div>
            <div className="form-control">
              <label className="label">Global Trend (%)</label>
              <input
                type="number"
                className="input input-bordered"
                value={settings.marketTrend * 100}
                onChange={(e) => setSettings({ ...settings, marketTrend: parseFloat(e.target.value) / 100 })}
                step="0.1"
                min={settings.minTrend * 100}
                max={settings.maxTrend * 100}
              />
            </div>
            <div className="form-control">
              <label className="label">Trading Hours Start</label>
              <input
                type="time"
                className="input input-bordered"
                value={settings.tradingHours.start}
                onChange={(e) => setSettings({
                  ...settings,
                  tradingHours: { ...settings.tradingHours, start: e.target.value }
                })}
              />
            </div>
            <div className="form-control">
              <label className="label">Trading Hours End</label>
              <input
                type="time"
                className="input input-bordered"
                value={settings.tradingHours.end}
                onChange={(e) => setSettings({
                  ...settings,
                  tradingHours: { ...settings.tradingHours, end: e.target.value }
                })}
              />
            </div>
            <div className="form-control col-span-2">
              <label className="cursor-pointer label">
                <span className="label-text">Enable Trading Hours</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={settings.tradingHours.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    tradingHours: { ...settings.tradingHours, enabled: e.target.checked }
                  })}
                />
              </label>
            </div>
            <div className="form-control col-span-2">
              <label className="cursor-pointer label">
                <span className="label-text">Maintenance Mode</span>
                <input
                  type="checkbox"
                  className="toggle toggle-warning"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                />
              </label>
            </div>
            {settings.maintenanceMode && (
              <div className="form-control col-span-2">
                <label className="label">Maintenance Message</label>
                <textarea
                  className="textarea textarea-bordered"
                  rows={3}
                  value={settings.maintenanceMessage}
                  onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                />
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="secondary" onClick={() => setIsSettingsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSettings} isLoading={updateSettingsMutation.isPending}>
              Save Settings
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MarketSettings;