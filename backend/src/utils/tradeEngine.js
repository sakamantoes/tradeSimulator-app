import { MarketAsset, Trade, Wallet, TransactionLog } from '../models/index.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';
import { generatePriceMovement, calculateTradeResult } from './helpers.js';

// Simulate price movement for an asset
export const simulatePrice = (asset) => {
  const volatility = asset.volatility;
  const trend = asset.trend;
  const random = (Math.random() - 0.5) * 2 * volatility; // -volatility to +volatility
  const change = trend + random;
  const newPrice = asset.currentPrice * (1 + change);
  return Math.max(newPrice, 0.01); // prevent zero or negative
};

// Update all asset prices (run every second for real-time)
export const updateMarketPrices = async () => {
  const assets = await MarketAsset.findAll({ where: { isActive: true } });
  for (const asset of assets) {
    const newPrice = simulatePrice(asset);
    asset.currentPrice = newPrice;
    await asset.save();
  }
};

// Process open trades
export const processOpenTrades = async () => {
  const now = new Date();
  const openTrades = await Trade.findAll({
    where: {
      status: 'open',
      expiresAt: { [Op.lte]: now },
    },
  });

  for (const trade of openTrades) {
    const asset = await MarketAsset.findByPk(trade.asset);
    if (!asset) continue;

    const closePrice = asset.currentPrice;
    const openPrice = trade.openPrice;
    const { result, profit } = calculateTradeResult(trade.amount, trade.prediction, openPrice, closePrice);

    await sequelize.transaction(async (t) => {
      trade.result = result;
      trade.closePrice = closePrice;
      trade.profit = profit;
      trade.status = 'closed';
      await trade.save({ transaction: t });

      const wallet = await Wallet.findOne({ where: { userId: trade.userId }, transaction: t });
      if (result === 'win') {
        wallet.balance = parseFloat(wallet.balance) + parseFloat(profit);
      } else {
        wallet.balance = parseFloat(wallet.balance) - parseFloat(trade.amount);
      }
      await wallet.save({ transaction: t });

      await TransactionLog.create({
        userId: trade.userId,
        type: 'trade',
        amount: result === 'win' ? profit : -trade.amount,
        balanceAfter: wallet.balance,
        description: `Trade ${trade.asset} ${trade.prediction} ${result}`,
      }, { transaction: t });
    });
  }
};

// Start background jobs
export const startMarketEngine = () => {
  // Update prices every second
  setInterval(updateMarketPrices, 1000);
  // Process trades every second
  setInterval(processOpenTrades, 1000);
};