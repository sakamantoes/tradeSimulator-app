import dotenv from 'dotenv';
dotenv.config();
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { handleMarketConnections } from './handlers/marketHandler.js';

let wss = null;
const clients = new Map(); // Map of userId -> Set of WebSocket connections

/**
 * Initialize WebSocket server
 * @param {http.Server} server - HTTP server instance
 */
export const initializeWebSocketServer = (server) => {
  wss = new WebSocketServer({ server });

  wss.on('connection', async (ws, req) => {
    try {
      // Extract token from query parameters
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(4001, 'No token provided');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        ws.close(4001, 'User not found');
        return;
      }

      // Store user reference
      ws.userId = user._id.toString();
      ws.user = user;

      // Add client to map
      if (!clients.has(user._id.toString())) {
        clients.set(user._id.toString(), new Set());
      }
      clients.get(user._id.toString()).add(ws);

      // Route to appropriate handler based on path
      const path = url.pathname;
      if (path === '/ws/market') {
        handleMarketConnections(ws, user);
      } else {
        ws.close(4004, 'Unknown endpoint');
      }

      // Handle disconnection
      ws.on('close', () => {
        const userConnections = clients.get(user._id.toString());
        if (userConnections) {
          userConnections.delete(ws);
          if (userConnections.size === 0) {
            clients.delete(user._id.toString());
          }
        }
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(4001, 'Authentication failed');
    }
  });

  return wss;
};

/**
 * Broadcast message to all clients
 * @param {Object} message - Message to broadcast
 */
export const broadcastToAll = (message) => {
  if (wss) {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(message));
      }
    });
  }
};

/**
 * Broadcast message to a specific user
 * @param {string} userId - User ID
 * @param {Object} message - Message to send
 */
export const broadcastToUser = (userId, message) => {
  const userConnections = clients.get(userId);
  if (userConnections) {
    userConnections.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(message));
      }
    });
  }
};

/**
 * Broadcast to all market data subscribers
 * @param {Object} marketData - Market data to broadcast
 */
export const broadcastMarketData = (marketData) => {
  if (wss) {
    wss.clients.forEach((client) => {
      if (client.readyState === 1 && client.subscriptions?.includes('market')) {
        client.send(JSON.stringify({
          type: 'price_update',
          data: marketData,
          timestamp: Date.now(),
        }));
      }
    });
  }
};

export const getWebSocketServer = () => wss;
export const getClients = () => clients;
