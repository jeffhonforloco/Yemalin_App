import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { createUser, findUserByEmail } from "@/backend/db/models/users";
import { generateTokenPair } from "@/backend/auth/jwt";
import { TRPCError } from "@trpc/server";

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
  phone: z.string().optional(),
});

export default publicProcedure
  .input(signupSchema)
  .mutation(async ({ input }) => {
    // Check if user already exists
    const existingUser = await findUserByEmail(input.email);
    if (existingUser) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'An account with this email already exists',
      });
    }

    // Create user
    const user = await createUser({
      email: input.email,
      password: input.password,
      name: input.name,
      phone: input.phone,
    });

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
        isVip: user.is_vip,
        vipTier: user.vip_tier,
        emailVerified: user.email_verified,
      },
      tokens,
    };
  });
