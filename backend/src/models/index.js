import User from './User.js';
import Wallet from './Wallet.js';
import Deposit from './Deposit.js';
import Withdrawal from './Withdrawal.js';
import Trade from './Trade.js';
import AdminSetting from './AdminSetting.js';
import MarketAsset from './MarketAsset.js';
import TransactionLog from './TransactionLog.js';

User.hasOne(Wallet, { foreignKey: 'userId', onDelete: 'CASCADE' });
Wallet.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Deposit, { foreignKey: 'userId' });
Deposit.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Withdrawal, { foreignKey: 'userId' });
Withdrawal.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Trade, { foreignKey: 'userId' });
Trade.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(TransactionLog, { foreignKey: 'userId' });
TransactionLog.belongsTo(User, { foreignKey: 'userId' });

export {
  User,
  Wallet,
  Deposit,
  Withdrawal,
  Trade,
  AdminSetting,
  MarketAsset,
  TransactionLog,
};