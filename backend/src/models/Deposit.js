import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Deposit = sequelize.define('Deposit', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING, // USDT, BTC, etc.
    allowNull: false,
  },
 transactionId: {
  type: DataTypes.STRING,
  allowNull: false
},
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'failed'),
    defaultValue: 'pending',
  },
  walletAddress: {
    type: DataTypes.STRING,
  },
  platformFee: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  companyFee: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  netAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  confirmations: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

export default Deposit;