import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { createOrder } from "@/backend/db/models/orders";
import { checkProductAvailability } from "@/backend/db/models/products";
import { TRPCError } from "@trpc/server";

const orderItemSchema = z.object({
  product_id: z.string(),
  product_name: z.string(),
  product_image: z.string(),
  size: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

const shippingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
  shipping: shippingSchema,
  payment_method: z.string(),
  stripe_payment_intent_id: z.string().optional(),
});

export default publicProcedure
  .input(createOrderSchema)
  .mutation(async ({ input, ctx }) => {
    // Calculate totals
    const subtotal = input.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shipping_cost = subtotal > 150 ? 0 : 15;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping_cost + tax;

    // Check stock availability for all items
    for (const item of input.items) {
      const available = await checkProductAvailability(
        item.product_id,
        item.size,
        item.quantity
      );

      if (!available) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Product "${item.product_name}" (size ${item.size}) is not available in the requested quantity`,
        });
      }
    }

    // Create order
    const order = await createOrder({
      user_id: ctx.user?.id,
      items: input.items,
      subtotal,
      shipping_cost,
      tax,
      total,
      shipping: input.shipping,
      payment_method: input.payment_method,
      stripe_payment_intent_id: input.stripe_payment_intent_id,
    });

    return {
      orderId: order.id,
      orderNumber: order.order_number,
      total: order.total,
      status: order.status,
      paymentStatus: order.payment_status,
    };
  });
