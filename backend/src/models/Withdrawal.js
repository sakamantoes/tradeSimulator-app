import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Withdrawal = sequelize.define('Withdrawal', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'USDT',
  },
  walletAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fee: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  netAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  transactionId: {
    type: DataTypes.STRING,
  },
  transactionHash: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  rejectionReason: {
    type: DataTypes.TEXT,
  },
  processedAt: {
    type: DataTypes.DATE,
  },
  completedAt: {
    type: DataTypes.DATE,
  },
});

export default Withdrawal;