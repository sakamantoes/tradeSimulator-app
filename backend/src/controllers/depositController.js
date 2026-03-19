import mongoose from 'mongoose';
import { Deposit, Wallet, User, AdminSetting, TransactionLog } from '../models/index.js';
import { createPayment, verifyIpnSignature } from '../utils/cryptoApi.js';

// Helper to get settings
const getSetting = async (key, defaultValue) => {
  const setting = await AdminSetting.findOne({ key });
  return setting ? parseFloat(setting.value) : defaultValue;
};

// Create deposit
export const createDeposit = async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const userId = req.user.id;

    // Validation
    if (amount < 20 || amount > 1000) {
      return res.status(400).json({ message: 'Amount must be between $20 and $1000' });
    }

    // Get fee settings
    const platformFeePercent = await getSetting('deposit_platform_fee', 0.1);
    const companyFeePercent = await getSetting('deposit_company_fee', 1);

    const platformFee = (amount * platformFeePercent) / 100;
    const companyFee = (amount * companyFeePercent) / 100;
    const netAmount = amount - platformFee - companyFee;

    // Generate unique order ID
    const orderId = `DEP_${userId}_${Date.now()}`;

    // Create payment with CryptAPI
    const paymentData = await createPayment(amount, currency, orderId, userId);

    // Create deposit record in database
    const deposit = new Deposit({
      userId,
      amount,
      currency: currency.toUpperCase(),
      transactionId: paymentData.payment_id,
      walletAddress: paymentData.address,
      status: 'pending',
      platformFee,
      companyFee,
      netAmount,
      orderId,
      cryptoAmount: paymentData.amount_crypto,
      expiresAt: paymentData.expires ? new Date(paymentData.expires) : null,
    });

    await deposit.save();

    // Return response with payment details
    res.json({
      success: true,
      deposit: {
        id: deposit._id,
        amount: deposit.amount,
        currency: deposit.currency,
        netAmount: deposit.netAmount,
        status: deposit.status,
        createdAt: deposit.createdAt,
      },
      payment: {
        address: paymentData.address,
        amount_crypto: paymentData.amount_crypto,
        qrcode: paymentData.qrcode,
        payment_url: paymentData.payment_url,
        expires: paymentData.expires,
      }
    });

  } catch (error) {
    console.error('Create deposit error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to create deposit',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};

// IPN Handler for CryptAPI
export const ipnHandler = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // CryptAPI sends callbacks as GET or POST with query parameters
    const data = req.method === 'POST' ? req.body : req.query;
    
    // Log incoming webhook for debugging
    console.log('CryptAPI IPN received:', data);

    // Extract signature if present
    const signature = data.signature;
    
    // Verify signature if secret is configured
    if (!verifyIpnSignature(data, signature)) {
      console.error('Invalid signature');
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send('Invalid signature');
    }

    // Extract important fields from callback
    const {
      payment_id,
      orderId, // Our custom parameter
      userId,  // Our custom parameter
      confirmations,
      value,            // Amount received in fiat
      value_coin,       // Amount received in crypto
      coin,             // Cryptocurrency used
      status,           // 'completed' when confirmed
      txid,             // Transaction ID on blockchain
    } = data;

    // Find deposit by orderId (our internal ID) or payment_id
    const deposit = await Deposit.findOne({
      $or: [
        { orderId: orderId || req.query.orderId },
        { transactionId: payment_id }
      ]
    }).session(session);

    if (!deposit) {
      console.error('Deposit not found for:', { orderId, payment_id });
      await session.abortTransaction();
      session.endSession();
      return res.status(404).send('Deposit not found');
    }

    // Update confirmations
    deposit.confirmations = parseInt(confirmations) || 0;
    
    // Get required confirmations from settings
    const requiredConfirmations = await getSetting('crypto_confirmations', 1);

    // Check if deposit is confirmed
    const isConfirmed = 
      (status === 'completed' || 
       status === 'finished' || 
       parseInt(confirmations) >= requiredConfirmations) &&
      deposit.status === 'pending';

    if (isConfirmed) {
      // Update deposit status
      deposit.status = 'confirmed';
      deposit.transactionHash = txid;
      deposit.confirmedAt = new Date();
      await deposit.save({ session });

      // Update user wallet
      const wallet = await Wallet.findOne({ userId: deposit.userId }).session(session);
      
      if (wallet) {
        wallet.balance = (parseFloat(wallet.balance) || 0) + parseFloat(deposit.netAmount);
        wallet.totalDeposits = (parseFloat(wallet.totalDeposits) || 0) + parseFloat(deposit.amount);
        await wallet.save({ session });

        // Create transaction log
        await TransactionLog.create([{
          userId: deposit.userId,
          type: 'deposit',
          amount: deposit.netAmount,
          balanceAfter: wallet.balance,
          description: `Deposit confirmed: $${deposit.netAmount} via ${deposit.currency}`,
          reference: deposit._id.toString()
        }], { session });
      }

      console.log(`Deposit ${deposit._id} confirmed for user ${deposit.userId}`);
    } else {
      // Just update confirmations
      await deposit.save({ session });
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Respond with success (CryptAPI expects 200 OK)
    res.sendStatus(200);

  } catch (error) {
    console.error('IPN handler error:', error);
    await session.abortTransaction();
    session.endSession();
    res.sendStatus(500);
  }
};

// Get user deposits history
export const getUserDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      deposits: deposits.map(d => ({
        id: d._id,
        amount: d.amount,
        currency: d.currency,
        netAmount: d.netAmount,
        status: d.status,
        walletAddress: d.walletAddress ? 
          `${d.walletAddress.substring(0, 6)}...${d.walletAddress.substring(d.walletAddress.length - 4)}` : 
          null,
        createdAt: d.createdAt,
        confirmedAt: d.confirmedAt,
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get deposit by ID
export const getDepositById = async (req, res) => {
  try {
    const deposit = await Deposit.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!deposit) {
      return res.status(404).json({ message: 'Deposit not found' });
    }

    res.json({
      success: true,
      deposit: {
        id: deposit._id,
        amount: deposit.amount,
        currency: deposit.currency,
        netAmount: deposit.netAmount,
        status: deposit.status,
        walletAddress: deposit.walletAddress,
        cryptoAmount: deposit.cryptoAmount,
        createdAt: deposit.createdAt,
        confirmedAt: deposit.confirmedAt,
        transactionHash: deposit.transactionHash,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get all deposits
export const getAllDeposits = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const deposits = await Deposit.find(query)
      .populate('userId', 'email fullName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Deposit.countDocuments(query);

    res.json({
      success: true,
      deposits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Update deposit status manually
export const updateDepositStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status, transactionHash } = req.body;

    const deposit = await Deposit.findById(id).session(session);
    if (!deposit) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Deposit not found' });
    }

    deposit.status = status;
    if (transactionHash) deposit.transactionHash = transactionHash;
    if (status === 'confirmed' && !deposit.confirmedAt) {
      deposit.confirmedAt = new Date();
    }
    await deposit.save({ session });

    // If marking as confirmed, update wallet
    if (status === 'confirmed' && deposit.status !== 'confirmed') {
      const wallet = await Wallet.findOne({ userId: deposit.userId }).session(session);
      if (wallet) {
        wallet.balance = (parseFloat(wallet.balance) || 0) + parseFloat(deposit.netAmount);
        wallet.totalDeposits = (parseFloat(wallet.totalDeposits) || 0) + parseFloat(deposit.amount);
        await wallet.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, deposit });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};