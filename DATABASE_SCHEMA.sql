-- Yèmalín Luxury Fashion App - Production Database Schema
-- PostgreSQL Database Schema
-- Version: 1.0
-- Last Updated: 2026-01-10

-- =====================================================
-- EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    profile_image TEXT,
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    is_vip BOOLEAN DEFAULT FALSE,
    vip_tier VARCHAR(50) DEFAULT 'bronze', -- bronze, silver, gold, platinum
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_vip ON users(is_vip);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =====================================================
-- PRODUCTS
-- =====================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    color VARCHAR(50),
    stock INTEGER DEFAULT 0,
    is_limited BOOLEAN DEFAULT FALSE,
    total_made INTEGER,
    sold_in_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    is_coming_soon BOOLEAN DEFAULT FALSE,
    release_date TIMESTAMP,
    exclusive_access BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_products_release_date ON products(release_date);

-- Product sizes (many-to-many relationship)
CREATE TABLE product_sizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(10) NOT NULL, -- XS, S, M, L, XL, XXL
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_sizes_product_id ON product_sizes(product_id);

-- Product images
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);

-- =====================================================
-- ORDERS
-- =====================================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
    subtotal DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(10, 2) DEFAULT 0.00,
    tax DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL,

    -- Shipping information
    shipping_name VARCHAR(255),
    shipping_email VARCHAR(255),
    shipping_phone VARCHAR(50),
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_zip VARCHAR(20),
    shipping_country VARCHAR(100),

    -- Payment information
    payment_method VARCHAR(50), -- stripe, paypal, etc
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),

    -- Tracking
    tracking_number VARCHAR(255),
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL, -- Stored for historical record
    product_image TEXT,
    size VARCHAR(10),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- =====================================================
-- SHOPPING CART
-- =====================================================

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- For guest users
    product_id UUID REFERENCES products(id),
    size VARCHAR(10),
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_session_id ON cart_items(session_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- =====================================================
-- ABANDONED CARTS
-- =====================================================

CREATE TABLE abandoned_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    cart_data JSONB NOT NULL, -- Stored cart items
    cart_value DECIMAL(10, 2) NOT NULL,
    recovery_sent_at TIMESTAMP,
    recovery_count INTEGER DEFAULT 0,
    recovered BOOLEAN DEFAULT FALSE,
    recovered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_abandoned_carts_email ON abandoned_carts(email);
CREATE INDEX idx_abandoned_carts_recovered ON abandoned_carts(recovered);
CREATE INDEX idx_abandoned_carts_created_at ON abandoned_carts(created_at);

-- =====================================================
-- EMAIL COLLECTION & MARKETING
-- =====================================================

CREATE TABLE email_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    source VARCHAR(100), -- popup, waitlist, checkout, etc
    metadata JSONB, -- Additional data
    subscribed BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP
);

CREATE INDEX idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX idx_email_subscribers_subscribed ON email_subscribers(subscribed);
CREATE INDEX idx_email_subscribers_source ON email_subscribers(source);

-- =====================================================
-- WAITLIST
-- =====================================================

CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    product_id UUID REFERENCES products(id),
    notified BOOLEAN DEFAULT FALSE,
    notified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_product_id ON waitlist(product_id);
CREATE INDEX idx_waitlist_notified ON waitlist(notified);

-- =====================================================
-- VIP MEMBERSHIP
-- =====================================================

CREATE TABLE vip_benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tier VARCHAR(50) NOT NULL, -- bronze, silver, gold, platinum
    discount_percent INTEGER DEFAULT 0,
    early_access_hours INTEGER DEFAULT 0,
    member_since TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_vip_benefits_user_id ON vip_benefits(user_id);
CREATE INDEX idx_vip_benefits_tier ON vip_benefits(tier);

-- VIP Offers
CREATE TABLE vip_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount_code VARCHAR(50),
    discount_percent INTEGER,
    min_tier VARCHAR(50), -- bronze, silver, gold, platinum
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    auto_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vip_offers_is_active ON vip_offers(is_active);
CREATE INDEX idx_vip_offers_valid_until ON vip_offers(valid_until);

-- =====================================================
-- PAYMENT METHODS
-- =====================================================

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255) NOT NULL,
    card_brand VARCHAR(50),
    card_last4 VARCHAR(4),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);

-- =====================================================
-- ANALYTICS & TRACKING
-- =====================================================

CREATE TABLE conversion_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL, -- page_view, add_to_cart, checkout, purchase, etc
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversion_events_event_type ON conversion_events(event_type);
CREATE INDEX idx_conversion_events_user_id ON conversion_events(user_id);
CREATE INDEX idx_conversion_events_created_at ON conversion_events(created_at);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- order_update, vip_offer, restock, etc
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- =====================================================
-- ADMIN LOGS
-- =====================================================

CREATE TABLE admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- product, order, user, etc
    entity_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_abandoned_carts_updated_at BEFORE UPDATE ON abandoned_carts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- VIP users view
CREATE OR REPLACE VIEW vip_users AS
SELECT
    u.id,
    u.email,
    u.name,
    u.total_spent,
    u.is_vip,
    u.vip_tier,
    vb.discount_percent,
    vb.early_access_hours,
    vb.member_since
FROM users u
LEFT JOIN vip_benefits vb ON u.id = vb.user_id
WHERE u.is_vip = TRUE AND vb.is_active = TRUE;

-- Product inventory view
CREATE OR REPLACE VIEW product_inventory AS
SELECT
    p.id,
    p.name,
    p.price,
    p.stock AS total_stock,
    p.is_active,
    COUNT(ps.id) AS size_variants,
    SUM(ps.stock) AS total_size_stock
FROM products p
LEFT JOIN product_sizes ps ON p.id = ps.product_id
GROUP BY p.id, p.name, p.price, p.stock, p.is_active;

-- Order summary view
CREATE OR REPLACE VIEW order_summary AS
SELECT
    o.id,
    o.order_number,
    o.user_id,
    u.email AS user_email,
    o.status,
    o.total,
    o.created_at,
    COUNT(oi.id) AS item_count
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.user_id, u.email, o.status, o.total, o.created_at;

-- =====================================================
-- SEED DATA (Optional - for testing)
-- =====================================================

-- Insert admin user (password: Admin@123 - CHANGE IN PRODUCTION!)
-- Password hash generated using bcrypt
INSERT INTO users (email, password_hash, name, is_vip, vip_tier, email_verified)
VALUES (
    'admin@yemalin.com',
    '$2a$10$rDc8H3.9h5h7gkLxDvNbY.K5vQh4cV5eGvQzWf4zMxK8iNzPqYJHi',
    'Admin User',
    TRUE,
    'platinum',
    TRUE
);

-- =====================================================
-- PERFORMANCE NOTES
-- =====================================================

-- Consider adding these for production:
-- 1. Partitioning for orders and conversion_events by date
-- 2. Materialized views for analytics
-- 3. Connection pooling (PgBouncer)
-- 4. Read replicas for analytics queries
-- 5. Redis caching for product catalog and user sessions

-- =====================================================
-- SECURITY NOTES
-- =====================================================

-- 1. Enable RLS (Row Level Security) for user data
-- 2. Use prepared statements to prevent SQL injection
-- 3. Encrypt sensitive data (credit cards, personal info)
-- 4. Regular backups (hourly incremental, daily full)
-- 5. Audit logs for all admin actions
-- 6. Rate limiting on authentication endpoints

-- =====================================================
-- BACKUP & RECOVERY
-- =====================================================

-- Automated backups recommended:
-- - Continuous archiving (WAL)
-- - Daily full backups (retained for 30 days)
-- - Test restore procedures monthly

-- =====================================================
-- END OF SCHEMA
-- =====================================================
