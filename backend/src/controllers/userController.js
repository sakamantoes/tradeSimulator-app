import { User, Wallet, TransactionLog, Trade } from '../models/index.js';
import { sendEmail } from '../utils/emailService.js';
import { generateRandomString, formatPercentage } from '../utils/helpers.js';
import { authConfig } from '../config/auth.js';

// Get current user profile
export const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: ['Wallet']
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user wallet
export const getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get transaction history
export const getTransactionHistory = async (req, res) => {
  try {
    const transactions = await TransactionLog.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { fullName } = req.body;
    const user = await User.findByPk(req.user.id);
    
    if (fullName) user.fullName = fullName;
    
    await user.save();
    
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      accountLevel: user.accountLevel
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    // Send notification email
    await sendEmail({
      to: user.email,
      subject: 'Password Changed',
      html: '<p>Your password has been changed successfully. If this wasn\'t you, please contact support immediately.</p>'
    });
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const totalTrades = await Trade.count({ where: { userId } });
    const wins = await Trade.count({ where: { userId, result: 'win' } });
    const losses = await Trade.count({ where: { userId, result: 'loss' } });
    
    const winRate = totalTrades > 0 ? formatPercentage(wins / totalTrades) : '0%';
    
    const totalProfit = await Trade.sum('profit', { 
      where: { userId, result: 'win' } 
    }) || 0;
    
    const totalLoss = await Trade.sum('amount', { 
      where: { userId, result: 'loss' } 
    }) || 0;
    
    res.json({
      totalTrades,
      wins,
      losses,
      winRate,
      totalProfit,
      totalLoss,
      netProfit: totalProfit - totalLoss
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Request account deletion
export const requestAccountDeletion = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const token = generateRandomString(32);
    
    // Store deletion token in user record (you'd need to add this field)
    user.deletionToken = token;
    user.deletionExpires = new Date(Date.now() + authConfig.session.inactivityTimeout);
    await user.save();
    
    const deletionLink = `${process.env.FRONTEND_URL}/confirm-deletion?token=${token}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Confirm Account Deletion',
      html: `<p>Click <a href="${deletionLink}">here</a> to confirm deletion of your account. This action cannot be undone and all your data will be permanently removed within 24 hours. If you didn't request this, please ignore this email.</p>`
    });
    
    res.json({ message: 'Deletion confirmation email sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Confirm account deletion
export const confirmAccountDeletion = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({ 
      where: { 
        deletionToken: token,
        deletionExpires: { [Op.gt]: new Date() }
      } 
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Soft delete or hard delete - here we'll hard delete
    await user.destroy();
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};