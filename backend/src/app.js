import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import depositRoutes from './routes/depositRoutes.js';
import withdrawalRoutes from './routes/withdrawalRoutes.js';
import tradeRoutes from './routes/tradeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import authConfig from './config/auth.js';
import { checkMaintenanceMode } from './middleware/adminMiddleware.js';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use(checkMaintenanceMode);
app.use(cors(authConfig.cors));

// Global rate limiting for all API routes
app.use('/api', apiLimiter);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api', limiter);

app.get('/', (req,res)=>{
  res.send('Welcome to the Trade Simulator API');
})

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/market', marketRoutes);

// Health check (no rate limit)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

export default app;

// Start server if this file is run directly
import sequelize from './config/database.js';
import { startMarketEngine } from './utils/tradeEngine.js';

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: false }).then(() => {
  console.log('Database connected');
  startMarketEngine();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});