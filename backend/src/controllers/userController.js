import mongoose from 'mongoose';
import { User, Wallet, TransactionLog, Trade } from '../models/index.js';
import { sendEmail } from '../utils/emailService.js';
import { generateRandomString, formatPercentage } from '../utils/helpers.js';
import { authConfig } from '../config/auth.js';

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user.id });
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTransactionHistory = async (req, res) => {
  try {
    const transactions = await TransactionLog.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (fullName) user.fullName = fullName;
    await user.save();

    res.json({ id: user._id, email: user.email, fullName: user.fullName, role: user.role, accountLevel: user.accountLevel });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Password Changed',
      html: '<p>Your password has been changed successfully. If this wasn\'t you, please contact support immediately.</p>',
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const totalTrades = await Trade.countDocuments({ userId });
    const wins = await Trade.countDocuments({ userId, result: 'win' });
    const losses = await Trade.countDocuments({ userId, result: 'loss' });
    const winRate = totalTrades > 0 ? formatPercentage(wins / totalTrades) : '0%';

    const profitAgg = await Trade.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId), result: 'win' } },
      { $group: { _id: null, total: { $sum: '$profit' } } }
    ]);

    const lossAgg = await Trade.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId), result: 'loss' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalProfit = (profitAgg[0] && profitAgg[0].total) || 0;
    const totalLoss = (lossAgg[0] && lossAgg[0].total) || 0;

    res.json({ totalTrades, wins, losses, winRate, totalProfit, totalLoss, netProfit: totalProfit - totalLoss });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const requestAccountDeletion = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = generateRandomString(32);
    user.deletionToken = token;
    user.deletionExpires = new Date(Date.now() + authConfig.session.inactivityTimeout);
    await user.save();

    const deletionLink = `${process.env.FRONTEND_URL}/confirm-deletion?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Confirm Account Deletion',
      html: `<p>Click <a href="${deletionLink}">here</a> to confirm deletion of your account. This action cannot be undone and all your data will be permanently removed within 24 hours. If you didn't request this, please ignore this email.</p>`,
    });

    res.json({ message: 'Deletion confirmation email sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmAccountDeletion = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({ deletionToken: token, deletionExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    await user.remove();
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
