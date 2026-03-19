import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  transactionId: { type: String, required: true, index: true },
  status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
  walletAddress: String,
  platformFee: { type: Number, default: 0 },
  companyFee: { type: Number, default: 0 },
  netAmount: { type: Number, default: 0 },
  confirmations: { type: Number, default: 0 },
}, { timestamps: true });

const Deposit = mongoose.models.Deposit || mongoose.model('Deposit', depositSchema);
export default Deposit;
