# CrystalEnergy.com Backend Server

Production backend server for CrystalEnergy.com with integrated Stripe and PayPal payments, AI consultations, and email delivery.

## Features

- 🔐 **Secure Payment Processing**: Stripe and PayPal integration
- 🤖 **AI Consultations**: OpenAI GPT-4 powered feng shui readings
- 📧 **Email Delivery**: Automated consultation and order confirmations
- 🔔 **Webhook Support**: Real-time payment status updates
- 🗄️ **SQLite Database**: Complete order and consultation management
- 🛡️ **Security**: Rate limiting, CORS, input validation
- 📊 **Logging**: Comprehensive payment and email event logging

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required configuration:
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `PAYPAL_CLIENT_ID`: Your PayPal client ID
- `PAYPAL_CLIENT_SECRET`: Your PayPal client secret
- `OPENAI_API_KEY`: Your OpenAI API key
- `EMAIL_USER`: SMTP email username
- `EMAIL_PASS`: SMTP email password

### 3. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3001`

### 4. API Documentation

Visit `http://localhost:3001/api` for complete API documentation.

## API Endpoints

### Payments
- `POST /api/payments/stripe/create-intent` - Create Stripe payment
- `POST /api/payments/paypal/create-order` - Create PayPal order
- `POST /api/payments/paypal/capture/:id` - Capture PayPal payment
- `GET /api/payments/methods` - Get supported payment methods

### Consultations
- `POST /api/consultations/generate` - Generate AI consultation
- `GET /api/consultations/:id` - Get consultation result
- `GET /api/consultations/types/pricing` - Get consultation types

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get single product
- `POST /api/products/calculate-total` - Calculate order total
- `GET /api/products/search/:query` - Search products

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook endpoint
- `POST /api/webhooks/paypal` - PayPal webhook endpoint

## Database Schema

The server uses SQLite with the following tables:
- `customers` - Customer information
- `orders` - Order records with payment details
- `consultations` - AI consultation data
- `product_orders` - Product order details
- `payment_logs` - Payment event logging
- `email_logs` - Email delivery tracking

## Payment Integration

### Stripe Setup
1. Get your API keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Configure webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Add webhook secret to environment variables

### PayPal Setup
1. Create app in [PayPal Developer Console](https://developer.paypal.com/)
2. Get Client ID and Secret
3. Configure webhook endpoint: `https://yourdomain.com/api/webhooks/paypal`

## AI Consultation

The server integrates with OpenAI GPT-4 to provide personalized feng shui consultations:

### Consultation Types
- **Basic Reading** ($2.99) - Essential feng shui guidance
- **Detailed Analysis** ($5.99) - Comprehensive BaZi analysis
- **Master Consultation** ($7.99) - Complete life transformation guide

### Fallback System
If OpenAI API is unavailable, the server provides intelligent fallback consultations based on traditional feng shui principles.

## Email Service

Automated email delivery for:
- Consultation results with personalized readings
- Order confirmations with tracking
- Admin notifications for disputes

### Email Configuration
Configure SMTP settings in `.env`:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configured allowed origins
- **Input Validation**: Comprehensive request validation
- **Helmet Security**: Security headers protection
- **Payment Verification**: Webhook signature validation

## Deployment

### Production Environment
1. Set `NODE_ENV=production`
2. Configure production database URL
3. Update frontend URL in CORS settings
4. Set up SSL/TLS certificates
5. Configure webhook endpoints

### Environment Variables
```bash
# Production settings
NODE_ENV=production
PORT=443
FRONTEND_URL=https://your-domain.com
DATABASE_URL=your_production_database_url

# Payment credentials
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=live_client_id
PAYPAL_CLIENT_SECRET=live_secret
PAYPAL_MODE=live

# Services
OPENAI_API_KEY=sk-...
EMAIL_HOST=smtp.provider.com
EMAIL_USER=noreply@your-domain.com
EMAIL_PASS=secure_password
```

## Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Webhook Health
```bash
curl http://localhost:3001/api/webhooks/health
```

### Database Status
The server automatically initializes the database on startup and provides detailed logging for all operations.

## Error Handling

Comprehensive error handling with:
- Structured error responses
- Payment failure recovery
- Email delivery retry logic
- Database transaction rollbacks
- Detailed logging for debugging

## Development

### Running Tests
```bash
npm test
```

### Code Structure
```
backend/
├── routes/           # API route handlers
├── utils/           # Database and service utilities
├── middleware/      # Express middleware
├── .env.example     # Environment template
├── server.js        # Main server file
└── README.md        # This file
```

### Adding New Features
1. Create route handlers in `routes/`
2. Add database functions in `utils/database.js`
3. Update server.js to include new routes
4. Add comprehensive error handling
5. Update API documentation

## Support

For technical issues:
1. Check server logs for detailed error information
2. Verify environment variable configuration
3. Test payment webhook endpoints
4. Validate database connectivity

## License

MIT License - See LICENSE file for details.

---

**CrystalEnergy.com Backend** - Production-ready server for feng shui e-commerce with AI consultations.