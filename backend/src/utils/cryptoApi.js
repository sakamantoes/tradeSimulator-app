import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const CRYPTAPI_BASE = 'https://api.cryptapi.io';
const CRYPTAPI_SECRET = process.env.CRYPTAPI_SECRET; // optional

// Create payment with CryptAPI
export const createPayment = async (amount, currency, orderId, userId) => {
  try {
    // Your main wallet where funds will be received
    const YOUR_WALLET = process.env.MAIN_CRYPTO_WALLET;
    
    if (!YOUR_WALLET) {
      throw new Error('MAIN_CRYPTO_WALLET not configured in environment');
    }

    // Callback URL with userId and orderId for tracking
    const callbackUrl = encodeURIComponent(
      `${process.env.BACKEND_URL}/api/deposits/ipn?userId=${userId}&orderId=${orderId}`
    );

    // Map currency to CryptAPI endpoint format
    let endpoint = '';
    switch (currency.toUpperCase()) {
      case 'BTC':
        endpoint = 'btc';
        break;
      case 'USDT':
        endpoint = 'usdt_trc20'; // TRC20 USDT (cheap fees)
        break;
      case 'ETH':
        endpoint = 'eth';
        break;
      case 'BUSD':
        endpoint = 'busd_bep20';
        break;
      case 'LTC':
        endpoint = 'ltc';
        break;
      default:
        endpoint = 'btc'; // fallback to BTC
    }

    // Build CryptAPI URL with parameters
    const url = `${CRYPTAPI_BASE}/${endpoint}/create/`;
    
    // Parameters for the request
    const params = {
      address: YOUR_WALLET,
      callback: callbackUrl,
      price: amount,
      currency: 'usd',
      convert: 1, // Auto-convert USD to crypto
      priority: 'default',
      ...(CRYPTAPI_SECRET && { secret: CRYPTAPI_SECRET }) // For signature verification
    };

    console.log(`Calling CryptAPI: ${url}`, params); // Debug log

    const response = await axios.get(url, { params });

    // CryptAPI response structure:
    // {
    //   status: 'success',
    //   address_in: 'temp_address_for_user_to_send_to',
    //   address_out: YOUR_WALLET,
    //   amount: 0.001234, // Crypto amount to send
    //   amount_fiat: amount,
    //   payment_id: 'unique_id',
    //   payment_url: 'https://cryptapi.io/payment/...',
    //   qrcode: 'data:image/png...',
    //   ...
    // }

    return {
      payment_id: response.data.payment_id || orderId,
      address: response.data.address_in, // Address user sends crypto to
      amount_crypto: response.data.amount, // Amount in crypto
      amount_fiat: response.data.amount_fiat, // Original fiat amount
      status: 'pending',
      coin: currency.toUpperCase(),
      qrcode: response.data.qrcode, // QR code for easy payment
      payment_url: response.data.payment_url, // Optional: redirect user
      expires: response.data.expires, // Expiration time if any
    };

  } catch (error) {
    console.error('CryptAPI create payment error:', error.response?.data || error.message);
    throw error;
  }
};

// Verify IPN signature from CryptAPI
export const verifyIpnSignature = (data, signature) => {
  if (!CRYPTAPI_SECRET) {
    console.warn('CRYPTAPI_SECRET not set, skipping signature verification');
    return true; // Skip verification if no secret
  }

  try {
    // CryptAPI sends signature in the callback
    const { signature: receivedSig, ...params } = data;
    
    // Sort parameters alphabetically
    const sortedKeys = Object.keys(params).sort();
    const queryString = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
    
    // Compute HMAC-SHA256
    const computedSignature = crypto
      .createHmac('sha256', CRYPTAPI_SECRET)
      .update(queryString)
      .digest('hex');
    
    return computedSignature === (signature || receivedSig);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

// Get payment status (optional)
export const getPaymentStatus = async (paymentId, coin = 'BTC') => {
  try {
    let endpoint = '';
    switch (coin.toUpperCase()) {
      case 'BTC': endpoint = 'btc'; break;
      case 'USDT': endpoint = 'usdt.trc20'; break;
      case 'ETH': endpoint = 'eth'; break;
      default: endpoint = 'btc';
    }

    const response = await axios.get(`${CRYPTAPI_BASE}/${endpoint}/logs/`, {
      params: { payment_id: paymentId }
    });

    return response.data;
  } catch (error) {
    console.error('CryptAPI status error:', error.response?.data || error.message);
    throw error;
  }
};

// Estimate transaction fee (optional)
export const estimateFee = async (currency, amount) => {
  try {
    let endpoint = '';
    switch (currency.toUpperCase()) {
      case 'BTC': endpoint = 'btc'; break;
      case 'USDT': endpoint = 'usdt.trc20'; break;
      case 'ETH': endpoint = 'eth'; break;
      default: endpoint = 'btc';
    }

    const response = await axios.get(`${CRYPTAPI_BASE}/${endpoint}/estimate/`, {
      params: {
        address: process.env.MAIN_CRYPTO_WALLET,
        amount: amount
      }
    });

    return response.data;
  } catch (error) {
    console.error('Fee estimation error:', error.response?.data || error.message);
    return { estimated_fee: 0, estimated_fee_usd: 0 };
  }
};