// Email Service Integration (Klaviyo / SendGrid)
// Choose one based on preference:
// - Klaviyo: Better for e-commerce, marketing automation
// - SendGrid: More general purpose, transactional emails

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface EmailTemplate {
  type: 'welcome' | 'order_confirmation' | 'shipping_notification' | 'abandoned_cart' | 'vip_offer';
  data: Record<string, any>;
}

/**
 * Send a transactional email using SendGrid
 *
 * Usage:
 * await sendEmail({
 *   to: 'customer@example.com',
 *   subject: 'Your Order Confirmation',
 *   html: '<h1>Thank you for your order!</h1>'
 * });
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  // TODO: Install SendGrid: bun add @sendgrid/mail
  // import sgMail from '@sendgrid/mail';

  // sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

  // const msg = {
  //   to: input.to,
  //   from: input.from || process.env.SENDGRID_FROM_EMAIL!,
  //   subject: input.subject,
  //   html: input.html,
  // };

  // await sgMail.send(msg);

  console.log('Email would be sent to:', input.to, 'Subject:', input.subject);
}

/**
 * Add email to Klaviyo list
 *
 * Usage:
 * await addToEmailList('customer@example.com', {
 *   source: 'waitlist',
 *   productId: 'product_123'
 * });
 */
export async function addToEmailList(
  email: string,
  metadata?: Record<string, any>
): Promise<void> {
  // TODO: Install Klaviyo SDK or use fetch API
  // const response = await fetch('https://a.klaviyo.com/api/v2/list/LIST_ID/subscribe', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY}`,
  //   },
  //   body: JSON.stringify({
  //     profiles: [{
  //       email,
  //       ...metadata,
  //     }],
  //   }),
  // });

  console.log('Email would be added to list:', email, 'Metadata:', metadata);
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(
  email: string,
  orderDetails: {
    orderNumber: string;
    total: number;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  }
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 40px 0; border-bottom: 1px solid #eee; }
          .order-details { margin: 30px 0; }
          .item { padding: 15px 0; border-bottom: 1px solid #f0f0f0; }
          .total { font-size: 18px; font-weight: bold; padding: 20px 0; }
          .footer { text-align: center; padding: 30px 0; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="letter-spacing: 2px; font-weight: 300;">YÈMALÍN</h1>
            <p style="color: #666;">Order Confirmation</p>
          </div>

          <div class="order-details">
            <p>Thank you for your order!</p>
            <p><strong>Order Number:</strong> ${orderDetails.orderNumber}</p>

            <div style="margin: 20px 0;">
              ${orderDetails.items.map(item => `
                <div class="item">
                  <div>${item.name}</div>
                  <div style="color: #666;">Qty: ${item.quantity} × $${item.price.toFixed(2)}</div>
                </div>
              `).join('')}
            </div>

            <div class="total">
              Total: $${orderDetails.total.toFixed(2)}
            </div>

            <p style="margin-top: 30px;">
              You will receive a shipping confirmation email once your order ships.
            </p>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} YÈMALÍN. All rights reserved.</p>
            <p>Questions? Contact us at support@yemalin.com</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Order Confirmation - ${orderDetails.orderNumber}`,
    html,
  });
}

/**
 * Send shipping notification email
 */
export async function sendShippingNotification(
  email: string,
  orderDetails: {
    orderNumber: string;
    trackingNumber: string;
    carrier?: string;
  }
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 40px 0;">
            <h1 style="letter-spacing: 2px; font-weight: 300;">YÈMALÍN</h1>
            <p style="color: #666;">Your Order Has Shipped</p>
          </div>

          <p>Great news! Your order <strong>${orderDetails.orderNumber}</strong> has shipped.</p>

          <div style="background: #f8f8f8; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <p><strong>Tracking Number:</strong></p>
            <p style="font-size: 18px; font-family: monospace;">${orderDetails.trackingNumber}</p>
            ${orderDetails.carrier ? `<p><strong>Carrier:</strong> ${orderDetails.carrier}</p>` : ''}
          </div>

          <p>Your order should arrive within 3-5 business days.</p>

          <div style="text-align: center; padding: 30px 0; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} YÈMALÍN. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Your Order Has Shipped - ${orderDetails.orderNumber}`,
    html,
  });
}

/**
 * Send abandoned cart recovery email
 */
export async function sendAbandonedCartEmail(
  email: string,
  cartDetails: {
    items: Array<{
      name: string;
      image: string;
      price: number;
    }>;
    cartValue: number;
  }
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 40px 0;">
            <h1 style="letter-spacing: 2px; font-weight: 300;">YÈMALÍN</h1>
            <p style="color: #666;">You Left Something Behind</p>
          </div>

          <p>Complete your order before these luxury items are gone.</p>

          <div style="margin: 20px 0;">
            ${cartDetails.items.map(item => `
              <div style="padding: 15px 0; border-bottom: 1px solid #f0f0f0;">
                <div>${item.name}</div>
                <div style="color: #666;">$${item.price.toFixed(2)}</div>
              </div>
            `).join('')}
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://yemalin.com/cart" style="display: inline-block; background: #000; color: #fff; padding: 15px 40px; text-decoration: none; letter-spacing: 1px;">
              COMPLETE YOUR ORDER
            </a>
          </div>

          <div style="text-align: center; padding: 30px 0; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} YÈMALÍN. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Complete Your YÈMALÍN Order',
    html,
  });
}

/**
 * Send welcome email to new subscribers
 */
export async function sendWelcomeEmail(email: string, name?: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 40px 0;">
            <h1 style="letter-spacing: 2px; font-weight: 300;">YÈMALÍN</h1>
            <p style="color: #666;">Welcome to Luxury</p>
          </div>

          <p>${name ? `Hi ${name},` : 'Hello,'}</p>

          <p>Thank you for joining the YÈMALÍN family. You now have exclusive access to:</p>

          <ul style="line-height: 2;">
            <li>Limited edition releases</li>
            <li>Early access to new collections</li>
            <li>VIP member benefits</li>
            <li>Behind-the-scenes content</li>
          </ul>

          <div style="text-align: center; margin: 40px 0;">
            <a href="https://yemalin.com/shop" style="display: inline-block; background: #000; color: #fff; padding: 15px 40px; text-decoration: none; letter-spacing: 1px;">
              SHOP NOW
            </a>
          </div>

          <div style="text-align: center; padding: 30px 0; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} YÈMALÍN. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to YÈMALÍN',
    html,
  });
}
