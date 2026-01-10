# Backend Integration Guide

## Overview

This guide will help you complete the backend integration and launch Yèmalín Luxury Fashion App.

## Current Status

✅ **Completed:**
- Database schema design (PostgreSQL)
- Database models (users, products, orders)
- Authentication system (JWT)
- tRPC API endpoints (auth, products, orders)
- Environment configuration
- Payment integration structure (Stripe)
- Email service structure

🔄 **In Progress:**
- Database setup and migration
- Frontend API integration
- Payment processing (Stripe configuration)

⏳ **Pending:**
- Email service configuration
- Production deployment
- End-to-end testing

## Step 1: Database Setup

### 1.1 Install PostgreSQL

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download installer from https://www.postgresql.org/download/windows/

### 1.2 Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE yemalin_prod;

# Create user (optional, or use default postgres user)
CREATE USER yemalin_admin WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE yemalin_prod TO yemalin_admin;

# Exit psql
\q
```

### 1.3 Run Database Schema

```bash
# Apply the schema
psql -U postgres -d yemalin_prod -f DATABASE_SCHEMA.sql
```

### 1.4 Verify Database

```bash
psql -U postgres -d yemalin_prod

# List tables
\dt

# Check a table
SELECT * FROM users LIMIT 1;

\q
```

## Step 2: Environment Configuration

### 2.1 Create .env File

```bash
# Copy example file
cp .env.example .env
```

### 2.2 Configure Database

Edit `.env` and update:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yemalin_prod
DB_USER=postgres
DB_PASSWORD=your_actual_password

JWT_SECRET=generate-a-random-32-character-string-here
NODE_ENV=development
API_URL=http://localhost:3000/api
```

**Generate JWT Secret:**
```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3: Migrate Product Data

Create a migration script to import existing product data:

```bash
# Create migration script
bun run scripts/migrate-products.ts
```

This will import products from `data/products.ts` into the database.

## Step 4: Stripe Payment Integration

### 4.1 Install Stripe

```bash
bun add stripe
bun add -d @types/stripe
```

### 4.2 Get Stripe Keys

1. Go to https://dashboard.stripe.com
2. Get your API keys (test mode for development)
3. Add to `.env`:

```env
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
```

### 4.3 Configure Stripe Webhooks

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Forward webhooks to local development:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

3. Copy webhook signing secret to `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4.4 Uncomment Stripe Code

Uncomment the Stripe integration code in:
- `backend/services/stripe.ts`
- Create webhook handler at `backend/routes/webhooks/stripe.ts`

## Step 5: Email Service Integration

### Option A: SendGrid (Recommended for Transactional Emails)

```bash
bun add @sendgrid/mail
```

Get API key from https://sendgrid.com and add to `.env`:

```env
SENDGRID_API_KEY=SG.your_api_key
SENDGRID_FROM_EMAIL=noreply@yemalin.com
```

### Option B: Klaviyo (Recommended for Marketing)

Get API key from https://www.klaviyo.com and add to `.env`:

```env
KLAVIYO_API_KEY=pk_your_api_key
KLAVIYO_LIST_ID=your_list_id
```

Uncomment email service code in `backend/services/email.ts`.

## Step 6: Frontend Integration

### 6.1 Update API Client

The frontend already has tRPC configured. Update the API URL if needed:

Check `app/_layout.tsx` or wherever tRPC client is initialized:

```typescript
import { httpBatchLink } from '@trpc/client';

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc', // Update for production
      headers: async () => {
        // Get JWT token from AsyncStorage
        const token = await AsyncStorage.getItem('auth_token');
        return {
          Authorization: token ? `Bearer ${token}` : '',
        };
      },
    }),
  ],
});
```

### 6.2 Update Auth Provider

The `AuthProvider` should store JWT tokens and provide authentication state.

See updated example in `providers/AuthProvider.tsx`.

### 6.3 Update Data Fetching

Replace mock data with real API calls:

**Before (Mock Data):**
```typescript
import { products } from '@/data/products';
```

**After (Real API):**
```typescript
const { data: products } = trpc.products.getAll.useQuery();
```

## Step 7: Testing

### 7.1 Test Database Connection

```bash
# Create a test script
bun run backend/test-db.ts
```

### 7.2 Test API Endpoints

```bash
# Start the backend server
bun run backend/hono.ts

# Test endpoints with curl
curl http://localhost:3000/api/

# Test signup
curl -X POST http://localhost:3000/api/trpc/auth.signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 7.3 Test Frontend Integration

1. Start the backend: `bun run backend/hono.ts`
2. Start Expo: `bun run start`
3. Test user flows:
   - Sign up
   - Browse products
   - Add to cart
   - Checkout
   - View orders

## Step 8: Production Deployment

### 8.1 Database (Recommended Providers)

**Option A: Neon (Serverless PostgreSQL)**
- https://neon.tech
- Free tier available
- Excellent for serverless deployments

**Option B: Railway**
- https://railway.app
- PostgreSQL + backend hosting
- Simple deployment

**Option C: Supabase**
- https://supabase.com
- PostgreSQL + Auth + Storage
- Free tier available

### 8.2 Backend Deployment

**Option A: Railway**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

**Option B: Render**
- https://render.com
- Connect GitHub repo
- Auto-deploy on push

**Option C: Fly.io**
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

### 8.3 Frontend Deployment

**Web:**
```bash
# Build web version
npx expo export:web

# Deploy to Vercel/Netlify
```

**iOS:**
```bash
# Build for App Store
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

**Android:**
```bash
# Build for Play Store
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

### 8.4 Production Environment Variables

Update `.env` for production:

```env
NODE_ENV=production
API_URL=https://api.yemalin.com
DB_HOST=your-production-db-host
STRIPE_SECRET_KEY=sk_live_your_live_key
# ... other production values
```

## Step 9: Post-Deployment

### 9.1 Monitoring

Set up monitoring for:
- Database performance (connection pool, query times)
- API response times
- Error tracking (Sentry)
- Payment processing

### 9.2 Analytics

Configure:
- Google Analytics
- Facebook Pixel
- Conversion tracking

### 9.3 SSL/TLS

Ensure all endpoints use HTTPS in production.

### 9.4 Backup Strategy

Configure automated backups:
- Daily database backups
- Backup retention: 30 days
- Test restore procedures monthly

## Troubleshooting

### Database Connection Errors

```bash
# Check PostgreSQL is running
pg_isready

# Check connection
psql -U postgres -d yemalin_prod -c "SELECT 1"
```

### tRPC Errors

- Check API URL is correct
- Verify JWT token is being sent
- Check CORS settings in `backend/hono.ts`

### Payment Issues

- Verify Stripe test mode vs live mode
- Check webhook signatures
- Test with Stripe test cards: https://stripe.com/docs/testing

## Support

For issues or questions:
- Check logs: `pm2 logs` or railway logs
- Review error messages
- Check environment variables
- Verify database schema matches code

## Next Steps

1. ✅ Complete database setup
2. ✅ Configure Stripe
3. ✅ Configure email service
4. ✅ Test all endpoints
5. ✅ Update frontend
6. ✅ End-to-end testing
7. ✅ Deploy to production
8. ✅ Launch!

---

**Last Updated:** 2026-01-10
**Version:** 1.0
