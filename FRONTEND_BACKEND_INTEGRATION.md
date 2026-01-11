# Frontend Backend Integration Guide

## Overview

The Yèmalín frontend is now ready for backend integration with a seamless toggle system. The app can run in two modes:
- **Mock Mode** (default): Uses local AsyncStorage, perfect for development
- **Backend Mode**: Uses real PostgreSQL database and tRPC APIs

## Current Status

✅ **Ready for Integration:**
- tRPC client configured with JWT authentication
- AuthProvider updated with backend API support
- API endpoints ready (auth, products, orders)
- Toggle system for easy switching

⏳ **Requires Configuration:**
- Database setup and migration
- Environment variables
- Backend deployment

## How to Enable Backend Integration

### Step 1: Setup Backend (if not done)

Follow the [BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md) to:
1. Set up PostgreSQL database
2. Run database migrations
3. Configure environment variables
4. Deploy backend (or run locally)

### Step 2: Update Frontend Configuration

1. **Set the Backend API URL**

   The backend URL is configured via environment variable in Rork. By default it uses:
   ```
   EXPO_PUBLIC_RORK_API_BASE_URL
   ```

   This should point to your backend server (e.g., `https://api.yemalin.com` or `http://localhost:3000` for local development).

2. **Enable Backend Mode**

   Open `/providers/AuthProvider.tsx` and change:

   ```typescript
   const USE_BACKEND_API = false;  // Change to true
   ```

   To:

   ```typescript
   const USE_BACKEND_API = true;
   ```

### Step 3: Test Authentication

1. Start your backend server
2. Start the Expo app: `bun run start`
3. Test user flows:
   - Sign up with a new account
   - Login with existing account
   - View profile (should show backend data)
   - Logout

### Step 4: Update Product Fetching (Optional)

Currently products are loaded from `/data/products.ts`. To use backend products:

**In `/app/(tabs)/index.tsx`:**

Replace:
```typescript
import { products } from "@/data/products";
```

With:
```typescript
const { data: products = [], isLoading } = trpc.products.getAll.useQuery();
```

Add loading state to the component while products are being fetched.

**In `/app/(tabs)/shop.tsx`:**

Same change as above.

**In `/app/product/[id].tsx`:**

Replace:
```typescript
const product = products.find(p => p.id === id) || comingSoonProducts.find(p => p.id === id);
```

With:
```typescript
const { data: product, isLoading } = trpc.products.getById.useQuery({ id });
```

### Step 5: Update Order History

**In `/app/order-history.tsx`:**

If user is authenticated, fetch orders from backend:

```typescript
const { data: orders = [], isLoading } = trpc.orders.getMyOrders.useQuery(
  undefined,
  { enabled: isAuthenticated }
);
```

### Step 6: Update Checkout Flow

**In `/app/checkout.tsx`:**

When submitting order, use backend API:

```typescript
const createOrderMutation = trpc.orders.create.useMutation({
  onSuccess: (data) => {
    // Order created successfully
    // Redirect to order confirmation
    router.push(`/order/${data.orderNumber}`);
  },
  onError: (error) => {
    // Handle error
    Alert.alert('Error', error.message);
  },
});

// In checkout submit:
createOrderMutation.mutate({
  items: cart,
  shipping: formData,
  payment_method: selectedPaymentMethod,
});
```

## API Endpoints Available

### Authentication
- `auth.signup` - Create new user account
- `auth.login` - Login existing user
- `auth.me` - Get current authenticated user

### Products
- `products.getAll` - Get all active products
- `products.getById` - Get product by ID
- `products.getComingSoon` - Get coming soon products

### Orders
- `orders.create` - Create new order
- `orders.getMyOrders` - Get user's order history
- `orders.updatePayment` - Update order payment status

### Admin (Protected)
- `admin.dashboard` - Get dashboard stats
- `admin.orders.getAll` - Get all orders
- `admin.emails.getAll` - Get email subscribers
- `admin.carts.getAll` - Get abandoned carts
- `admin.analytics.getAnalytics` - Get analytics data

## Data Flow

### Before (Mock Mode)
```
Component → AsyncStorage → Local State
```

### After (Backend Mode)
```
Component → tRPC Client → Backend API → PostgreSQL
                ↓
            JWT Token (AsyncStorage)
```

## Authentication Flow

1. User logs in via `auth.login` or `auth.signup`
2. Backend returns JWT access token and refresh token
3. Tokens stored in AsyncStorage
4. tRPC client automatically includes token in all requests
5. Backend verifies token and returns user data
6. Frontend updates user state

## Testing Checklist

Before deploying with backend integration:

- [ ] Sign up creates user in database
- [ ] Login returns valid JWT token
- [ ] Protected routes require authentication
- [ ] Token persists across app restarts
- [ ] Logout clears tokens and user state
- [ ] Products load from database
- [ ] Orders create successfully
- [ ] Order history shows user's orders
- [ ] VIP status updates based on spending
- [ ] Payment processing works end-to-end

## Troubleshooting

### "Network request failed"
- Check backend server is running
- Verify `EXPO_PUBLIC_RORK_API_BASE_URL` is correct
- Check firewall/network settings

### "Unauthorized" errors
- Check JWT token is being sent
- Verify token hasn't expired
- Try logging out and logging in again

### "User not found" after login
- Check database connection
- Verify user was created in database
- Check `users` table has correct schema

### Products not loading
- Verify products were migrated to database
- Check `products` table has data
- Run migration script if needed: `bun run scripts/migrate-products.ts`

## Rollback to Mock Mode

If you need to rollback to mock mode:

1. Set `USE_BACKEND_API = false` in `AuthProvider.tsx`
2. Restart the app
3. All data will use local AsyncStorage again

## Production Deployment

For production:

1. Ensure `USE_BACKEND_API = true`
2. Set production API URL in environment
3. Use production database credentials
4. Enable SSL/HTTPS
5. Configure proper CORS settings
6. Set up monitoring and error tracking

## Next Steps

Once backend integration is complete:

1. Remove mock data files (optional)
2. Remove AsyncStorage user database
3. Add loading skeletons for better UX
4. Add error boundaries
5. Implement retry logic for failed requests
6. Add offline mode support (optional)

## Support

For issues or questions about backend integration:
- Review `BACKEND_INTEGRATION_GUIDE.md`
- Check backend logs
- Verify database schema matches code
- Test API endpoints directly with curl/Postman

---

**Last Updated:** 2026-01-11
**Version:** 1.0
