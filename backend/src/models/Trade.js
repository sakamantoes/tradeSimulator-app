import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Trade = sequelize.define('Trade', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  asset: {
    type: DataTypes.STRING, // AAC, TBC, etc.
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  prediction: {
    type: DataTypes.ENUM('UP', 'DOWN'),
    allowNull: false,
  },
  openPrice: {
    type: DataTypes.DECIMAL(15, 2),
  },
  closePrice: {
    type: DataTypes.DECIMAL(15, 2),
  },
  result: {
    type: DataTypes.ENUM('win', 'loss', 'pending'),
    defaultValue: 'pending',
  },
  profit: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  duration: {
    type: DataTypes.INTEGER, // in minutes
    defaultValue: 1,
  },
  status: {
    type: DataTypes.ENUM('open', 'closed', 'cancelled'),
    defaultValue: 'open',
  },
  expiresAt: {
    type: DataTypes.DATE,
  },
});

export default Trade;