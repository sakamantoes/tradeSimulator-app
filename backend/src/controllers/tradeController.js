import { Trade, Wallet, MarketAsset, TransactionLog } from '../models/index.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';

export const openTrade = async (req, res) => {
  try {
    const { asset, amount, prediction, duration } = req.body;
    const userId = req.user.id;

    // Validate asset
    const marketAsset = await MarketAsset.findByPk(asset);
    if (!marketAsset || !marketAsset.isActive) {
      return res.status(400).json({ message: 'Invalid asset' });
    }

    // Check balance
    const wallet = await Wallet.findOne({ where: { userId } });
    if (parseFloat(wallet.balance) < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Check max open trades (admin setting)
    const maxOpenTrades = await getAdminSetting('max_open_trades') || 5;
    const openTradesCount = await Trade.count({ where: { userId, status: 'open' } });
    if (openTradesCount >= maxOpenTrades) {
      return res.status(400).json({ message: 'Maximum open trades reached' });
    }

    // Get current price
    const openPrice = marketAsset.currentPrice;

    // Calculate expiry
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);

    const trade = await sequelize.transaction(async (t) => {
      // Deduct amount from wallet (locked until trade ends)
      wallet.balance = parseFloat(wallet.balance) - amount;
      await wallet.save({ transaction: t });

      const newTrade = await Trade.create({
        userId,
        asset,
        amount,
        prediction,
        openPrice,
        duration,
        expiresAt,
      }, { transaction: t });

      await TransactionLog.create({
        userId,
        type: 'trade_open',
        amount: -amount,
        balanceAfter: wallet.balance,
        description: `Opened trade ${asset} ${prediction} $${amount}`,
      }, { transaction: t });

      return newTrade;
    });

    res.status(201).json(trade);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserTrades = async (req, res) => {
  try {
    const trades = await Trade.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    res.json(trades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: get all trades
export const getAllTrades = async (req, res) => {
  try {
    const trades = await Trade.findAll({ include: ['User'] });
    res.json(trades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};