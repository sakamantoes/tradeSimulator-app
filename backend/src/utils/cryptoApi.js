import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const NOWPAYMENTS_API_URL = process.env.NOWPAYMENTS_API_URL;

// Create a payment
export const createPayment = async (amount, currency, orderId) => {
  try {
    const response = await axios.post(
      `${NOWPAYMENTS_API_URL}/payment`,
      {
        price_amount: amount,
        price_currency: 'usd',
        pay_currency: currency,
        order_id: orderId,
        ipn_callback_url: `${process.env.BACKEND_URL}/api/deposits/ipn`,
      },
      {
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('NowPayments error:', error.response?.data || error.message);
    throw error;
  }
};

// Get payment status
export const getPaymentStatus = async (paymentId) => {
  const response = await axios.get(`${NOWPAYMENTS_API_URL}/payment/${paymentId}`, {
    headers: { 'x-api-key': NOWPAYMENTS_API_KEY },
  });
  return response.data;
};

// Verify IPN signature
export const verifyIpnSignature = (data, signature) => {
  const hmac = crypto.createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET);
  const calculated = hmac.update(JSON.stringify(data)).digest('hex');
  return calculated === signature;
};