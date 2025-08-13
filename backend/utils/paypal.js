const paypal = require('@paypal/checkout-server-sdk');

let client;

// PayPal configuration
function getPayPalClient() {
  if (!client) {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const environment = process.env.PAYPAL_MODE === 'live' 
      ? new paypal.core.LiveEnvironment(clientId, clientSecret)
      : new paypal.core.SandboxEnvironment(clientId, clientSecret);
    
    client = new paypal.core.PayPalHttpClient(environment);
  }
  return client;
}

// Create PayPal order
async function createPayPalOrder(orderData) {
  const { amount, currency = 'USD', description, customId } = orderData;
  
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: customId,
      description: description,
      amount: {
        currency_code: currency,
        value: (amount / 100).toFixed(2) // Convert cents to dollars
      }
    }],
    application_context: {
      brand_name: 'CrystalEnergy.com',
      landing_page: 'BILLING',
      user_action: 'PAY_NOW',
      return_url: `${process.env.FRONTEND_URL}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`
    }
  });

  try {
    const response = await getPayPalClient().execute(request);
    return {
      success: true,
      orderId: response.result.id,
      approvalUrl: response.result.links.find(link => link.rel === 'approve').href,
      data: response.result
    };
  } catch (error) {
    console.error('PayPal order creation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Capture PayPal payment
async function capturePayPalPayment(orderId) {
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const response = await getPayPalClient().execute(request);
    return {
      success: true,
      captureId: response.result.purchase_units[0].payments.captures[0].id,
      status: response.result.status,
      data: response.result
    };
  } catch (error) {
    console.error('PayPal capture error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get PayPal order details
async function getPayPalOrderDetails(orderId) {
  const request = new paypal.orders.OrdersGetRequest(orderId);

  try {
    const response = await getPayPalClient().execute(request);
    return {
      success: true,
      data: response.result
    };
  } catch (error) {
    console.error('PayPal order details error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Refund PayPal payment
async function refundPayPalPayment(captureId, amount) {
  const request = new paypal.payments.CapturesRefundRequest(captureId);
  request.requestBody({
    amount: {
      currency_code: 'USD',
      value: (amount / 100).toFixed(2)
    }
  });

  try {
    const response = await getPayPalClient().execute(request);
    return {
      success: true,
      refundId: response.result.id,
      status: response.result.status,
      data: response.result
    };
  } catch (error) {
    console.error('PayPal refund error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  getPayPalClient,
  createPayPalOrder,
  capturePayPalPayment,
  getPayPalOrderDetails,
  refundPayPalPayment
};