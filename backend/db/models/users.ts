import { query, queryOne, transaction } from '../connection';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  phone: string | null;
  profile_image: string | null;
  total_spent: number;
  is_vip: boolean;
  vip_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
  email_verified: boolean;
  verification_token: string | null;
  reset_token: string | null;
  reset_token_expires: Date | null;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string;
  profile_image?: string;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { email, password, name, phone } = input;

  const password_hash = await bcrypt.hash(password, 10);
  const verification_token = crypto.randomUUID();

  const user = await queryOne<User>(
    `INSERT INTO users (email, password_hash, name, phone, verification_token)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [email, password_hash, name || null, phone || null, verification_token]
  );

  if (!user) {
    throw new Error('Failed to create user');
  }

  return user;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return await queryOne<User>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
}

export async function findUserById(id: string): Promise<User | null> {
  return await queryOne<User>(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
}

export async function verifyPassword(
  user: User,
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, user.password_hash);
}

export async function updateUser(
  userId: string,
  input: UpdateUserInput
): Promise<User | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(input.name);
  }
  if (input.phone !== undefined) {
    fields.push(`phone = $${paramCount++}`);
    values.push(input.phone);
  }
  if (input.profile_image !== undefined) {
    fields.push(`profile_image = $${paramCount++}`);
    values.push(input.profile_image);
  }

  if (fields.length === 0) {
    return await findUserById(userId);
  }

  values.push(userId);
  const user = await queryOne<User>(
    `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );

  return user;
}

export async function updateLastLogin(userId: string): Promise<void> {
  await query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
    [userId]
  );
}

export async function verifyEmail(token: string): Promise<User | null> {
  const user = await queryOne<User>(
    `UPDATE users
     SET email_verified = TRUE, verification_token = NULL
     WHERE verification_token = $1
     RETURNING *`,
    [token]
  );

  return user;
}

export async function generateResetToken(email: string): Promise<string | null> {
  const reset_token = crypto.randomUUID();
  const reset_token_expires = new Date(Date.now() + 3600000);

  const user = await queryOne<User>(
    `UPDATE users
     SET reset_token = $1, reset_token_expires = $2
     WHERE email = $3
     RETURNING *`,
    [reset_token, reset_token_expires, email]
  );

  return user ? reset_token : null;
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<boolean> {
  const password_hash = await bcrypt.hash(newPassword, 10);

  const result = await queryOne(
    `UPDATE users
     SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL
     WHERE reset_token = $2 AND reset_token_expires > NOW()
     RETURNING id`,
    [password_hash, token]
  );

  return result !== null;
}

export async function updateUserSpentAndVIP(
  userId: string,
  orderTotal: number
): Promise<void> {
  await transaction(async (client) => {
    await client.query(
      'UPDATE users SET total_spent = total_spent + $1 WHERE id = $2',
      [orderTotal, userId]
    );

    const userResult = await client.query(
      'SELECT total_spent FROM users WHERE id = $1',
      [userId]
    );

    const totalSpent = userResult.rows[0]?.total_spent || 0;

    let vipTier: string | null = null;
    let isVip = false;

    if (totalSpent >= 10000) {
      vipTier = 'platinum';
      isVip = true;
    } else if (totalSpent >= 5000) {
      vipTier = 'gold';
      isVip = true;
    } else if (totalSpent >= 2000) {
      vipTier = 'silver';
      isVip = true;
    } else if (totalSpent >= 1000) {
      vipTier = 'bronze';
      isVip = true;
    }

    if (vipTier) {
      await client.query(
        'UPDATE users SET is_vip = $1, vip_tier = $2 WHERE id = $3',
        [isVip, vipTier, userId]
      );
    }
  });
}

export async function getVIPUsers(): Promise<User[]> {
  return await query<User>(
    'SELECT * FROM users WHERE is_vip = TRUE ORDER BY total_spent DESC'
  );
}

export async function getUserStats() {
  const stats = await query<{ vip_tier: string; count: number }>(
    `SELECT vip_tier, COUNT(*) as count
     FROM users
     WHERE is_vip = TRUE
     GROUP BY vip_tier`
  );

  const totalUsers = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM users'
  );

  return {
    total: totalUsers?.count || 0,
    vip: stats,
  };
}
