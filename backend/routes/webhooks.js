const express = require('express');
const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { 
  getPayPalOrderDetails,
  capturePayPalPayment 
} = require('../utils/paypal');
const {
  updateOrderStatus,
  getOrderByPaymentIntent,
  getOrderByPayPalId,
  logPaymentEvent,
  logEmailEvent
} = require('../utils/database');

const router = express.Router();

// Stripe webhook endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('✅ Stripe webhook received:', event.type);

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
        
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;
        
      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        console.log('💰 Invoice payment succeeded:', event.data.object.id);
        break;
        
      case 'customer.subscription.created':
        console.log('🆕 New subscription created:', event.data.object.id);
        break;
        
      default:
        console.log(`🤷‍♀️ Unhandled event type: ${event.type}`);
    }

    // Log all webhook events
    await logPaymentEvent({
      id: uuidv4(),
      order_id: null, // Will be updated in specific handlers if applicable
      stripe_event_id: event.id,
      event_type: event.type,
      status: 'processed',
      data: event.data.object
    });

    res.json({ received: true });
    
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    
    // Log failed webhook processing
    await logPaymentEvent({
      id: uuidv4(),
      order_id: null,
      stripe_event_id: event.id,
      event_type: event.type,
      status: 'failed',
      data: { error: error.message, originalEvent: event.data.object }
    });
    
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// PayPal webhook endpoint
router.post('/paypal', express.json(), async (req, res) => {
  const event = req.body;
  
  console.log('✅ PayPal webhook received:', event.event_type);

  try {
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePayPalPaymentCaptured(event);
        break;
        
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePayPalPaymentDenied(event);
        break;
        
      case 'PAYMENT.CAPTURE.PENDING':
        await handlePayPalPaymentPending(event);
        break;
        
      case 'CHECKOUT.ORDER.APPROVED':
        await handlePayPalOrderApproved(event);
        break;
        
      default:
        console.log(`🤷‍♀️ Unhandled PayPal event type: ${event.event_type}`);
    }

    // Log PayPal webhook events
    await logPaymentEvent({
      id: uuidv4(),
      order_id: null,
      stripe_event_id: null,
      event_type: `paypal_${event.event_type.toLowerCase()}`,
      status: 'processed',
      data: event
    });

    res.json({ received: true });
    
  } catch (error) {
    console.error('❌ Error processing PayPal webhook:', error);
    
    await logPaymentEvent({
      id: uuidv4(),
      order_id: null,
      stripe_event_id: null,
      event_type: `paypal_${event.event_type.toLowerCase()}`,
      status: 'failed',
      data: { error: error.message, originalEvent: event }
    });
    
    res.status(500).json({ error: 'PayPal webhook processing failed' });
  }
});

// Stripe event handlers
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('💳 Payment succeeded:', paymentIntent.id);
  
  try {
    const order = await getOrderByPaymentIntent(paymentIntent.id);
    if (order) {
      await updateOrderStatus(order.id, 'completed');
      
      // Log success
      await logPaymentEvent({
        id: uuidv4(),
        order_id: order.id,
        stripe_event_id: paymentIntent.id,
        event_type: 'payment_intent.succeeded',
        status: 'completed',
        data: paymentIntent
      });
      
      console.log(`✅ Order ${order.id} marked as completed`);
      
      // TODO: Trigger email sending for consultations
      if (order.type === 'consultation') {
        await triggerConsultationEmail(order.id);
      }
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  console.log('❌ Payment failed:', paymentIntent.id);
  
  try {
    const order = await getOrderByPaymentIntent(paymentIntent.id);
    if (order) {
      await updateOrderStatus(order.id, 'failed');
      
      await logPaymentEvent({
        id: uuidv4(),
        order_id: order.id,
        stripe_event_id: paymentIntent.id,
        event_type: 'payment_intent.payment_failed',
        status: 'failed',
        data: paymentIntent
      });
      
      console.log(`❌ Order ${order.id} marked as failed`);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent) {
  console.log('🚫 Payment canceled:', paymentIntent.id);
  
  try {
    const order = await getOrderByPaymentIntent(paymentIntent.id);
    if (order) {
      await updateOrderStatus(order.id, 'failed');
      
      await logPaymentEvent({
        id: uuidv4(),
        order_id: order.id,
        stripe_event_id: paymentIntent.id,
        event_type: 'payment_intent.canceled',
        status: 'canceled',
        data: paymentIntent
      });
    }
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}

async function handleChargeDisputeCreated(dispute) {
  console.log('⚠️ Dispute created:', dispute.id);
  
  try {
    // Log dispute for manual review
    await logPaymentEvent({
      id: uuidv4(),
      order_id: null,
      stripe_event_id: dispute.id,
      event_type: 'charge.dispute.created',
      status: 'dispute',
      data: dispute
    });
    
    // TODO: Send alert email to admin
    console.log('📧 Dispute requires manual review - alert admin');
  } catch (error) {
    console.error('Error handling dispute:', error);
  }
}

// PayPal event handlers
async function handlePayPalPaymentCaptured(event) {
  console.log('💰 PayPal payment captured:', event.resource.id);
  
  try {
    const resource = event.resource;
    const orderId = resource.custom_id; // This should be our internal order ID
    
    if (orderId) {
      await updateOrderStatus(orderId, 'completed');
      
      await logPaymentEvent({
        id: uuidv4(),
        order_id: orderId,
        stripe_event_id: null,
        event_type: 'paypal_payment.captured',
        status: 'completed',
        data: event
      });
      
      console.log(`✅ PayPal Order ${orderId} marked as completed`);
      
      // TODO: Trigger email sending for consultations
      // if (order.type === 'consultation') {
      //   await triggerConsultationEmail(orderId);
      // }
    }
  } catch (error) {
    console.error('Error handling PayPal payment capture:', error);
  }
}

async function handlePayPalPaymentDenied(event) {
  console.log('❌ PayPal payment denied:', event.resource.id);
  
  try {
    const resource = event.resource;
    const orderId = resource.custom_id;
    
    if (orderId) {
      await updateOrderStatus(orderId, 'failed');
      
      await logPaymentEvent({
        id: uuidv4(),
        order_id: orderId,
        stripe_event_id: null,
        event_type: 'paypal_payment.denied',
        status: 'failed',
        data: event
      });
    }
  } catch (error) {
    console.error('Error handling PayPal payment denial:', error);
  }
}

async function handlePayPalPaymentPending(event) {
  console.log('⏳ PayPal payment pending:', event.resource.id);
  
  try {
    const resource = event.resource;
    const orderId = resource.custom_id;
    
    if (orderId) {
      await updateOrderStatus(orderId, 'processing');
      
      await logPaymentEvent({
        id: uuidv4(),
        order_id: orderId,
        stripe_event_id: null,
        event_type: 'paypal_payment.pending',
        status: 'processing',
        data: event
      });
    }
  } catch (error) {
    console.error('Error handling PayPal payment pending:', error);
  }
}

async function handlePayPalOrderApproved(event) {
  console.log('✅ PayPal order approved:', event.resource.id);
  
  try {
    const resource = event.resource;
    const paypalOrderId = resource.id;
    
    const order = await getOrderByPayPalId(paypalOrderId);
    if (order) {
      await updateOrderStatus(order.id, 'processing');
      
      await logPaymentEvent({
        id: uuidv4(),
        order_id: order.id,
        stripe_event_id: null,
        event_type: 'paypal_order.approved',
        status: 'processing',
        data: event
      });
    }
  } catch (error) {
    console.error('Error handling PayPal order approval:', error);
  }
}

// Helper function to trigger consultation email
async function triggerConsultationEmail(orderId) {
  try {
    console.log(`📧 Triggering consultation email for order: ${orderId}`);
    
    // Log email trigger attempt
    await logEmailEvent({
      id: uuidv4(),
      consultation_id: null, // Would need to get consultation ID from order
      customer_email: 'placeholder@email.com', // Would get from order/customer
      subject: 'Your Feng Shui Consultation is Ready',
      status: 'pending',
      error_message: null
    });
    
    // TODO: Implement actual email sending in email service
    console.log('📧 Email sending will be implemented in email service module');
    
  } catch (error) {
    console.error('Error triggering consultation email:', error);
  }
}

// Health check for webhooks
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      stripe: '/api/webhooks/stripe',
      paypal: '/api/webhooks/paypal'
    },
    environment: process.env.NODE_ENV
  });
});

module.exports = router;