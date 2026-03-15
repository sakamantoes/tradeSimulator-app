import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MarketAsset = sequelize.define('MarketAsset', {
  symbol: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
  },
  currentPrice: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 100,
  },
  volatility: {
    type: DataTypes.FLOAT,
    defaultValue: 0.02,
  },
  trend: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  volume: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

export default MarketAsset;