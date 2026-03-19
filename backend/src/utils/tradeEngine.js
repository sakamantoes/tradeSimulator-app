import mongoose from 'mongoose';
import { MarketAsset, Trade, Wallet, TransactionLog } from '../models/index.js';
import { calculateTradeResult } from './helpers.js';

export const simulatePrice = (asset) => {
  const volatility = asset.volatility;
  const trend = asset.trend;
  const random = (Math.random() - 0.5) * 2 * volatility;
  const change = trend + random;
  const newPrice = asset.currentPrice * (1 + change);
  return Math.max(newPrice, 0.01);
};

export const updateMarketPrices = async () => {
  const assets = await MarketAsset.find({ isActive: true });
  for (const asset of assets) {
    asset.currentPrice = simulatePrice(asset);
    await asset.save();
  }
};

export const processOpenTrades = async () => {
  const now = new Date();
  const openTrades = await Trade.find({ status: 'open', expiresAt: { $lte: now } });

  for (const trade of openTrades) {
    const asset = await MarketAsset.findOne({ symbol: trade.asset });
    if (!asset) continue;

    const closePrice = asset.currentPrice;
    const openPrice = trade.openPrice;
    const { result, profit } = calculateTradeResult(trade.amount, trade.prediction, openPrice, closePrice);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      trade.result = result;
      trade.closePrice = closePrice;
      trade.profit = profit;
      trade.status = 'closed';
      await trade.save({ session });

      const wallet = await Wallet.findOne({ userId: trade.userId }).session(session);
      if (!wallet) throw new Error('Wallet not found');

      if (result === 'win') {
        wallet.balance = (wallet.balance || 0) + (profit || 0);
      } else {
        wallet.balance = (wallet.balance || 0) - (trade.amount || 0);
      }
      await wallet.save({ session });

      await TransactionLog.create([{
        userId: trade.userId,
        type: 'trade',
        amount: result === 'win' ? profit : -trade.amount,
        balanceAfter: wallet.balance,
        description: `Trade ${trade.asset} ${trade.prediction} ${result}`,
      }], { session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      console.error('Trade processing error', error);
    } finally {
      session.endSession();
    }
  }
};

export const startMarketEngine = () => {
  setInterval(updateMarketPrices, 1000);
  setInterval(processOpenTrades, 1000);
};
