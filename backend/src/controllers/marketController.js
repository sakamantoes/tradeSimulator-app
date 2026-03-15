import { MarketAsset, AdminSetting, Trade } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

// Get all active assets
export const getAssets = async (req, res) => {
  try {
    const assets = await MarketAsset.findAll({
      where: { isActive: true }
    });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single asset price
export const getAssetPrice = async (req, res) => {
  try {
    const { symbol } = req.params;
    const asset = await MarketAsset.findByPk(symbol);
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    res.json({ 
      symbol: asset.symbol,
      price: asset.currentPrice,
      change: asset.trend,
      volume: asset.volume
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get multiple assets prices
export const getAllPrices = async (req, res) => {
  try {
    const assets = await MarketAsset.findAll({
      where: { isActive: true },
      attributes: ['symbol', 'currentPrice', 'trend', 'volume', 'volatility']
    });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get historical data for chart
export const getHistoricalData = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1m', limit = 100 } = req.query;
    
    // In a real implementation, you'd have a PriceHistory table
    // For demo, we'll generate simulated historical data
    
    const asset = await MarketAsset.findByPk(symbol);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    const historicalData = [];
    let price = parseFloat(asset.currentPrice) * 0.9; // Start 10% lower
    
    for (let i = 0; i < limit; i++) {
      const volatility = parseFloat(asset.volatility);
      const trend = parseFloat(asset.trend);
      const random = (Math.random() - 0.5) * 2 * volatility;
      const change = trend + random;
      price = price * (1 + change);
      
      historicalData.push({
        time: Date.now() - (limit - i) * 60000, // minutes ago
        open: price * (1 - Math.random() * 0.01),
        high: price * (1 + Math.random() * 0.02),
        low: price * (1 - Math.random() * 0.02),
        close: price,
        volume: Math.floor(Math.random() * 10000) + 1000
      });
    }
    
    res.json(historicalData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get market summary
export const getMarketSummary = async (req, res) => {
  try {
    const assets = await MarketAsset.findAll({ where: { isActive: true } });
    
    const totalVolume = assets.reduce((sum, a) => sum + parseInt(a.volume), 0);
    const avgVolatility = assets.reduce((sum, a) => sum + parseFloat(a.volatility), 0) / assets.length;
    
    // Count assets with positive trend
    const bullishCount = assets.filter(a => parseFloat(a.trend) > 0).length;
    const bearishCount = assets.filter(a => parseFloat(a.trend) < 0).length;
    
    // Get 24h change (simulated)
    const changes = assets.map(a => ({
      symbol: a.symbol,
      change: (Math.random() * 10 - 5) // -5% to +5%
    }));
    
    res.json({
      totalAssets: assets.length,
      totalVolume,
      avgVolatility,
      marketSentiment: bullishCount > bearishCount ? 'BULLISH' : 'BEARISH',
      bullishCount,
      bearishCount,
      topGainers: changes.sort((a, b) => b.change - a.change).slice(0, 3),
      topLosers: changes.sort((a, b) => a.change - b.change).slice(0, 3)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get market news (simulated)
export const getMarketNews = async (req, res) => {
  try {
    const news = [
      {
        id: 1,
        title: 'AAC Shows Strong Bullish Momentum',
        summary: 'Trading volume surges as new partnerships announced',
        source: 'Crypto Insider',
        time: new Date(Date.now() - 2 * 3600000).toISOString(),
        sentiment: 'positive'
      },
      {
        id: 2,
        title: 'Market Volatility Expected to Increase',
        summary: 'Analysts predict higher price swings in coming days',
        source: 'Trade News',
        time: new Date(Date.now() - 5 * 3600000).toISOString(),
        sentiment: 'neutral'
      },
      {
        id: 3,
        title: 'TBC Faces Resistance at Key Level',
        summary: 'Price struggles to break through $150 mark',
        source: 'Market Watch',
        time: new Date(Date.now() - 8 * 3600000).toISOString(),
        sentiment: 'negative'
      }
    ];
    
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== ADMIN CONTROLLERS ==========

// Create new asset (admin)
export const createAsset = async (req, res) => {
  try {
    const { symbol, name, currentPrice, volatility, trend, volume } = req.body;
    
    const existing = await MarketAsset.findByPk(symbol);
    if (existing) {
      return res.status(400).json({ message: 'Asset with this symbol already exists' });
    }
    
    const asset = await MarketAsset.create({
      symbol,
      name: name || symbol,
      currentPrice: currentPrice || 100,
      volatility: volatility || 0.02,
      trend: trend || 0,
      volume: volume || 1000,
      isActive: true
    });
    
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update asset (admin)
export const updateAsset = async (req, res) => {
  try {
    const { symbol } = req.params;
    const updates = req.body;
    
    const asset = await MarketAsset.findByPk(symbol);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    await asset.update(updates);
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete asset (admin) - soft delete by setting isActive false
export const deleteAsset = async (req, res) => {
  try {
    const { symbol } = req.params;
    const asset = await MarketAsset.findByPk(symbol);
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    asset.isActive = false;
    await asset.save();
    
    res.json({ message: 'Asset deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk update assets (admin) - for market manipulation
export const bulkUpdateAssets = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { symbol, volatility, trend, etc }
    
    const results = [];
    for (const update of updates) {
      const asset = await MarketAsset.findByPk(update.symbol);
      if (asset) {
        await asset.update(update);
        results.push(asset);
      }
    }
    
    res.json({ 
      message: `Updated ${results.length} assets`,
      updated: results 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Set market volatility (admin)
export const setMarketVolatility = async (req, res) => {
  try {
    const { volatility } = req.body;
    
    await MarketAsset.update(
      { volatility },
      { where: { isActive: true } }
    );
    
    res.json({ message: `Market volatility set to ${volatility}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Set market trend (admin)
export const setMarketTrend = async (req, res) => {
  try {
    const { trend } = req.body;
    
    await MarketAsset.update(
      { trend },
      { where: { isActive: true } }
    );
    
    res.json({ message: `Market trend set to ${trend}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get market statistics (admin)
export const getMarketStats = async (req, res) => {
  try {
    const assets = await MarketAsset.findAll();
    
    const openTrades = await Trade.count({ where: { status: 'open' } });
    const closedTrades = await Trade.count({ where: { status: 'closed' } });
    
    const stats = {
      totalAssets: assets.length,
      activeAssets: assets.filter(a => a.isActive).length,
      averagePrice: assets.reduce((sum, a) => sum + parseFloat(a.currentPrice), 0) / assets.length,
      totalVolume: assets.reduce((sum, a) => sum + parseInt(a.volume), 0),
      openTrades,
      closedTrades,
      assets: assets.map(a => ({
        symbol: a.symbol,
        price: a.currentPrice,
        volatility: a.volatility,
        trend: a.trend,
        volume: a.volume,
        isActive: a.isActive
      }))
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};