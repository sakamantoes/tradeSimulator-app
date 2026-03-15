import { Withdrawal, Wallet, User, AdminSetting, TransactionLog } from '../models/index.js';
import sequelize from '../config/database.js';
import { sendEmail } from '../utils/emailService.js';
import { Op } from 'sequelize';

// Request withdrawal
export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, currency, walletAddress } = req.body;
    const userId = req.user.id;

    // Validation
    const minWithdrawal = await AdminSetting.findByPk('min_withdrawal') || 30;
    if (amount < minWithdrawal) {
      return res.status(400).json({ message: `Minimum withdrawal is $${minWithdrawal}` });
    }

    const wallet = await Wallet.findOne({ where: { userId } });
    if (parseFloat(wallet.balance) < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Check if user has any pending withdrawals
    const pendingWithdrawal = await Withdrawal.findOne({ 
      where: { userId, status: 'pending' } 
    });
    if (pendingWithdrawal) {
      return res.status(400).json({ message: 'You have a pending withdrawal request' });
    }

    // Calculate fees
    const withdrawalFeePercent = await AdminSetting.findByPk('withdrawal_fee') || 0.5;
    const fee = (amount * withdrawalFeePercent) / 100;
    const netAmount = amount - fee;

    // Create withdrawal request
    const withdrawal = await sequelize.transaction(async (t) => {
      // Deduct from wallet
      wallet.balance = parseFloat(wallet.balance) - amount;
      await wallet.save({ transaction: t });

      const newWithdrawal = await Withdrawal.create({
        userId,
        amount,
        currency,
        walletAddress,
        fee,
        netAmount,
        status: 'pending'
      }, { transaction: t });

      await TransactionLog.create({
        userId,
        type: 'withdrawal_request',
        amount: -amount,
        balanceAfter: wallet.balance,
        description: `Withdrawal request: $${amount} to ${walletAddress}`
      }, { transaction: t });

      return newWithdrawal;
    });

    // Notify admin via email (optional)
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (admin) {
      await sendEmail({
        to: admin.email,
        subject: 'New Withdrawal Request',
        html: `<p>User ${req.user.email} requested withdrawal of $${amount} to ${walletAddress}</p>`
      });
    }

    // Notify user
    await sendEmail({
      to: req.user.email,
      subject: 'Withdrawal Request Received',
      html: `<p>Your withdrawal request of $${amount} has been received and is pending approval.</p>`
    });

    res.status(201).json(withdrawal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user withdrawals
export const getUserWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel withdrawal (if pending)
export const cancelWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const withdrawal = await Withdrawal.findOne({ 
      where: { id, userId: req.user.id, status: 'pending' } 
    });

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found or cannot be cancelled' });
    }

    await sequelize.transaction(async (t) => {
      // Refund to wallet
      const wallet = await Wallet.findOne({ where: { userId: req.user.id }, transaction: t });
      wallet.balance = parseFloat(wallet.balance) + parseFloat(withdrawal.amount);
      await wallet.save({ transaction: t });

      withdrawal.status = 'cancelled';
      await withdrawal.save({ transaction: t });

      await TransactionLog.create({
        userId: req.user.id,
        type: 'withdrawal_cancelled',
        amount: withdrawal.amount,
        balanceAfter: wallet.balance,
        description: `Withdrawal cancelled: $${withdrawal.amount}`
      }, { transaction: t });
    });

    res.json({ message: 'Withdrawal cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== ADMIN CONTROLLERS ==========

// Get all withdrawals (admin)
export const getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.findAll({
      include: [{
        model: User,
        attributes: ['id', 'email', 'fullName']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending withdrawals (admin)
export const getPendingWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.findAll({
      where: { status: 'pending' },
      include: [{
        model: User,
        attributes: ['id', 'email', 'fullName']
      }],
      order: [['createdAt', 'ASC']]
    });
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve withdrawal (admin)
export const approveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId } = req.body; // Optional blockchain transaction ID

    const withdrawal = await Withdrawal.findByPk(id, {
      include: ['User']
    });

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal is not pending' });
    }

    await sequelize.transaction(async (t) => {
      withdrawal.status = 'approved';
      withdrawal.transactionId = transactionId;
      withdrawal.processedAt = new Date();
      await withdrawal.save({ transaction: t });

      // Update user's total withdrawals
      const wallet = await Wallet.findOne({ 
        where: { userId: withdrawal.userId }, 
        transaction: t 
      });
      wallet.totalWithdrawals = parseFloat(wallet.totalWithdrawals) + parseFloat(withdrawal.amount);
      await wallet.save({ transaction: t });

      await TransactionLog.create({
        userId: withdrawal.userId,
        type: 'withdrawal_approved',
        amount: -withdrawal.amount,
        balanceAfter: wallet.balance,
        description: `Withdrawal approved: $${withdrawal.amount}`
      }, { transaction: t });
    });

    // Notify user
    await sendEmail({
      to: withdrawal.User.email,
      subject: 'Withdrawal Approved',
      html: `<p>Your withdrawal of $${withdrawal.amount} has been approved and will be sent to your wallet shortly.</p>`
    });

    res.json({ message: 'Withdrawal approved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject withdrawal (admin)
export const rejectWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const withdrawal = await Withdrawal.findByPk(id, {
      include: ['User']
    });

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal is not pending' });
    }

    await sequelize.transaction(async (t) => {
      // Refund to wallet
      const wallet = await Wallet.findOne({ 
        where: { userId: withdrawal.userId }, 
        transaction: t 
      });
      wallet.balance = parseFloat(wallet.balance) + parseFloat(withdrawal.amount);
      await wallet.save({ transaction: t });

      withdrawal.status = 'rejected';
      withdrawal.rejectionReason = reason;
      await withdrawal.save({ transaction: t });

      await TransactionLog.create({
        userId: withdrawal.userId,
        type: 'withdrawal_rejected',
        amount: withdrawal.amount,
        balanceAfter: wallet.balance,
        description: `Withdrawal rejected: $${withdrawal.amount}. Reason: ${reason || 'Not specified'}`
      }, { transaction: t });
    });

    // Notify user
    await sendEmail({
      to: withdrawal.User.email,
      subject: 'Withdrawal Rejected',
      html: `<p>Your withdrawal of $${withdrawal.amount} has been rejected.</p>
             <p>Reason: ${reason || 'Not specified'}</p>
             <p>The amount has been returned to your trading balance.</p>`
    });

    res.json({ message: 'Withdrawal rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark as completed (admin) - after sending crypto
export const completeWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionHash } = req.body;

    const withdrawal = await Withdrawal.findByPk(id, {
      include: ['User']
    });

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'approved') {
      return res.status(400).json({ message: 'Withdrawal must be approved first' });
    }

    withdrawal.status = 'completed';
    withdrawal.transactionHash = transactionHash;
    withdrawal.completedAt = new Date();
    await withdrawal.save();

    // Notify user
    await sendEmail({
      to: withdrawal.User.email,
      subject: 'Withdrawal Completed',
      html: `<p>Your withdrawal of $${withdrawal.amount} has been sent to your wallet.</p>
             <p>Transaction Hash: ${transactionHash}</p>`
    });

    res.json({ message: 'Withdrawal marked as completed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update withdrawal settings (admin)
export const updateWithdrawalSettings = async (req, res) => {
  try {
    const { minWithdrawal, withdrawalFee, autoApprove } = req.body;

    if (minWithdrawal) {
      await AdminSetting.upsert({ key: 'min_withdrawal', value: minWithdrawal.toString() });
    }
    if (withdrawalFee) {
      await AdminSetting.upsert({ key: 'withdrawal_fee', value: withdrawalFee.toString() });
    }
    if (autoApprove !== undefined) {
      await AdminSetting.upsert({ key: 'auto_approve_withdrawals', value: autoApprove.toString() });
    }

    res.json({ message: 'Withdrawal settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};