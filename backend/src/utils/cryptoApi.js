import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const BLOCKONOMICS_API_KEY = process.env.BLOCKONOMICS_API_KEY;
const BLOCKONOMICS_API_URL = process.env.BLOCKONOMICS_API_URL || 'https://www.blockonomics.co/api';
const BLOCKONOMICS_SECRET = process.env.BLOCKONOMICS_SECRET;

// Create a payment request with Blockonomics
export const createPayment = async (amount, currency, orderId) => {
  try {
    const response = await axios.post(
      `${BLOCKONOMICS_API_URL}/payments/`,
      {
        amount: amount, // in USD
        currency: currency || 'BTC',
        order_id: orderId,
        callback_url: `${process.env.BACKEND_URL}/api/deposits/ipn?secret=${BLOCKONOMICS_SECRET}`,
      },
      {
        headers: {
          'Authorization': `Bearer ${BLOCKONOMICS_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Blockonomics error:', error.response?.data || error.message);
    throw error;
  }
};

// Get payment status from Blockonomics
export const getPaymentStatus = async (paymentId) => {
  try {
    const response = await axios.get(`${BLOCKONOMICS_API_URL}/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${BLOCKONOMICS_API_KEY}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Blockonomics error:', error.response?.data || error.message);
    throw error;
  }
};

// Verify IPN signature from Blockonomics
export const verifyIpnSignature = (data, signature) => {
  const hmac = crypto.createHmac('sha256', BLOCKONOMICS_API_KEY);
  const calculated = hmac.update(JSON.stringify(data)).digest('hex');
  return calculated === signature;
};