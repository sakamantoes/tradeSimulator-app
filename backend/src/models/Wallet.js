import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Wallet = sequelize.define('Wallet', {
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
  balance: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.0,
  },
  totalDeposits: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.0,
  },
  totalWithdrawals: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.0,
  },
  bonusBalance: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.0,
  },
});

export default Wallet;