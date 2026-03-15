import { User, Deposit, Withdrawal, AdminSetting, MarketAsset, Wallet } from '../models/index.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ include: ['Wallet'] });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserBalance = async (req, res) => {
  try {
    const { userId } = req.params;
    const { balance } = req.body;
    const wallet = await Wallet.findOne({ where: { userId } });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    wallet.balance = balance;
    await wallet.save();
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    const [setting, created] = await AdminSetting.upsert({ key, value });
    res.json({setting, created});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createMarketAsset = async (req, res) => {
  try {
    const asset = await MarketAsset.create(req.body);
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};