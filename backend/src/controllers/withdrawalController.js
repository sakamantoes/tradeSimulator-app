import mongoose from 'mongoose';
import { Withdrawal, Wallet, User, AdminSetting, TransactionLog } from '../models/index.js';
import { sendEmail } from '../utils/emailService.js';

const getSetting = async (key, defaultValue) => {
  const setting = await AdminSetting.findOne({ key });
  return setting ? parseFloat(setting.value) : defaultValue;
};

export const requestWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, currency, walletAddress } = req.body;
    const userId = req.user.id;

    const minWithdrawal = await getSetting('min_withdrawal', 30);
    if (amount < minWithdrawal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: `Minimum withdrawal is $${minWithdrawal}` });
    }

    const wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet || parseFloat(wallet.balance) < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const pendingWithdrawal = await Withdrawal.findOne({ userId, status: 'pending' }).session(session);
    if (pendingWithdrawal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'You have a pending withdrawal request' });
    }

    const withdrawalFeePercent = await getSetting('withdrawal_fee', 0.5);
    const fee = (amount * withdrawalFeePercent) / 100;
    const netAmount = amount - fee;

    wallet.balance = parseFloat(wallet.balance) - amount;
    await wallet.save({ session });

    const newWithdrawal = await Withdrawal.create([{
      userId,
      amount,
      currency,
      walletAddress,
      fee,
      netAmount,
      status: 'pending',
    }], { session });

    await TransactionLog.create([{
      userId,
      type: 'withdrawal_request',
      amount: -amount,
      balanceAfter: wallet.balance,
      description: `Withdrawal request: $${amount} to ${walletAddress}`
    }], { session });

    await session.commitTransaction();
    session.endSession();

    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      await sendEmail({
        to: admin.email,
        subject: 'New Withdrawal Request',
        html: `<p>User ${req.user.email} requested withdrawal of $${amount} to ${walletAddress}</p>`,
      });
    }

    await sendEmail({
      to: req.user.email,
      subject: 'Withdrawal Request Received',
      html: `<p>Your withdrawal request of $${amount} has been received and is pending approval.</p>`,
    });

    res.status(201).json(newWithdrawal[0]);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

export const getUserWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const withdrawal = await Withdrawal.findOne({ _id: id, userId: req.user.id, status: 'pending' }).session(session);
    if (!withdrawal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Withdrawal not found or cannot be cancelled' });
    }

    const wallet = await Wallet.findOne({ userId: req.user.id }).session(session);
    wallet.balance = (wallet.balance || 0) + (withdrawal.amount || 0);
    await wallet.save({ session });

    withdrawal.status = 'cancelled';
    await withdrawal.save({ session });

    await TransactionLog.create([{
      userId: req.user.id,
      type: 'withdrawal_cancelled',
      amount: withdrawal.amount,
      balanceAfter: wallet.balance,
      description: `Withdrawal cancelled: $${withdrawal.amount}`
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Withdrawal cancelled successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

export const getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find().populate('userId', 'id email fullName').sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPendingWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ status: 'pending' }).populate('userId', 'id email fullName').sort({ createdAt: 1 });
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { transactionId } = req.body;

    const withdrawal = await Withdrawal.findById(id).populate('userId').session(session);
    if (!withdrawal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Withdrawal is not pending' });
    }

    withdrawal.status = 'approved';
    withdrawal.transactionId = transactionId;
    withdrawal.processedAt = new Date();
    await withdrawal.save({ session });

    const wallet = await Wallet.findOne({ userId: withdrawal.userId._id }).session(session);
    wallet.totalWithdrawals = (wallet.totalWithdrawals || 0) + (withdrawal.amount || 0);
    await wallet.save({ session });

    await TransactionLog.create([{
      userId: withdrawal.userId._id,
      type: 'withdrawal_approved',
      amount: -withdrawal.amount,
      balanceAfter: wallet.balance,
      description: `Withdrawal approved: $${withdrawal.amount}`
    }], { session });

    await session.commitTransaction();
    session.endSession();

    await sendEmail({
      to: withdrawal.userId.email,
      subject: 'Withdrawal Approved',
      html: `<p>Your withdrawal of $${withdrawal.amount} has been approved and will be sent to your wallet shortly.</p>`,
    });

    res.json({ message: 'Withdrawal approved successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

export const rejectWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason } = req.body;

    const withdrawal = await Withdrawal.findById(id).populate('userId').session(session);
    if (!withdrawal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Withdrawal is not pending' });
    }

    const wallet = await Wallet.findOne({ userId: withdrawal.userId._id }).session(session);
    wallet.balance = (wallet.balance || 0) + (withdrawal.amount || 0);
    await wallet.save({ session });

    withdrawal.status = 'rejected';
    withdrawal.rejectionReason = reason;
    await withdrawal.save({ session });

    await TransactionLog.create([{
      userId: withdrawal.userId._id,
      type: 'withdrawal_rejected',
      amount: withdrawal.amount,
      balanceAfter: wallet.balance,
      description: `Withdrawal rejected: $${withdrawal.amount}. Reason: ${reason || 'Not specified'}`
    }], { session });

    await session.commitTransaction();
    session.endSession();

    await sendEmail({
      to: withdrawal.userId.email,
      subject: 'Withdrawal Rejected',
      html: `<p>Your withdrawal of $${withdrawal.amount} has been rejected.</p><p>Reason: ${reason || 'Not specified'}</p><p>The amount has been returned to your trading balance.</p>`,
    });

    res.json({ message: 'Withdrawal rejected successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

export const completeWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionHash } = req.body;

    const withdrawal = await Withdrawal.findById(id).populate('userId');
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });
    if (withdrawal.status !== 'approved') return res.status(400).json({ message: 'Withdrawal must be approved first' });

    withdrawal.status = 'completed';
    withdrawal.transactionHash = transactionHash;
    withdrawal.completedAt = new Date();
    await withdrawal.save();

    await sendEmail({
      to: withdrawal.userId.email,
      subject: 'Withdrawal Completed',
      html: `<p>Your withdrawal of $${withdrawal.amount} has been sent to your wallet.</p><p>Transaction Hash: ${transactionHash}</p>`,
    });

    res.json({ message: 'Withdrawal marked as completed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateWithdrawalSettings = async (req, res) => {
  try {
    const { minWithdrawal, withdrawalFee, autoApprove } = req.body;

    if (minWithdrawal !== undefined) {
      await AdminSetting.findOneAndUpdate({ key: 'min_withdrawal' }, { value: minWithdrawal.toString() }, { upsert: true, new: true });
    }

    if (withdrawalFee !== undefined) {
      await AdminSetting.findOneAndUpdate({ key: 'withdrawal_fee' }, { value: withdrawalFee.toString() }, { upsert: true, new: true });
    }

    if (autoApprove !== undefined) {
      await AdminSetting.findOneAndUpdate({ key: 'auto_approve_withdrawals' }, { value: autoApprove.toString() }, { upsert: true, new: true });
    }

    res.json({ message: 'Withdrawal settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
