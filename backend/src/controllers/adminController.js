import { User, Deposit, Withdrawal, AdminSetting, MarketAsset, Wallet } from '../models/index.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserBalance = async (req, res) => {
  try {
    const { userId } = req.params;
    const { balance } = req.body;
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
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
    const setting = await AdminSetting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.json({ setting, created: true });
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
