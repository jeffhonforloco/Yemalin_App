// Stripe Payment Integration
// Note: Install stripe package: bun add stripe

interface CreatePaymentIntentInput {
  amount: number; // in cents
  currency?: string;
  orderId: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

/**
 * Creates a Stripe Payment Intent
 *
 * Usage:
 * const result = await createPaymentIntent({
 *   amount: 19900, // $199.00
 *   orderId: 'order_123',
 *   customerEmail: 'customer@example.com'
 * });
 *
 * Send result.clientSecret to the frontend
 */
export async function createPaymentIntent(
  input: CreatePaymentIntentInput
): Promise<PaymentIntentResult> {
  // TODO: Install and import Stripe
  // import Stripe from 'stripe';
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  //   apiVersion: '2024-12-18.acacia',
  // });

  // Create payment intent
  // const paymentIntent = await stripe.paymentIntents.create({
  //   amount: input.amount,
  //   currency: input.currency || 'usd',
  //   automatic_payment_methods: {
  //     enabled: true,
  //   },
  //   metadata: {
  //     orderId: input.orderId,
  //     ...input.metadata,
  //   },
  //   receipt_email: input.customerEmail,
  // });

  // return {
  //   clientSecret: paymentIntent.client_secret!,
  //   paymentIntentId: paymentIntent.id,
  // };

  // Placeholder for now
  throw new Error('Stripe not yet configured. Please install stripe package and configure API keys.');
}

/**
 * Verify Stripe webhook signature
 *
 * Usage in webhook endpoint:
 * const event = verifyWebhookSignature(rawBody, signature);
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string
): any {
  // TODO: Install and import Stripe
  // import Stripe from 'stripe';
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  //   apiVersion: '2024-12-18.acacia',
  // });

  // const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  // return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  throw new Error('Stripe webhook verification not yet configured');
}

/**
 * Process successful payment
 * Called from webhook handler when payment succeeds
 */
export async function handlePaymentSuccess(
  paymentIntentId: string,
  chargeId: string
): Promise<void> {
  // Import order model
  // import { updatePaymentStatus } from '../db/models/orders';

  // Get order ID from payment intent metadata
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  // const orderId = paymentIntent.metadata.orderId;

  // Update order payment status
  // await updatePaymentStatus(orderId, 'paid', chargeId);

  console.log('Payment success handler called for:', paymentIntentId);
}

/**
 * Process failed payment
 * Called from webhook handler when payment fails
 */
export async function handlePaymentFailure(
  paymentIntentId: string
): Promise<void> {
  // Import order model
  // import { updatePaymentStatus } from '../db/models/orders';

  // Get order ID from payment intent metadata
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  // const orderId = paymentIntent.metadata.orderId;

  // Update order payment status
  // await updatePaymentStatus(orderId, 'failed');

  console.log('Payment failure handler called for:', paymentIntentId);
}

/**
 * Create a refund for an order
 */
export async function createRefund(
  chargeId: string,
  amount?: number
): Promise<{ refundId: string }> {
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // const refund = await stripe.refunds.create({
  //   charge: chargeId,
  //   amount, // Optional: partial refund
  // });

  // return { refundId: refund.id };

  throw new Error('Stripe refund not yet configured');
}
