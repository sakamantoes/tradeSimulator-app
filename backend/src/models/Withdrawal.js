import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USDT' },
  walletAddress: { type: String, required: true },
  fee: { type: Number, default: 0 },
  netAmount: { type: Number, default: 0 },
  transactionId: String,
  transactionHash: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'], default: 'pending' },
  rejectionReason: String,
  processedAt: Date,
  completedAt: Date,
}, { timestamps: true });

const Withdrawal = mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema);
export default Withdrawal;
