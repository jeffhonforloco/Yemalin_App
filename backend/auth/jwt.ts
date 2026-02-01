import * as jose from 'jose';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
  return new TextEncoder().encode(secret);
};

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export interface JWTPayload {
  userId: string;
  email: string;
  isVip: boolean;
  vipTier: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function parseExpiration(exp: string): number {
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60;
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    default: return 7 * 24 * 60 * 60;
  }
}

export async function generateAccessToken(payload: JWTPayload): Promise<string> {
  const secret = getJwtSecret();
  const expiresIn = parseExpiration(JWT_EXPIRES_IN);
  
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('yemalin-api')
    .setAudience('yemalin-app')
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(secret);
}

export async function generateRefreshToken(payload: JWTPayload): Promise<string> {
  const secret = getJwtSecret();
  const expiresIn = parseExpiration(JWT_REFRESH_EXPIRES_IN);
  
  return await new jose.SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('yemalin-api')
    .setAudience('yemalin-app')
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(secret);
}

export async function generateTokenPair(payload: JWTPayload): Promise<TokenPair> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);
  
  return { accessToken, refreshToken };
}

export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: 'yemalin-api',
      audience: 'yemalin-app',
    });

    if (payload && typeof payload === 'object') {
      return payload as unknown as JWTPayload;
    }

    return null;
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      console.warn('Token expired');
    } else if (error instanceof jose.errors.JWTInvalid) {
      console.warn('Invalid token');
    } else {
      console.error('Token verification error:', error);
    }
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: 'yemalin-api',
      audience: 'yemalin-app',
    });

    if (payload && typeof payload === 'object' && 'userId' in payload) {
      return { userId: payload.userId as string };
    }

    return null;
  } catch (error) {
    console.error('Refresh token verification error:', error);
    return null;
  }
}

export function extractTokenFromHeader(authHeader?: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

export async function decodeToken(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = jose.decodeJwt(token);
    if (typeof decoded === 'object' && decoded !== null) {
      return decoded as unknown as JWTPayload;
    }
    return null;
  } catch {
    return null;
  }
}
