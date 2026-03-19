import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  asset: { type: String, required: true },
  amount: { type: Number, required: true },
  prediction: { type: String, enum: ['UP', 'DOWN'], required: true },
  openPrice: Number,
  closePrice: Number,
  result: { type: String, enum: ['win', 'loss', 'pending'], default: 'pending' },
  profit: { type: Number, default: 0 },
  duration: { type: Number, default: 1 },
  status: { type: String, enum: ['open', 'closed', 'cancelled'], default: 'open' },
  expiresAt: Date,
}, { timestamps: true });

const Trade = mongoose.models.Trade || mongoose.model('Trade', tradeSchema);
export default Trade;
