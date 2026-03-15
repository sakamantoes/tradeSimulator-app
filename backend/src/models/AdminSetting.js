import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AdminSetting = sequelize.define('AdminSetting', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

export default AdminSetting;