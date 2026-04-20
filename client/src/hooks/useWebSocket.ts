import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';

export type WebSocketMessageType = 
  | 'price_update'
  | 'trade_update'
  | 'balance_update'
  | 'notification'
  | 'market_status'
  | 'trade_result'
  | 'error';

export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  data: T;
  timestamp: number;
  id?: string;
}

export interface PriceUpdateData {
  symbol: string;
  price: number;
  change: number;
  volume: number;
  high: number;
  low: number;
  timestamp: number;
}

export interface TradeUpdateData {
  tradeId: number;
  userId: number;
  asset: string;
  amount: number;
  prediction: 'UP' | 'DOWN';
  result?: 'win' | 'loss';
  profit?: number;
  status: 'open' | 'closed' | 'cancelled';
}

export interface BalanceUpdateData {
  userId: number;
  balance: number;
  previousBalance: number;
  change: number;
  reason: string;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface MarketStatusData {
  status: 'open' | 'closed' | 'maintenance';
  message?: string;
  nextOpen?: string;
}

export interface TradeResultData {
  tradeId: number;
  result: 'win' | 'loss';
  profit: number;
  closePrice: number;
  openPrice: number;
  amount: number;
}

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  pingInterval?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = (
  url: string,
  options: UseWebSocketOptions = {}
) => {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    pingInterval = 30000,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const { token, isAuthenticated } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const [lastPong, setLastPong] = useState<Date | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<Event | null>(null);
  const messageQueueRef = useRef<WebSocketMessage[]>([]);

  // Generate WebSocket URL with token
  const wsUrl = useMemo(() => {
    if (!token) return null;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${token}`;
  }, [url, token]);

  // Send message
  const sendMessage = useCallback((message: WebSocketMessage | string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      wsRef.current.send(messageStr);
      return true;
    }
    
    // Queue message if not connected
    if (typeof message !== 'string') {
      messageQueueRef.current.push(message);
    }
    return false;
  }, []);

  // Send ping to measure latency
  const sendPing = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const pingTime = Date.now();
      sendMessage({
        type: 'ping',
        data: { timestamp: pingTime },
        timestamp: pingTime,
      });
      setLastPing(new Date(pingTime));
    }
  }, [sendMessage]);

  // Process queued messages
  const processQueue = useCallback(() => {
    while (messageQueueRef.current.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
      const message = messageQueueRef.current.shift();
      if (message) {
        sendMessage(message);
      }
    }
  }, [sendMessage]);

  // Connect WebSocket
  const connect = useCallback(() => {
    if (!wsUrl || !isAuthenticated) {
      console.log('Cannot connect: No token or not authenticated');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Already connected');
      return;
    }

    if (isConnecting) {
      console.log('Already connecting...');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
        setError(null);
        
        // Start ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(sendPing, pingInterval);
        
        // Process queued messages
        processQueue();
        
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Handle pong response
          if (message.type === 'pong') {
            const pongTime = Date.now();
            setLastPong(new Date(pongTime));
            if (lastPing) {
              const newLatency = pongTime - lastPing.getTime();
              setLatency(newLatency);
            }
          }
          
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        
        onDisconnect?.();
        
        // Attempt reconnection if not closed intentionally and within attempts
        if (reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError(event);
        onError?.(event);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setIsConnecting(false);
      setError(error as Event);
    }
  }, [wsUrl, isAuthenticated, isConnecting, pingInterval, sendPing, processQueue, onConnect, onMessage, onDisconnect, onError, reconnectAttempts, reconnectInterval]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    messageQueueRef.current = [];
  }, []);

  // Auto connect on mount
  useEffect(() => {
    if (autoConnect && wsUrl && isAuthenticated) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [autoConnect, wsUrl, isAuthenticated, connect, disconnect]);

  // Subscribe to specific message types
  const subscribe = useCallback(<T = any>(
    type: WebSocketMessageType,
    callback: (data: T) => void
  ) => {
    const handler = (message: WebSocketMessage) => {
      if (message.type === type) {
        callback(message.data);
      }
    };
    
    // Wrap the original onMessage
    const originalOnMessage = onMessage;
    const wrappedOnMessage = (message: WebSocketMessage) => {
      handler(message);
      originalOnMessage?.(message);
    };
    
    // This is a simplified subscription - in production you'd want a proper pub/sub system
    return () => {
      // Cleanup would require storing handlers
    };
  }, [onMessage]);

  // Check connection health
  const isHealthy = useCallback(() => {
    if (!isConnected) return false;
    if (lastPing && lastPong) {
      const timeSinceLastPong = Date.now() - lastPong.getTime();
      return timeSinceLastPong < pingInterval * 2;
    }
    return true;
  }, [isConnected, lastPing, lastPong, pingInterval]);

  return {
    isConnected,
    isConnecting,
    lastMessage,
    error,
    latency,
    isHealthy,
    sendMessage,
    connect,
    disconnect,
    subscribe,
  };
};

// Specific hook for market data
export const useMarketWebSocket = (symbol?: string) => {
  const ws = useWebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws/market');
  
  const [price, setPrice] = useState<PriceUpdateData | null>(null);
  const [marketStatus, setMarketStatus] = useState<MarketStatusData | null>(null);

  useEffect(() => {
    if (!ws.lastMessage) return;

    if (ws.lastMessage.type === 'price_update') {
      const data = ws.lastMessage.data as PriceUpdateData;
      if (!symbol || data.symbol === symbol) {
        setPrice(data);
      }
    } else if (ws.lastMessage.type === 'market_status') {
      setMarketStatus(ws.lastMessage.data as MarketStatusData);
    }
  }, [ws.lastMessage, symbol]);

  return {
    ...ws,
    price,
    marketStatus,
  };
};

// Specific hook for user data
export const useUserWebSocket = () => {
  const ws = useWebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws/user');
  
  const [balance, setBalance] = useState<BalanceUpdateData | null>(null);
  const [tradeUpdates, setTradeUpdates] = useState<TradeUpdateData[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    if (!ws.lastMessage) return;

    if (ws.lastMessage.type === 'balance_update') {
      setBalance(ws.lastMessage.data as BalanceUpdateData);
    } else if (ws.lastMessage.type === 'trade_update') {
      setTradeUpdates(prev => [ws.lastMessage.data as TradeUpdateData, ...prev].slice(0, 50));
    } else if (ws.lastMessage.type === 'notification') {
      setNotifications(prev => [ws.lastMessage.data as NotificationData, ...prev]);
    } else if (ws.lastMessage.type === 'trade_result') {
      const data = ws.lastMessage.data as TradeResultData;
      setTradeUpdates(prev => prev.map(trade => 
        trade.tradeId === data.tradeId 
          ? { ...trade, result: data.result, profit: data.profit, status: 'closed' }
          : trade
      ));
    }
  }, [ws.lastMessage]);

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
    ws.sendMessage({
      type: 'mark_read',
      data: { notificationId },
      timestamp: Date.now(),
    });
  }, [ws]);

  return {
    ...ws,
    balance,
    tradeUpdates,
    notifications,
    markNotificationRead,
  };
};

// Specific hook for admin WebSocket
export const useAdminWebSocket = () => {
  const ws = useWebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws/admin');
  
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);

  useEffect(() => {
    if (!ws.lastMessage) return;

    if (ws.lastMessage.type === 'user_activity') {
      setUserActivities(prev => [ws.lastMessage.data, ...prev].slice(0, 100));
    } else if (ws.lastMessage.type === 'system_metrics') {
      setSystemMetrics(ws.lastMessage.data);
    }
  }, [ws.lastMessage]);

  return {
    ...ws,
    userActivities,
    systemMetrics,
  };
};

export default useWebSocket;