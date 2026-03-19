import mongoose from 'mongoose';

const marketAssetSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: String,
  currentPrice: { type: Number, default: 100 },
  volatility: { type: Number, default: 0.02 },
  trend: { type: Number, default: 0 },
  volume: { type: Number, default: 1000 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const MarketAsset = mongoose.models.MarketAsset || mongoose.model('MarketAsset', marketAssetSchema);
export default MarketAsset;
