import { protectedProcedure } from "@/backend/trpc/create-context";
import { getOrdersByUser } from "@/backend/db/models/orders";

export default protectedProcedure.query(async ({ ctx }) => {
  const orders = await getOrdersByUser(ctx.user.id);

  return orders.map(order => ({
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    subtotal: order.subtotal,
    shippingCost: order.shipping_cost,
    tax: order.tax,
    total: order.total,
    trackingNumber: order.tracking_number,
    shippedAt: order.shipped_at,
    deliveredAt: order.delivered_at,
    createdAt: order.created_at,
    items: order.items.map(item => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      productImage: item.product_image,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    })),
  }));
});
