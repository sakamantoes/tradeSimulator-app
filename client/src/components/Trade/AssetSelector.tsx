import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MarketAsset } from '@/types/market';
import { ChevronDown, TrendingUp, TrendingDown, Star } from 'lucide-react';

interface AssetSelectorProps {
  assets: MarketAsset[];
  selectedAsset: string;
  onAssetChange: (symbol: string) => void;
  isLoading?: boolean;
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  assets,
  selectedAsset,
  onAssetChange,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorite_assets');
    return saved ? JSON.parse(saved) : ['AAC', 'BTC'];
  });

  const selectedAssetData = assets.find(a => a.symbol === selectedAsset);

  // Filter assets based on search
  const filteredAssets = assets.filter(asset =>
    asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group assets: favorites first, then others
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    const aIsFavorite = favorites.includes(a.symbol);
    const bIsFavorite = favorites.includes(b.symbol);
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0;
  });

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = favorites.includes(symbol)
      ? favorites.filter(f => f !== symbol)
      : [...favorites, symbol];
    setFavorites(newFavorites);
    localStorage.setItem('favorite_assets', JSON.stringify(newFavorites));
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-success';
    if (change < 0) return 'text-error';
    return 'text-base-content';
  };

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  if (isLoading) {
    return (
      <div className="card bg-base-200">
        <div className="card-body p-4">
          <div className="skeleton h-12 w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Selected Asset Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 bg-base-200 rounded-xl hover:bg-base-300 transition-all duration-200 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold">
              {selectedAssetData?.symbol.charAt(0) || '?'}
            </span>
          </div>
          <div className="text-left">
            <div className="font-bold text-lg">{selectedAssetData?.symbol}</div>
            <div className="text-sm text-base-content/60">{selectedAssetData?.name}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold">${selectedAssetData?.currentPrice.toFixed(2)}</div>
          {selectedAssetData?.trend !== undefined && (
            <div className={`text-sm flex items-center gap-1 ${getPriceChangeColor(selectedAssetData.trend)}`}>
              {getPriceChangeIcon(selectedAssetData.trend)}
              <span>{Math.abs(selectedAssetData.trend * 100).toFixed(2)}%</span>
            </div>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-2 bg-base-200 rounded-xl shadow-2xl border border-base-300 overflow-hidden"
            >
              {/* Search Bar */}
              <div className="p-3 border-b border-base-300">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input input-bordered w-full pl-10"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Assets List */}
              <div className="max-h-96 overflow-y-auto">
                {sortedAssets.length === 0 ? (
                  <div className="p-8 text-center text-base-content/60">
                    No assets found
                  </div>
                ) : (
                  sortedAssets.map((asset) => (
                    <button
                      key={asset.symbol}
                      onClick={() => {
                        onAssetChange(asset.symbol);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={`w-full p-3 hover:bg-base-300 transition-all duration-150 flex items-center justify-between group ${
                        selectedAsset === asset.symbol ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => toggleFavorite(asset.symbol, e)}
                          className="text-base-content/40 hover:text-warning transition-colors"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              favorites.includes(asset.symbol) ? 'fill-warning text-warning' : ''
                            }`}
                          />
                        </button>
                        <div>
                          <div className="font-medium">{asset.symbol}</div>
                          <div className="text-xs text-base-content/60">{asset.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">${asset.currentPrice.toFixed(2)}</div>
                        {asset.trend !== undefined && (
                          <div className={`text-xs flex items-center gap-1 ${getPriceChangeColor(asset.trend)}`}>
                            {getPriceChangeIcon(asset.trend)}
                            <span>{Math.abs(asset.trend * 100).toFixed(2)}%</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-base-300 text-xs text-center text-base-content/60">
                Real-time simulated prices • Updated every second
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};