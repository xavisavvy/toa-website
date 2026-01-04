import type { Order } from '../shared/schema';

export interface EmailParams {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  // For now, log the email that would be sent
  console.log('📧 Email would be sent:');
  console.log(`  To: ${params.to}`);
  console.log(`  Subject: ${params.subject}`);
  console.log(`  Body: ${params.body}`);
  
  // Return true to indicate "sent" for testing purposes
  return true;
}

export async function sendOrderConfirmation(
  order: Order,
  items: Array<{ name: string; quantity: number; price: string }>
): Promise<void> {
  const itemsList = items
    .map(item => `  - ${item.name} (x${item.quantity}) - $${item.price}`)
    .join('\n');

  const emailBody = `
Dear ${order.customerName || 'Customer'},

Thank you for your order! We've received your payment and are processing your order.

Order Details:
Order ID: ${order.id}
Total: $${order.totalAmount} ${order.currency.toUpperCase()}

Items:
${itemsList}

${order.shippingAddress ? `
Shipping Address:
${order.shippingAddress.name}
${order.shippingAddress.line1}
${order.shippingAddress.line2 ? order.shippingAddress.line2 + '\n' : ''}${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postal_code}
${order.shippingAddress.country}
` : ''}

You will receive another email with tracking information once your order ships.

If you have any questions, please contact us at ${process.env.SUPPORT_EMAIL || 'support@talesofaneria.com'}.

Best regards,
${process.env.BUSINESS_NAME || 'Tales of Aneria'}
  `.trim();

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Thank you for your order!</h2>
      <p>Dear ${order.customerName || 'Customer'},</p>
      <p>We've received your payment and are processing your order.</p>
      
      <h3>Order Details</h3>
      <p><strong>Order ID:</strong> ${order.id}<br>
      <strong>Total:</strong> $${order.totalAmount} ${order.currency.toUpperCase()}</p>
      
      <h3>Items</h3>
      <ul>
        ${items.map(item => `<li>${item.name} (x${item.quantity}) - $${item.price}</li>`).join('')}
      </ul>
      
      ${order.shippingAddress ? `
        <h3>Shipping Address</h3>
        <p>
          ${order.shippingAddress.name}<br>
          ${order.shippingAddress.line1}<br>
          ${order.shippingAddress.line2 ? order.shippingAddress.line2 + '<br>' : ''}
          ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postal_code}<br>
          ${order.shippingAddress.country}
        </p>
      ` : ''}
      
      <p>You will receive another email with tracking information once your order ships.</p>
      
      <p>If you have any questions, please contact us at ${process.env.SUPPORT_EMAIL || 'support@talesofaneria.com'}.</p>
      
      <p>Best regards,<br>${process.env.BUSINESS_NAME || 'Tales of Aneria'}</p>
    </div>
  `;

  try {
    await sendEmail({
      to: order.customerEmail,
      subject: `Order Confirmation - ${process.env.BUSINESS_NAME || 'Tales of Aneria'}`,
      body: emailBody,
      html: htmlBody,
    });
    console.log(`✅ Order confirmation email sent to ${order.customerEmail}`);
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error);
    throw error;
  }
}

export async function sendPaymentFailureNotification(
  customerEmail: string,
  sessionId: string
): Promise<void> {
  const emailBody = `
Dear Customer,

We were unable to process your payment for order session ${sessionId}.

This can happen for several reasons:
- Insufficient funds
- Bank declined the transaction
- Payment method expired

Please try again or contact your bank for more information.

If you continue to have issues, please contact us at ${process.env.SUPPORT_EMAIL || 'support@talesofaneria.com'}.

Best regards,
${process.env.BUSINESS_NAME || 'Tales of Aneria'}
  `.trim();

  try {
    await sendEmail({
      to: customerEmail,
      subject: `Payment Failed - ${process.env.BUSINESS_NAME || 'Tales of Aneria'}`,
      body: emailBody,
    });
    console.log(`✅ Payment failure notification sent to ${customerEmail}`);
  } catch (error) {
    console.error('❌ Failed to send payment failure notification:', error);
  }
}

export async function sendAdminAlert(
  subject: string,
  message: string,
  metadata?: Record<string, any>
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL || 'admin@talesofaneria.com';
  
  const emailBody = `
${message}

${metadata ? `
Metadata:
${JSON.stringify(metadata, null, 2)}
` : ''}

This is an automated alert from ${process.env.BUSINESS_NAME || 'Tales of Aneria'}.
  `.trim();

  try {
    await sendEmail({
      to: adminEmail,
      subject: `[ADMIN ALERT] ${subject}`,
      body: emailBody,
    });
    console.log(`✅ Admin alert sent: ${subject}`);
  } catch (error) {
    console.error('❌ Failed to send admin alert:', error);
  }
}
