import app from './src/app.js'
import sequelize from './src/config/database.js';
import { startMarketEngine } from './src/utils/tradeEngine.js';

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: false  }).then(() => {
  console.log('Database connected');
  startMarketEngine();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});