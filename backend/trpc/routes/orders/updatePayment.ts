import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { updatePaymentStatus } from "@/backend/db/models/orders";
import { TRPCError } from "@trpc/server";

export default publicProcedure
  .input(
    z.object({
      orderId: z.string(),
      paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']),
      stripeChargeId: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const order = await updatePaymentStatus(
      input.orderId,
      input.paymentStatus,
      input.stripeChargeId
    );

    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    return {
      orderId: order.id,
      orderNumber: order.order_number,
      paymentStatus: order.payment_status,
      status: order.status,
    };
  });
