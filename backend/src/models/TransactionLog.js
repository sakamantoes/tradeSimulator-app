import mongoose from 'mongoose';

const transactionLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String,
  amount: Number,
  balanceAfter: Number,
  description: String,
  ip: String,
}, { timestamps: true });

const TransactionLog = mongoose.models.TransactionLog || mongoose.model('TransactionLog', transactionLogSchema);
export default TransactionLog;
