import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { findUserByEmail, verifyPassword, updateLastLogin } from "@/backend/db/models/users";
import { generateTokenPair } from "@/backend/auth/jwt";
import { TRPCError } from "@trpc/server";

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default publicProcedure
  .input(loginSchema)
  .mutation(async ({ input }) => {
    // Find user
    const user = await findUserByEmail(input.email);
    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(user, input.password);
    if (!isValidPassword) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    }

    // Update last login
    await updateLastLogin(user.id);

    // Generate JWT tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      isVip: user.is_vip,
      vipTier: user.vip_tier,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        profileImage: user.profile_image,
        totalSpent: user.total_spent,
        isVip: user.is_vip,
        vipTier: user.vip_tier,
        emailVerified: user.email_verified,
      },
      tokens,
    };
  });
