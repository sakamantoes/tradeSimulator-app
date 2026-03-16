import { Deposit, Wallet, User, AdminSetting, TransactionLog } from '../models/index.js';
import { createPayment, verifyIpnSignature } from '../utils/cryptoApi.js';
import sequelize from '../config/database.js';

// create deposit
export const createDeposit = async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const userId = req.user.id;

    if (amount < 20 || amount > 1000) {
      return res.status(400).json({ message: 'Amount must be between $20 and $1000' });
    }

    // Get platform fees from admin settings
    const platformFeePercent = await AdminSetting.findByPk('deposit_platform_fee') || 0.1;
    const companyFeePercent = await AdminSetting.findByPk('deposit_company_fee') || 1;

    const platformFee = (amount * platformFeePercent) / 100;
    const companyFee = (amount * companyFeePercent) / 100;
    const netAmount = amount - platformFee - companyFee;

    // Create order in Blockonomics
    const orderId = `DEP_${userId}_${Date.now()}`;
    const paymentData = await createPayment(amount, currency, orderId);

    const deposit = await Deposit.create({
      userId,
      amount,
      currency,
      transactionId: paymentData.payment_id || paymentData.id,
      walletAddress: paymentData.address || paymentData.pay_address,
      status: 'pending',
      platformFee,
      companyFee,
      netAmount,
    });

    res.json({
      deposit,
      payment: paymentData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// IPN webhook from Blockonomics
export const ipnHandler = async (req, res) => {
  try {
    const signature = req.headers['x-blockonomics-sig'] || req.headers['signature'];
    const isValid = verifyIpnSignature(req.body, signature);
    if (!isValid) {
      return res.status(400).send('Invalid signature');
    }

    const { payment_id, id, status } = req.body;
    const transactionId = payment_id || id;

    const deposit = await Deposit.findOne({ where: { transactionId } });
    if (!deposit) {
      return res.status(404).send('Deposit not found');
    }

    if (status === 'completed' || status === 'finished'){
      await sequelize.transaction(async (t) => {
        deposit.status = 'confirmed';
        deposit.confirmations = 6; // assume
        await deposit.save({ transaction: t });

        const wallet = await Wallet.findOne({ where: { userId: deposit.userId }, transaction: t });
        wallet.balance = parseFloat(wallet.balance) + parseFloat(deposit.netAmount);
        wallet.totalDeposits = parseFloat(wallet.totalDeposits) + parseFloat(deposit.amount);
        await wallet.save({ transaction: t });

        await TransactionLog.create({
          userId: deposit.userId,
          type: 'deposit',
          amount: deposit.netAmount,
          balanceAfter: wallet.balance,
          description: `Deposit confirmed: $${deposit.netAmount}`,
        }, { transaction: t });
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
}; 