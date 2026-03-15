import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TransactionLog = sequelize.define('TransactionLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: DataTypes.INTEGER,
  type: DataTypes.STRING, // deposit, withdrawal, trade, fee
  amount: DataTypes.DECIMAL(15, 2),
  balanceAfter: DataTypes.DECIMAL(15, 2),
  description: DataTypes.TEXT,
  ip: DataTypes.STRING,
});

export default TransactionLog;