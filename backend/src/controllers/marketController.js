import { MarketAsset, AdminSetting, Trade } from '../models/index.js';

const getSetting = async (key, defaultValue) => {
  const setting = await AdminSetting.findOne({ key });
  return setting ? parseFloat(setting.value) : defaultValue;
};

export const getAssets = async (req, res) => {
  try {
    const assets = await MarketAsset.find({ isActive: true });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAssetPrice = async (req, res) => {
  try {
    const { symbol } = req.params;
    const asset = await MarketAsset.findOne({ symbol });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.json({ symbol: asset.symbol, price: asset.currentPrice, change: asset.trend, volume: asset.volume });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllPrices = async (req, res) => {
  try {
    const assets = await MarketAsset.find({ isActive: true }, 'symbol currentPrice trend volume volatility');
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHistoricalData = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1m', limit = 100 } = req.query;
    const asset = await MarketAsset.findOne({ symbol });
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const historicalData = [];
    let price = parseFloat(asset.currentPrice) * 0.9;
    for (let i = 0; i < limit; i++) {
      const volatility = parseFloat(asset.volatility);
      const trend = parseFloat(asset.trend);
      const random = (Math.random() - 0.5) * 2 * volatility;
      const change = trend + random;
      price = price * (1 + change);
      historicalData.push({
        time: Date.now() - (limit - i) * 60000,
        open: price * (1 - Math.random() * 0.01),
        high: price * (1 + Math.random() * 0.02),
        low: price * (1 - Math.random() * 0.02),
        close: price,
        volume: Math.floor(Math.random() * 10000) + 1000,
      });
    }
    res.json(historicalData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMarketSummary = async (req, res) => {
  try {
    const assets = await MarketAsset.find({ isActive: true });
    const totalVolume = assets.reduce((sum, a) => sum + (a.volume || 0), 0);
    const avgVolatility = assets.length ? assets.reduce((sum, a) => sum + (a.volatility || 0), 0) / assets.length : 0;
    const bullishCount = assets.filter(a => parseFloat(a.trend) > 0).length;
    const bearishCount = assets.filter(a => parseFloat(a.trend) < 0).length;
    const changes = assets.map(a => ({ symbol: a.symbol, change: (Math.random() * 10 - 5) }));

    res.json({
      totalAssets: assets.length,
      totalVolume,
      avgVolatility,
      marketSentiment: bullishCount > bearishCount ? 'BULLISH' : 'BEARISH',
      bullishCount,
      bearishCount,
      topGainers: changes.sort((a, b) => b.change - a.change).slice(0, 3),
      topLosers: changes.sort((a, b) => a.change - b.change).slice(0, 3),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAsset = async (req, res) => {
  try {
    const { symbol, name, currentPrice, volatility, trend, volume } = req.body;
    const existing = await MarketAsset.findOne({ symbol });
    if (existing) return res.status(400).json({ message: 'Asset with this symbol already exists' });

    const asset = await MarketAsset.create({
      symbol,
      name: name || symbol,
      currentPrice: currentPrice || 100,
      volatility: volatility || 0.02,
      trend: trend || 0,
      volume: volume || 1000,
      isActive: true,
    });
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAsset = async (req, res) => {
  try {
    const { symbol } = req.params;
    const updates = req.body;
    const asset = await MarketAsset.findOneAndUpdate({ symbol }, updates, { new: true });
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAsset = async (req, res) => {
  try {
    const { symbol } = req.params;
    const asset = await MarketAsset.findOne({ symbol });
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    asset.isActive = false;
    await asset.save();
    res.json({ message: 'Asset deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const bulkUpdateAssets = async (req, res) => {
  try {
    const { updates } = req.body;
    const result = [];
    for (const update of updates) {
      const asset = await MarketAsset.findOneAndUpdate({ symbol: update.symbol }, update, { new: true });
      if (asset) result.push(asset);
    }
    res.json({ message: `Updated ${result.length} assets`, updated: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const setMarketVolatility = async (req, res) => {
  try {
    const { volatility } = req.body;
    await MarketAsset.updateMany({ isActive: true }, { volatility });
    res.json({ message: `Market volatility set to ${volatility}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const setMarketTrend = async (req, res) => {
  try {
    const { trend } = req.body;
    await MarketAsset.updateMany({ isActive: true }, { trend });
    res.json({ message: `Market trend set to ${trend}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMarketStats = async (req, res) => {
  try {
    const assets = await MarketAsset.find();
    const openTrades = await Trade.countDocuments({ status: 'open' });
    const closedTrades = await Trade.countDocuments({ status: 'closed' });
    const stats = {
      totalAssets: assets.length,
      activeAssets: assets.filter(a => a.isActive).length,
      averagePrice: assets.length ? assets.reduce((sum, a) => sum + (a.currentPrice || 0), 0) / assets.length : 0,
      totalVolume: assets.reduce((sum, a) => sum + (a.volume || 0), 0),
      openTrades,
      closedTrades,
      assets: assets.map(a => ({
        symbol: a.symbol,
        price: a.currentPrice,
        volatility: a.volatility,
        trend: a.trend,
        volume: a.volume,
        isActive: a.isActive,
      })),
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
