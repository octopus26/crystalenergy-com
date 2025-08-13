const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');

let db;

// Database connection
function getDatabase() {
  if (!db) {
    const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../database.sqlite');
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err.message);
        throw err;
      }
      console.log('📁 Connected to SQLite database');
    });
    
    // Promisify database methods
    db.runAsync = promisify(db.run.bind(db));
    db.getAsync = promisify(db.get.bind(db));
    db.allAsync = promisify(db.all.bind(db));
  }
  return db;
}

// Initialize database tables
async function initializeDatabase() {
  const database = getDatabase();
  
  try {
    // Customers table
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders table
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('consultation', 'product')),
        amount INTEGER NOT NULL,
        currency TEXT DEFAULT 'usd',
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
        payment_method TEXT DEFAULT 'stripe' CHECK (payment_method IN ('stripe', 'paypal')),
        stripe_payment_intent_id TEXT,
        paypal_order_id TEXT,
        paypal_capture_id TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
      )
    `);

    // Consultations table
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS consultations (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        consultation_type TEXT NOT NULL,
        birth_date DATE NOT NULL,
        birth_time TIME,
        birth_place TEXT NOT NULL,
        questions TEXT NOT NULL,
        ai_result TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        generated_at DATETIME,
        email_sent_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (customer_id) REFERENCES customers (id)
      )
    `);

    // Product orders table
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS product_orders (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        items TEXT NOT NULL,
        shipping_address TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
        tracking_number TEXT,
        shipped_at DATETIME,
        delivered_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (customer_id) REFERENCES customers (id)
      )
    `);

    // Payment logs table
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS payment_logs (
        id TEXT PRIMARY KEY,
        order_id TEXT,
        stripe_event_id TEXT,
        event_type TEXT NOT NULL,
        status TEXT NOT NULL,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders (id)
      )
    `);

    // Email logs table
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id TEXT PRIMARY KEY,
        consultation_id TEXT,
        customer_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
        error_message TEXT,
        sent_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consultation_id) REFERENCES consultations (id)
      )
    `);

    // Create indexes for better performance
    await database.runAsync('CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email)');
    await database.runAsync('CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id)');
    await database.runAsync('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status)');
    await database.runAsync('CREATE INDEX IF NOT EXISTS idx_consultations_order_id ON consultations (order_id)');
    await database.runAsync('CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations (status)');
    await database.runAsync('CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON payment_logs (order_id)');

    console.log('✅ Database tables created/verified successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

// Helper functions
async function createCustomer(customerData) {
  const database = getDatabase();
  const { id, email, name } = customerData;
  
  try {
    await database.runAsync(
      'INSERT OR REPLACE INTO customers (id, email, name) VALUES (?, ?, ?)',
      [id, email, name]
    );
    return { id, email, name };
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

async function createOrder(orderData) {
  const database = getDatabase();
  const { 
    id, 
    customer_id, 
    type, 
    amount, 
    currency, 
    payment_method,
    stripe_payment_intent_id, 
    paypal_order_id,
    paypal_capture_id,
    metadata 
  } = orderData;
  
  try {
    await database.runAsync(
      'INSERT INTO orders (id, customer_id, type, amount, currency, payment_method, stripe_payment_intent_id, paypal_order_id, paypal_capture_id, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id, 
        customer_id, 
        type, 
        amount, 
        currency || 'usd', 
        payment_method || 'stripe',
        stripe_payment_intent_id, 
        paypal_order_id,
        paypal_capture_id,
        JSON.stringify(metadata)
      ]
    );
    return { id, customer_id, type, amount, currency, payment_method, status: 'pending' };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

async function updateOrderStatus(orderId, status) {
  const database = getDatabase();
  
  try {
    await database.runAsync(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, orderId]
    );
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

async function getOrderByPaymentIntent(paymentIntentId) {
  const database = getDatabase();
  
  try {
    return await database.getAsync(
      'SELECT * FROM orders WHERE stripe_payment_intent_id = ?',
      [paymentIntentId]
    );
  } catch (error) {
    console.error('Error getting order by payment intent:', error);
    throw error;
  }
}

async function getOrderByPayPalId(paypalOrderId) {
  const database = getDatabase();
  
  try {
    return await database.getAsync(
      'SELECT * FROM orders WHERE paypal_order_id = ?',
      [paypalOrderId]
    );
  } catch (error) {
    console.error('Error getting order by PayPal ID:', error);
    throw error;
  }
}

async function updateOrderPayPalCapture(orderId, captureId) {
  const database = getDatabase();
  
  try {
    await database.runAsync(
      'UPDATE orders SET paypal_capture_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [captureId, orderId]
    );
  } catch (error) {
    console.error('Error updating PayPal capture ID:', error);
    throw error;
  }
}

async function createConsultation(consultationData) {
  const database = getDatabase();
  const { id, order_id, customer_id, consultation_type, birth_date, birth_time, birth_place, questions } = consultationData;
  
  try {
    await database.runAsync(
      'INSERT INTO consultations (id, order_id, customer_id, consultation_type, birth_date, birth_time, birth_place, questions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, order_id, customer_id, consultation_type, birth_date, birth_time, birth_place, questions]
    );
    return { id, order_id, consultation_type, status: 'pending' };
  } catch (error) {
    console.error('Error creating consultation:', error);
    throw error;
  }
}

async function updateConsultationResult(consultationId, aiResult) {
  const database = getDatabase();
  
  try {
    await database.runAsync(
      'UPDATE consultations SET ai_result = ?, status = ?, generated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [aiResult, 'completed', consultationId]
    );
  } catch (error) {
    console.error('Error updating consultation result:', error);
    throw error;
  }
}

async function getConsultationById(consultationId) {
  const database = getDatabase();
  
  try {
    return await database.getAsync(
      'SELECT * FROM consultations WHERE id = ?',
      [consultationId]
    );
  } catch (error) {
    console.error('Error getting consultation:', error);
    throw error;
  }
}

async function logPaymentEvent(logData) {
  const database = getDatabase();
  const { id, order_id, stripe_event_id, event_type, status, data } = logData;
  
  try {
    await database.runAsync(
      'INSERT INTO payment_logs (id, order_id, stripe_event_id, event_type, status, data) VALUES (?, ?, ?, ?, ?, ?)',
      [id, order_id, stripe_event_id, event_type, status, JSON.stringify(data)]
    );
  } catch (error) {
    console.error('Error logging payment event:', error);
    throw error;
  }
}

async function logEmailEvent(logData) {
  const database = getDatabase();
  const { id, consultation_id, customer_email, subject, status, error_message } = logData;
  
  try {
    await database.runAsync(
      'INSERT INTO email_logs (id, consultation_id, customer_email, subject, status, error_message, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, consultation_id, customer_email, subject, status, error_message, status === 'sent' ? new Date().toISOString() : null]
    );
  } catch (error) {
    console.error('Error logging email event:', error);
    throw error;
  }
}

module.exports = {
  getDatabase,
  initializeDatabase,
  createCustomer,
  createOrder,
  updateOrderStatus,
  getOrderByPaymentIntent,
  getOrderByPayPalId,
  updateOrderPayPalCapture,
  createConsultation,
  updateConsultationResult,
  getConsultationById,
  logPaymentEvent,
  logEmailEvent
};