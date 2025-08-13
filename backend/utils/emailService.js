const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { 
  logEmailEvent,
  getConsultationById,
  createCustomer
} = require('./database');

// Email configuration
let transporter;

function getEmailTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return transporter;
}

// Email templates
const emailTemplates = {
  consultationReady: {
    subject: '🔮 Your Feng Shui Consultation is Ready - CrystalEnergy.com',
    html: (consultationData) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Feng Shui Consultation</title>
        <style>
          body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .consultation-result { background: #f8f9fa; padding: 30px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #667eea; }
          .consultation-result h2 { color: #667eea; margin-top: 0; }
          .consultation-result pre { white-space: pre-wrap; font-family: 'Georgia', serif; font-size: 16px; line-height: 1.7; }
          .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; font-size: 14px; }
          .footer a { color: #3498db; text-decoration: none; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .note { background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db; }
          .crystal-icon { font-size: 2em; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="crystal-icon">💎</div>
            <div class="logo">CrystalEnergy.com</div>
            <h1>Your Personal Feng Shui Consultation</h1>
            <p>Prepared with wisdom and ancient knowledge</p>
          </div>
          
          <div class="content">
            <p>Dear ${consultationData.customerName},</p>
            
            <p>Thank you for choosing CrystalEnergy.com for your feng shui consultation. Your personalized reading has been carefully prepared by our advanced AI system, trained on thousands of years of feng shui wisdom and traditional practices.</p>
            
            <div class="consultation-result">
              <h2>🌟 Your Personal Feng Shui Reading</h2>
              <pre>${consultationData.result}</pre>
            </div>
            
            <div class="note">
              <h3>📧 How to Use This Reading</h3>
              <p>Your consultation contains specific, actionable advice based on your birth information and personal questions. We recommend:</p>
              <ul>
                <li>Read through your consultation 2-3 times to fully absorb the guidance</li>
                <li>Implement the suggested changes gradually over 2-4 weeks</li>
                <li>Keep this email for future reference as you make adjustments</li>
                <li>Trust your intuition about what feels right for your space</li>
              </ul>
            </div>
            
            <div class="note">
              <h3>🛍️ Recommended Crystals</h3>
              <p>Based on your consultation, you may want to explore these crystals in our collection:</p>
              <ul>
                <li><strong>Amethyst</strong> - For wisdom and spiritual growth</li>
                <li><strong>Rose Quartz</strong> - For love and emotional healing</li>
                <li><strong>Citrine</strong> - For abundance and prosperity</li>
                <li><strong>Black Tourmaline</strong> - For protection and grounding</li>
              </ul>
              <p><a href="${process.env.FRONTEND_URL}#products">Browse our complete crystal collection →</a></p>
            </div>
            
            <p>If you have any questions about your reading or need clarification on any recommendations, please don't hesitate to reach out to us.</p>
            
            <p>May your journey be filled with harmony, abundance, and positive energy.</p>
            
            <p>With gratitude,<br>
            <strong>The CrystalEnergy.com Team</strong></p>
          </div>
          
          <div class="footer">
            <p><strong>CrystalEnergy.com</strong> - Ancient Wisdom for Modern Living</p>
            <p>
              <a href="${process.env.FRONTEND_URL}">Visit our website</a> | 
              <a href="${process.env.FRONTEND_URL}#consultation">Book another consultation</a>
            </p>
            <p style="font-size: 12px; color: #95a5a6; margin-top: 20px;">
              This consultation was generated using advanced AI trained on traditional feng shui principles. 
              For entertainment and guidance purposes. Individual results may vary.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (consultationData) => `
Your Feng Shui Consultation - CrystalEnergy.com

Dear ${consultationData.customerName},

Thank you for choosing CrystalEnergy.com for your feng shui consultation. Your personalized reading has been carefully prepared.

YOUR PERSONAL FENG SHUI READING:
${consultationData.result}

HOW TO USE THIS READING:
- Read through your consultation 2-3 times to fully absorb the guidance
- Implement the suggested changes gradually over 2-4 weeks  
- Keep this email for future reference as you make adjustments
- Trust your intuition about what feels right for your space

RECOMMENDED CRYSTALS:
Based on your consultation, you may want to explore these crystals:
- Amethyst - For wisdom and spiritual growth
- Rose Quartz - For love and emotional healing
- Citrine - For abundance and prosperity
- Black Tourmaline - For protection and grounding

Browse our complete collection at: ${process.env.FRONTEND_URL}#products

If you have any questions about your reading, please don't hesitate to reach out.

May your journey be filled with harmony, abundance, and positive energy.

With gratitude,
The CrystalEnergy.com Team

Visit: ${process.env.FRONTEND_URL}
    `
  },

  orderConfirmation: {
    subject: '✨ Order Confirmation - CrystalEnergy.com',
    html: (orderData) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .order-summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💎 Order Confirmed!</h1>
            <p>Thank you for your purchase</p>
          </div>
          
          <div class="content">
            <p>Dear ${orderData.customerName},</p>
            
            <p>Your order has been confirmed and will be prepared with love and care.</p>
            
            <div class="order-summary">
              <h3>Order #${orderData.orderId}</h3>
              <p><strong>Total:</strong> $${(orderData.total / 100).toFixed(2)}</p>
              <p><strong>Shipping Address:</strong><br>
              ${orderData.shippingAddress}</p>
            </div>
            
            <p>You will receive a shipping notification once your crystals are on their way.</p>
            
            <p>With gratitude,<br>The CrystalEnergy.com Team</p>
          </div>
          
          <div class="footer">
            <p>CrystalEnergy.com - Ancient Wisdom for Modern Living</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
};

// Send consultation email
async function sendConsultationEmail(consultationId, customerEmail, customerName) {
  try {
    console.log(`📧 Preparing consultation email for: ${customerEmail}`);
    
    // Get consultation data
    const consultation = await getConsultationById(consultationId);
    if (!consultation) {
      throw new Error('Consultation not found');
    }

    if (!consultation.ai_result) {
      throw new Error('Consultation result not available');
    }

    const consultationData = {
      customerName: customerName,
      result: consultation.ai_result,
      consultationType: consultation.consultation_type,
      consultationId: consultationId
    };

    // Prepare email
    const template = emailTemplates.consultationReady;
    const mailOptions = {
      from: `"CrystalEnergy.com" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: template.subject,
      html: template.html(consultationData),
      text: template.text(consultationData)
    };

    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('📧 Email not configured - logging email content instead');
      
      // Log email event as sent for demo purposes
      await logEmailEvent({
        id: uuidv4(),
        consultation_id: consultationId,
        customer_email: customerEmail,
        subject: template.subject,
        status: 'sent',
        error_message: null
      });
      
      // In production, you would configure real email service
      console.log('Demo mode - Email would be sent to:', customerEmail);
      console.log('Subject:', template.subject);
      
      return {
        success: true,
        message: 'Email sent successfully (demo mode)',
        emailId: uuidv4()
      };
    }

    // Send email
    const info = await getEmailTransporter().sendMail(mailOptions);
    
    // Log successful email
    await logEmailEvent({
      id: uuidv4(),
      consultation_id: consultationId,
      customer_email: customerEmail,
      subject: template.subject,
      status: 'sent',
      error_message: null
    });

    console.log('✅ Consultation email sent successfully:', info.messageId);
    
    return {
      success: true,
      message: 'Email sent successfully',
      emailId: info.messageId
    };

  } catch (error) {
    console.error('❌ Failed to send consultation email:', error);
    
    // Log failed email
    await logEmailEvent({
      id: uuidv4(),
      consultation_id: consultationId,
      customer_email: customerEmail,
      subject: emailTemplates.consultationReady.subject,
      status: 'failed',
      error_message: error.message
    });

    return {
      success: false,
      error: error.message
    };
  }
}

// Send order confirmation email
async function sendOrderConfirmationEmail(orderData) {
  try {
    console.log(`📧 Sending order confirmation to: ${orderData.customerEmail}`);
    
    const template = emailTemplates.orderConfirmation;
    const mailOptions = {
      from: `"CrystalEnergy.com" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: orderData.customerEmail,
      subject: template.subject,
      html: template.html(orderData)
    };

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('📧 Email not configured - demo mode');
      return {
        success: true,
        message: 'Order confirmation sent (demo mode)'
      };
    }

    const info = await getEmailTransporter().sendMail(mailOptions);
    
    console.log('✅ Order confirmation sent:', info.messageId);
    
    return {
      success: true,
      message: 'Order confirmation sent',
      emailId: info.messageId
    };

  } catch (error) {
    console.error('❌ Failed to send order confirmation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Send notification email to admin
async function sendAdminNotification(type, data) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (!adminEmail) return;

    let subject = '';
    let content = '';

    switch (type) {
      case 'new_order':
        subject = `🛍️ New Order - CrystalEnergy.com`;
        content = `New order received: ${data.orderId}\nCustomer: ${data.customerName}\nTotal: $${(data.total / 100).toFixed(2)}`;
        break;
      case 'new_consultation':
        subject = `🔮 New Consultation - CrystalEnergy.com`;
        content = `New consultation: ${data.consultationType}\nCustomer: ${data.customerName}`;
        break;
      case 'payment_dispute':
        subject = `⚠️ Payment Dispute - Action Required`;
        content = `Payment dispute created for order: ${data.orderId}`;
        break;
      default:
        return;
    }

    const mailOptions = {
      from: `"CrystalEnergy.com" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: subject,
      text: content
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await getEmailTransporter().sendMail(mailOptions);
      console.log('✅ Admin notification sent:', type);
    }

  } catch (error) {
    console.error('❌ Failed to send admin notification:', error);
  }
}

// Test email configuration
async function testEmailConfiguration() {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return {
        success: false,
        message: 'Email credentials not configured'
      };
    }

    const transporter = getEmailTransporter();
    await transporter.verify();
    
    return {
      success: true,
      message: 'Email configuration is valid'
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Email configuration error: ${error.message}`
    };
  }
}

module.exports = {
  sendConsultationEmail,
  sendOrderConfirmationEmail,
  sendAdminNotification,
  testEmailConfiguration
};