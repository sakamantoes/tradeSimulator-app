import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    connectTimeout: 60000,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Test connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Railway MySQL successfully!');
  } catch (error) {
    console.error('Unable to connect:', error);
  }
}

testConnection();

export default sequelize;