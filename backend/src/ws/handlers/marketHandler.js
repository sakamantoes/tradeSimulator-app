import { MarketAsset } from '../../models/index.js';

/**
 * Handle market WebSocket connections
 * Sends real-time market data updates to clients
 */
export const handleMarketConnections = async (ws, user) => {
  // Mark this connection as subscribed to market data
  ws.subscriptions = ['market'];

  // Send initial market data
  try {
    const assets = await MarketAsset.find({ isActive: true }).lean();
    const priceData = assets.map(asset => ({
      symbol: asset.symbol,
      price: asset.currentPrice,
      volatility: asset.volatility,
      trend: asset.trend,
      volume: asset.volume,
      name: asset.name,
    }));

    ws.send(JSON.stringify({
      type: 'market_snapshot',
      data: priceData,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Error sending market snapshot:', error);
    ws.close(4000, 'Failed to load market data');
    return;
  }

  // Handle incoming messages
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'subscribe':
          handleSubscribe(ws, message);
          break;
        case 'unsubscribe':
          handleUnsubscribe(ws, message);
          break;
        case 'ping':
          handlePing(ws, message);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling market message:', error);
    }
  });

  // Log successful connection
  console.log(`User ${user._id} connected to market WebSocket`);
};

/**
 * Handle subscription to specific assets
 */
const handleSubscribe = (ws, message) => {
  const { symbols } = message.data || {};
  if (symbols && Array.isArray(symbols)) {
    ws.subscribedSymbols = symbols;
    ws.send(JSON.stringify({
      type: 'subscription_confirmed',
      data: { symbols },
      timestamp: Date.now(),
    }));
  }
};

/**
 * Handle unsubscription from assets
 */
const handleUnsubscribe = (ws, message) => {
  const { symbols } = message.data || {};
  if (symbols && Array.isArray(symbols) && ws.subscribedSymbols) {
    ws.subscribedSymbols = ws.subscribedSymbols.filter(s => !symbols.includes(s));
    ws.send(JSON.stringify({
      type: 'unsubscription_confirmed',
      data: { symbols },
      timestamp: Date.now(),
    }));
  }
};

/**
 * Handle ping to measure latency
 */
const handlePing = (ws, message) => {
  ws.send(JSON.stringify({
    type: 'pong',
    data: message.data,
    timestamp: Date.now(),
  }));
};
