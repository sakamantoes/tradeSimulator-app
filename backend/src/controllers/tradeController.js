import mongoose from 'mongoose';
import { Trade, Wallet, MarketAsset, TransactionLog, AdminSetting } from '../models/index.js';

const getSetting = async (key, defaultValue) => {
  const setting = await AdminSetting.findOne({ key });
  return setting ? parseFloat(setting.value) : defaultValue;
};

export const openTrade = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { asset, amount, prediction, duration } = req.body;
    const userId = req.user.id;

    const marketAsset = await MarketAsset.findOne({ symbol: asset }).session(session);
    if (!marketAsset || !marketAsset.isActive) return res.status(400).json({ message: 'Invalid asset' });

    const wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet || parseFloat(wallet.balance) < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const maxOpenTrades = await getSetting('max_open_trades', 5);
    const openTradesCount = await Trade.countDocuments({ userId, status: 'open' }).session(session);
    if (openTradesCount >= maxOpenTrades) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Maximum open trades reached' });
    }

    const openPrice = marketAsset.currentPrice;
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);

    wallet.balance = parseFloat(wallet.balance) - amount;
    await wallet.save({ session });

    const newTrade = await Trade.create([{
      userId,
      asset,
      amount,
      prediction,
      openPrice,
      duration,
      expiresAt,
    }], { session });

    await TransactionLog.create([{
      userId,
      type: 'trade_open',
      amount: -amount,
      balanceAfter: wallet.balance,
      description: `Opened trade ${asset} ${prediction} $${amount}`,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(newTrade[0]);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

export const getUserTrades = async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json(trades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllTrades = async (req, res) => {
  try {
    const trades = await Trade.find().populate('userId', 'id email fullName');
    res.json(trades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
