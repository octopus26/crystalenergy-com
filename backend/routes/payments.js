const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { 
  createPayPalOrder, 
  capturePayPalPayment, 
  getPayPalOrderDetails 
} = require('../utils/paypal');
const { 
  createCustomer, 
  createOrder, 
  updateOrderStatus,
  getOrderByPayPalId,
  updateOrderPayPalCapture,
  logPaymentEvent 
} = require('../utils/database');

const router = express.Router();

// Input validation middleware
const validatePaymentRequest = [
  body('amount').isInt({ min: 50 }).withMessage('Amount must be at least $0.50'),
  body('currency').optional().isIn(['usd', 'eur', 'gbp']).withMessage('Invalid currency'),
  body('customerEmail').isEmail().withMessage('Valid email is required'),
  body('customerName').isLength({ min: 2 }).withMessage('Customer name is required'),
  body('paymentMethod').isIn(['stripe', 'paypal']).withMessage('Payment method must be stripe or paypal'),
  body('orderType').isIn(['consultation', 'product']).withMessage('Order type must be consultation or product')
];

// Create Stripe Payment Intent
router.post('/stripe/create-intent', validatePaymentRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { 
      amount, 
      currency = 'usd', 
      customerEmail, 
      customerName, 
      orderType,
      metadata = {} 
    } = req.body;

    // Create or get customer
    const customerId = uuidv4();
    await createCustomer({
      id: customerId,
      email: customerEmail,
      name: customerName
    });

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      customer: customerId,
      metadata: {
        customerName,
        customerEmail,
        orderType,
        orderId: uuidv4(),
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create order in database
    const orderId = paymentIntent.metadata.orderId;
    await createOrder({
      id: orderId,
      customer_id: customerId,
      type: orderType,
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      payment_method: 'stripe',
      stripe_payment_intent_id: paymentIntent.id,
      metadata: metadata
    });

    // Log payment event
    await logPaymentEvent({
      id: uuidv4(),
      order_id: orderId,
      stripe_event_id: paymentIntent.id,
      event_type: 'payment_intent.created',
      status: 'pending',
      data: paymentIntent
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId: orderId,
      amount: Math.round(amount),
      currency: currency.toLowerCase()
    });

  } catch (error) {
    console.error('Stripe payment intent creation error:', error);
    res.status(500).json({
      error: 'Failed to create payment intent',
      message: error.message
    });
  }
});

// Create PayPal Order
router.post('/paypal/create-order', validatePaymentRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { 
      amount, 
      currency = 'USD', 
      customerEmail, 
      customerName, 
      orderType,
      metadata = {} 
    } = req.body;

    // Create or get customer
    const customerId = uuidv4();
    await createCustomer({
      id: customerId,
      email: customerEmail,
      name: customerName
    });

    const orderId = uuidv4();
    const description = orderType === 'consultation' 
      ? `Feng Shui Consultation - ${customerName}`
      : `Crystal Purchase - ${customerName}`;

    // Create PayPal order
    const paypalResult = await createPayPalOrder({
      amount: Math.round(amount),
      currency: currency.toUpperCase(),
      description: description,
      customId: orderId
    });

    if (!paypalResult.success) {
      return res.status(500).json({
        error: 'Failed to create PayPal order',
        message: paypalResult.error
      });
    }

    // Create order in database
    await createOrder({
      id: orderId,
      customer_id: customerId,
      type: orderType,
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      payment_method: 'paypal',
      paypal_order_id: paypalResult.orderId,
      metadata: metadata
    });

    // Log payment event
    await logPaymentEvent({
      id: uuidv4(),
      order_id: orderId,
      stripe_event_id: null,
      event_type: 'paypal_order.created',
      status: 'pending',
      data: paypalResult.data
    });

    res.json({
      success: true,
      paypalOrderId: paypalResult.orderId,
      approvalUrl: paypalResult.approvalUrl,
      orderId: orderId,
      amount: Math.round(amount),
      currency: currency.toUpperCase()
    });

  } catch (error) {
    console.error('PayPal order creation error:', error);
    res.status(500).json({
      error: 'Failed to create PayPal order',
      message: error.message
    });
  }
});

// Capture PayPal Payment
router.post('/paypal/capture/:paypalOrderId', async (req, res) => {
  try {
    const { paypalOrderId } = req.params;

    // Get order from database
    const order = await getOrderByPayPalId(paypalOrderId);
    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    // Capture PayPal payment
    const captureResult = await capturePayPalPayment(paypalOrderId);
    
    if (!captureResult.success) {
      await updateOrderStatus(order.id, 'failed');
      return res.status(500).json({
        error: 'Failed to capture PayPal payment',
        message: captureResult.error
      });
    }

    // Update order status and capture ID
    await updateOrderStatus(order.id, 'completed');
    await updateOrderPayPalCapture(order.id, captureResult.captureId);

    // Log payment event
    await logPaymentEvent({
      id: uuidv4(),
      order_id: order.id,
      stripe_event_id: null,
      event_type: 'paypal_payment.captured',
      status: 'completed',
      data: captureResult.data
    });

    res.json({
      success: true,
      orderId: order.id,
      captureId: captureResult.captureId,
      status: captureResult.status,
      orderType: order.type
    });

  } catch (error) {
    console.error('PayPal capture error:', error);
    res.status(500).json({
      error: 'Failed to capture PayPal payment',
      message: error.message
    });
  }
});

// Confirm Stripe Payment
router.post('/stripe/confirm', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'Payment intent ID is required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      const orderId = paymentIntent.metadata.orderId;
      await updateOrderStatus(orderId, 'completed');

      // Log payment event
      await logPaymentEvent({
        id: uuidv4(),
        order_id: orderId,
        stripe_event_id: paymentIntentId,
        event_type: 'payment_intent.succeeded',
        status: 'completed',
        data: paymentIntent
      });

      res.json({
        success: true,
        orderId: orderId,
        status: paymentIntent.status,
        orderType: paymentIntent.metadata.orderType
      });
    } else {
      res.json({
        success: false,
        status: paymentIntent.status,
        message: 'Payment not completed'
      });
    }

  } catch (error) {
    console.error('Stripe payment confirmation error:', error);
    res.status(500).json({
      error: 'Failed to confirm payment',
      message: error.message
    });
  }
});

// Get payment status
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // This would typically query your database for order status
    // For now, return a simple response
    res.json({
      success: true,
      orderId: orderId,
      status: 'pending', // This should come from your database
      message: 'Order status retrieved successfully'
    });

  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({
      error: 'Failed to get payment status',
      message: error.message
    });
  }
});

// Get supported payment methods
router.get('/methods', (req, res) => {
  res.json({
    success: true,
    methods: [
      {
        id: 'stripe',
        name: 'Credit/Debit Card',
        description: 'Pay with Visa, Mastercard, American Express',
        enabled: !!process.env.STRIPE_SECRET_KEY
      },
      {
        id: 'paypal',
        name: 'PayPal',
        description: 'Pay with your PayPal account',
        enabled: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET)
      }
    ]
  });
});

module.exports = router;