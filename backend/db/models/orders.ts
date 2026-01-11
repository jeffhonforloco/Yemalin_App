import { query, queryOne, transaction } from '../connection';
import { decrementProductStock } from './products';
import { updateUserSpentAndVIP } from './users';

export interface Order {
  id: string;
  user_id: string | null;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  shipping_name: string | null;
  shipping_email: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_zip: string | null;
  shipping_country: string | null;
  payment_method: string | null;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  tracking_number: string | null;
  shipped_at: Date | null;
  delivered_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  size: string | null;
  quantity: number;
  price: number;
  subtotal: number;
  created_at: Date;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface CreateOrderInput {
  user_id?: string;
  items: {
    product_id: string;
    product_name: string;
    product_image: string;
    size: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  shipping: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  payment_method: string;
  stripe_payment_intent_id?: string;
}

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `YM-${timestamp}-${random}`;
}

// Create new order
export async function createOrder(input: CreateOrderInput): Promise<OrderWithItems> {
  return await transaction(async (client) => {
    const orderNumber = generateOrderNumber();

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (
        user_id, order_number, status, subtotal, shipping_cost, tax, total,
        shipping_name, shipping_email, shipping_phone, shipping_address,
        shipping_city, shipping_state, shipping_zip, shipping_country,
        payment_method, payment_status, stripe_payment_intent_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        input.user_id || null,
        orderNumber,
        'pending',
        input.subtotal,
        input.shipping_cost,
        input.tax,
        input.total,
        input.shipping.name,
        input.shipping.email,
        input.shipping.phone,
        input.shipping.address,
        input.shipping.city,
        input.shipping.state,
        input.shipping.zip,
        input.shipping.country,
        input.payment_method,
        'pending',
        input.stripe_payment_intent_id || null,
      ]
    );

    const order = orderResult.rows[0];

    // Create order items and update stock
    const orderItems: OrderItem[] = [];
    for (const item of input.items) {
      const itemResult = await client.query(
        `INSERT INTO order_items (
          order_id, product_id, product_name, product_image,
          size, quantity, price, subtotal
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          order.id,
          item.product_id,
          item.product_name,
          item.product_image,
          item.size,
          item.quantity,
          item.price,
          item.price * item.quantity,
        ]
      );
      orderItems.push(itemResult.rows[0]);

      // Decrement product stock
      await decrementProductStock(item.product_id, item.size, item.quantity);
    }

    return {
      ...order,
      items: orderItems,
    };
  });
}

// Get order by ID
export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
  const order = await queryOne<Order>(
    'SELECT * FROM orders WHERE id = $1',
    [orderId]
  );

  if (!order) return null;

  const items = await query<OrderItem>(
    'SELECT * FROM order_items WHERE order_id = $1',
    [orderId]
  );

  return {
    ...order,
    items,
  };
}

// Get order by order number
export async function getOrderByNumber(orderNumber: string): Promise<OrderWithItems | null> {
  const order = await queryOne<Order>(
    'SELECT * FROM orders WHERE order_number = $1',
    [orderNumber]
  );

  if (!order) return null;

  const items = await query<OrderItem>(
    'SELECT * FROM order_items WHERE order_id = $1',
    [order.id]
  );

  return {
    ...order,
    items,
  };
}

// Get orders by user
export async function getOrdersByUser(userId: string): Promise<OrderWithItems[]> {
  const orders = await query<Order>(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );

  const orderIds = orders.map(o => o.id);
  if (orderIds.length === 0) return [];

  const items = await query<OrderItem>(
    'SELECT * FROM order_items WHERE order_id = ANY($1)',
    [orderIds]
  );

  const itemsByOrder = items.reduce((acc, item) => {
    if (!acc[item.order_id]) acc[item.order_id] = [];
    acc[item.order_id].push(item);
    return acc;
  }, {} as Record<string, OrderItem[]>);

  return orders.map(order => ({
    ...order,
    items: itemsByOrder[order.id] || [],
  }));
}

// Update order status
export async function updateOrderStatus(
  orderId: string,
  status: Order['status'],
  trackingNumber?: string
): Promise<Order | null> {
  const fields = ['status = $1'];
  const values: any[] = [status];
  let paramCount = 2;

  if (status === 'shipped') {
    fields.push('shipped_at = CURRENT_TIMESTAMP');
    if (trackingNumber) {
      fields.push(`tracking_number = $${paramCount++}`);
      values.push(trackingNumber);
    }
  }

  if (status === 'delivered') {
    fields.push('delivered_at = CURRENT_TIMESTAMP');
  }

  values.push(orderId);
  return await queryOne<Order>(
    `UPDATE orders
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );
}

// Update payment status
export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: Order['payment_status'],
  stripeChargeId?: string
): Promise<Order | null> {
  const order = await transaction(async (client) => {
    const result = await client.query(
      `UPDATE orders
       SET payment_status = $1, stripe_charge_id = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [paymentStatus, stripeChargeId || null, orderId]
    );

    const updatedOrder = result.rows[0];

    // If payment is successful, update order status and user stats
    if (paymentStatus === 'paid' && updatedOrder) {
      await client.query(
        "UPDATE orders SET status = 'processing' WHERE id = $1",
        [orderId]
      );

      // Update user's total spent if they're logged in
      if (updatedOrder.user_id) {
        await updateUserSpentAndVIP(updatedOrder.user_id, updatedOrder.total);
      }
    }

    return result.rows[0];
  });

  return order || null;
}

// Cancel order (restore stock)
export async function cancelOrder(orderId: string): Promise<Order | null> {
  return await transaction(async (client) => {
    // Get order items
    const items = await client.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );

    // Restore stock for each item
    for (const item of items.rows) {
      await client.query(
        `UPDATE product_sizes
         SET stock = stock + $1
         WHERE product_id = $2 AND size = $3`,
        [item.quantity, item.product_id, item.size]
      );

      await client.query(
        'UPDATE products SET stock = stock + $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // Update order status
    const result = await client.query(
      `UPDATE orders
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [orderId]
    );

    return result.rows[0] || null;
  });
}

// Get all orders (admin)
export async function getAllOrders(
  limit: number = 50,
  offset: number = 0
): Promise<OrderWithItems[]> {
  const orders = await query<Order>(
    `SELECT * FROM orders
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  if (orders.length === 0) return [];

  const orderIds = orders.map(o => o.id);
  const items = await query<OrderItem>(
    'SELECT * FROM order_items WHERE order_id = ANY($1)',
    [orderIds]
  );

  const itemsByOrder = items.reduce((acc, item) => {
    if (!acc[item.order_id]) acc[item.order_id] = [];
    acc[item.order_id].push(item);
    return acc;
  }, {} as Record<string, OrderItem[]>);

  return orders.map(order => ({
    ...order,
    items: itemsByOrder[order.id] || [],
  }));
}

// Get order statistics
export async function getOrderStats() {
  const stats = await queryOne<{
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    total_revenue: number;
    average_order_value: number;
  }>(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'pending') as pending,
       COUNT(*) FILTER (WHERE status = 'processing') as processing,
       COUNT(*) FILTER (WHERE status = 'shipped') as shipped,
       COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
       COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
       COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'), 0) as total_revenue,
       COALESCE(AVG(total) FILTER (WHERE payment_status = 'paid'), 0) as average_order_value
     FROM orders`
  );

  return stats || {
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    total_revenue: 0,
    average_order_value: 0,
  };
}

// Get recent orders
export async function getRecentOrders(limit: number = 10): Promise<Order[]> {
  return await query<Order>(
    `SELECT * FROM orders
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
}
