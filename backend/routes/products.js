const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Product catalog
const PRODUCTS = [
  {
    id: 'amethyst-cluster',
    name: 'Amethyst Cluster',
    description: 'Natural amethyst cluster for wisdom and spiritual growth. Perfect for meditation spaces and bedrooms.',
    price: 4500, // $45.00 in cents
    category: 'crystals',
    inStock: true,
    weight: '200g',
    origin: 'Brazil',
    chakra: 'Crown',
    properties: ['Wisdom', 'Intuition', 'Spiritual Growth', 'Calming'],
    imageUrl: '/images/amethyst-cluster.jpg',
    featured: true
  },
  {
    id: 'rose-quartz-heart',
    name: 'Rose Quartz Heart',
    description: 'Beautiful rose quartz heart for love and emotional healing. Ideal for relationship corners.',
    price: 2800, // $28.00
    category: 'crystals',
    inStock: true,
    weight: '150g',
    origin: 'Madagascar',
    chakra: 'Heart',
    properties: ['Love', 'Compassion', 'Emotional Healing', 'Self-Love'],
    imageUrl: '/images/rose-quartz-heart.jpg',
    featured: true
  },
  {
    id: 'citrine-tumbled',
    name: 'Citrine Tumbled Stones',
    description: 'Set of 3 natural citrine tumbled stones for abundance and prosperity. Perfect for wealth corners.',
    price: 1800, // $18.00
    category: 'crystals',
    inStock: true,
    weight: '75g',
    origin: 'Brazil',
    chakra: 'Solar Plexus',
    properties: ['Abundance', 'Prosperity', 'Confidence', 'Success'],
    imageUrl: '/images/citrine-tumbled.jpg',
    featured: true
  },
  {
    id: 'black-tourmaline-raw',
    name: 'Black Tourmaline Raw',
    description: 'Powerful protection stone. Perfect for entry ways and workspaces to block negative energy.',
    price: 3200, // $32.00
    category: 'crystals',
    inStock: true,
    weight: '180g',
    origin: 'Brazil',
    chakra: 'Root',
    properties: ['Protection', 'Grounding', 'EMF Shield', 'Clarity'],
    imageUrl: '/images/black-tourmaline-raw.jpg',
    featured: false
  },
  {
    id: 'clear-quartz-sphere',
    name: 'Clear Quartz Sphere',
    description: 'Master healer crystal sphere for amplifying energy and clarity. Universal feng shui enhancer.',
    price: 5500, // $55.00
    category: 'crystals',
    inStock: true,
    weight: '250g',
    origin: 'Arkansas, USA',
    chakra: 'All',
    properties: ['Amplification', 'Clarity', 'Healing', 'Energy Cleansing'],
    imageUrl: '/images/clear-quartz-sphere.jpg',
    featured: false
  },
  {
    id: 'feng-shui-starter-kit',
    name: 'Feng Shui Starter Kit',
    description: 'Complete feng shui crystal starter kit with 5 essential stones, placement guide, and silk pouch.',
    price: 8900, // $89.00
    category: 'kits',
    inStock: true,
    weight: '400g',
    origin: 'Various',
    includes: ['Amethyst', 'Rose Quartz', 'Citrine', 'Black Tourmaline', 'Clear Quartz', 'Placement Guide', 'Silk Pouch'],
    properties: ['Complete Protection', 'Love & Abundance', 'Spiritual Growth'],
    imageUrl: '/images/feng-shui-starter-kit.jpg',
    featured: true,
    bestseller: true
  }
];

// Input validation for purchase
const validatePurchaseRequest = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isString().withMessage('Product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('customerEmail').isEmail().withMessage('Valid email is required'),
  body('customerName').isLength({ min: 2 }).withMessage('Customer name is required'),
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  body('shippingAddress.street').isLength({ min: 5 }).withMessage('Street address is required'),
  body('shippingAddress.city').isLength({ min: 2 }).withMessage('City is required'),
  body('shippingAddress.postalCode').isLength({ min: 3 }).withMessage('Postal code is required'),
  body('shippingAddress.country').isLength({ min: 2 }).withMessage('Country is required')
];

// Get all products
router.get('/', (req, res) => {
  try {
    const { category, featured, inStock } = req.query;
    
    let filteredProducts = [...PRODUCTS];
    
    // Apply filters
    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    
    if (featured === 'true') {
      filteredProducts = filteredProducts.filter(p => p.featured === true);
    }
    
    if (inStock === 'true') {
      filteredProducts = filteredProducts.filter(p => p.inStock === true);
    }
    
    res.json({
      success: true,
      count: filteredProducts.length,
      products: filteredProducts
    });
    
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      error: 'Failed to retrieve products',
      message: error.message
    });
  }
});

// Get single product
router.get('/:productId', (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = PRODUCTS.find(p => p.id === productId);
    
    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      product: product
    });
    
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      error: 'Failed to retrieve product',
      message: error.message
    });
  }
});

// Calculate shipping cost
function calculateShipping(items, shippingAddress) {
  // Simple shipping calculation
  const totalWeight = items.reduce((total, item) => {
    const product = PRODUCTS.find(p => p.id === item.productId);
    if (product && product.weight) {
      const weight = parseFloat(product.weight.replace('g', ''));
      return total + (weight * item.quantity);
    }
    return total;
  }, 0);
  
  // Shipping rates (in cents)
  const baseShipping = 800; // $8.00 base
  const weightShipping = Math.ceil(totalWeight / 100) * 200; // $2.00 per 100g
  
  // International shipping
  if (shippingAddress.country.toLowerCase() !== 'usa' && 
      shippingAddress.country.toLowerCase() !== 'united states') {
    return baseShipping + weightShipping + 1500; // Additional $15 for international
  }
  
  return Math.min(baseShipping + weightShipping, 2500); // Max $25 domestic shipping
}

// Calculate order total
router.post('/calculate-total', [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isString().withMessage('Product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shippingAddress').optional().isObject()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    const { items, shippingAddress } = req.body;
    
    let subtotal = 0;
    const orderItems = [];
    
    // Calculate subtotal and validate items
    for (const item of items) {
      const product = PRODUCTS.find(p => p.id === item.productId);
      
      if (!product) {
        return res.status(400).json({
          error: `Product not found: ${item.productId}`
        });
      }
      
      if (!product.inStock) {
        return res.status(400).json({
          error: `Product out of stock: ${product.name}`
        });
      }
      
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      
      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal
      });
    }
    
    // Calculate shipping
    const shipping = shippingAddress ? calculateShipping(items, shippingAddress) : 0;
    
    // Calculate tax (simple 8.5% for demo)
    const tax = Math.round(subtotal * 0.085);
    
    const total = subtotal + shipping + tax;
    
    res.json({
      success: true,
      calculation: {
        items: orderItems,
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        total: total,
        currency: 'usd'
      }
    });
    
  } catch (error) {
    console.error('Error calculating total:', error);
    res.status(500).json({
      error: 'Failed to calculate total',
      message: error.message
    });
  }
});

// Process product purchase
router.post('/purchase', validatePurchaseRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    const { 
      items, 
      customerEmail, 
      customerName, 
      shippingAddress,
      paymentMethod = 'stripe'
    } = req.body;
    
    // Calculate order total
    const calculation = await calculateOrderTotal(items, shippingAddress);
    
    if (!calculation.success) {
      return res.status(400).json(calculation);
    }
    
    // Create order data
    const orderData = {
      customerEmail,
      customerName,
      orderType: 'product',
      amount: calculation.total,
      currency: 'usd',
      paymentMethod,
      metadata: {
        items: calculation.items,
        shippingAddress,
        subtotal: calculation.subtotal,
        shipping: calculation.shipping,
        tax: calculation.tax
      }
    };
    
    res.json({
      success: true,
      message: 'Use payment endpoints to complete purchase',
      orderData: orderData,
      calculation: calculation,
      nextSteps: [
        'Call /api/payments/stripe/create-intent or /api/payments/paypal/create-order',
        'Complete payment with returned payment information',
        'Order will be processed after successful payment'
      ]
    });
    
  } catch (error) {
    console.error('Error processing purchase:', error);
    res.status(500).json({
      error: 'Failed to process purchase',
      message: error.message
    });
  }
});

// Helper function to calculate order total
async function calculateOrderTotal(items, shippingAddress) {
  try {
    let subtotal = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = PRODUCTS.find(p => p.id === item.productId);
      
      if (!product) {
        return {
          success: false,
          error: `Product not found: ${item.productId}`
        };
      }
      
      if (!product.inStock) {
        return {
          success: false,
          error: `Product out of stock: ${product.name}`
        };
      }
      
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      
      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal
      });
    }
    
    const shipping = calculateShipping(items, shippingAddress);
    const tax = Math.round(subtotal * 0.085);
    const total = subtotal + shipping + tax;
    
    return {
      success: true,
      items: orderItems,
      subtotal,
      shipping,
      tax,
      total,
      currency: 'usd'
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Failed to calculate order total',
      message: error.message
    };
  }
}

// Get product categories
router.get('/categories/list', (req, res) => {
  const categories = [...new Set(PRODUCTS.map(p => p.category))];
  
  res.json({
    success: true,
    categories: categories.map(cat => ({
      id: cat,
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      count: PRODUCTS.filter(p => p.category === cat).length
    }))
  });
});

// Search products
router.get('/search/:query', (req, res) => {
  try {
    const { query } = req.params;
    const searchTerm = query.toLowerCase();
    
    const results = PRODUCTS.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.properties.some(prop => prop.toLowerCase().includes(searchTerm)) ||
      (product.chakra && product.chakra.toLowerCase().includes(searchTerm))
    );
    
    res.json({
      success: true,
      query: query,
      count: results.length,
      results: results
    });
    
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

module.exports = router;