import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { pool } from "../db/connection";
import { verifyAccessToken, extractTokenFromHeader, JWTPayload } from "../auth/jwt";
import { findUserById, User } from "../db/models/users";

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  // Extract and verify JWT token
  const authHeader = opts.req.headers.get('Authorization');
  const token = extractTokenFromHeader(authHeader);

  let user: User | null = null;
  let jwtPayload: JWTPayload | null = null;

  if (token) {
    jwtPayload = verifyAccessToken(token);
    if (jwtPayload) {
      // Fetch fresh user data from database
      user = await findUserById(jwtPayload.userId);
    }
  }

  return {
    req: opts.req,
    db: pool,
    user,
    jwtPayload,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

// Middleware to check authentication
const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !ctx.jwtPayload) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Now TypeScript knows user is not null
      jwtPayload: ctx.jwtPayload,
    },
  });
});

// Middleware to check if user is VIP
const isVIP = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !ctx.jwtPayload) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  if (!ctx.user.is_vip) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'This resource is only available to VIP members',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      jwtPayload: ctx.jwtPayload,
    },
  });
});

// Middleware to check if user is admin
const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !ctx.jwtPayload) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  // Check if user email is admin (you can expand this with a proper admin role system)
  if (!ctx.user.email.includes('admin@yemalin.com')) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      jwtPayload: ctx.jwtPayload,
    },
  });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthenticated);
export const vipProcedure = t.procedure.use(isVIP);
export const adminProcedure = t.procedure.use(isAdmin);