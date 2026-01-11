import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import dashboardRoute from "./routes/admin/dashboard/route";
import * as emailRoutes from "./routes/admin/emails/route";
import * as cartRoutes from "./routes/admin/carts/route";
import * as analyticsRoutes from "./routes/admin/analytics/route";
import * as adminOrderRoutes from "./routes/admin/orders/route";

// Auth routes
import signupRoute from "./routes/auth/signup";
import loginRoute from "./routes/auth/login";
import meRoute from "./routes/auth/me";

// Product routes
import getAllProductsRoute from "./routes/products/getAll";
import getProductByIdRoute from "./routes/products/getById";
import getComingSoonProductsRoute from "./routes/products/getComingSoon";

// Order routes
import createOrderRoute from "./routes/orders/create";
import getMyOrdersRoute from "./routes/orders/getMyOrders";
import updatePaymentRoute from "./routes/orders/updatePayment";

export const appRouter = createTRPCRouter({
  // Authentication
  auth: createTRPCRouter({
    signup: signupRoute,
    login: loginRoute,
    me: meRoute,
  }),

  // Products
  products: createTRPCRouter({
    getAll: getAllProductsRoute,
    getById: getProductByIdRoute,
    getComingSoon: getComingSoonProductsRoute,
  }),

  // Orders
  orders: createTRPCRouter({
    create: createOrderRoute,
    getMyOrders: getMyOrdersRoute,
    updatePayment: updatePaymentRoute,
  }),

  // Example routes
  example: createTRPCRouter({
    hi: hiRoute,
  }),

  // Admin routes
  admin: createTRPCRouter({
    dashboard: dashboardRoute,
    emails: createTRPCRouter({
      getAll: emailRoutes.getEmails,
      getStats: emailRoutes.getEmailStats,
      updateSubscription: emailRoutes.updateEmailSubscription,
    }),
    carts: createTRPCRouter({
      getAll: cartRoutes.getAbandonedCarts,
      getStats: cartRoutes.getCartStats,
      markRecovered: cartRoutes.markCartRecovered,
    }),
    analytics: createTRPCRouter({
      getAnalytics: analyticsRoutes.getAnalytics,
      getFunnel: analyticsRoutes.getConversionFunnel,
    }),
    orders: createTRPCRouter({
      getAll: adminOrderRoutes.getOrders,
      getStats: adminOrderRoutes.getOrderStats,
    }),
  }),
});

export type AppRouter = typeof appRouter;