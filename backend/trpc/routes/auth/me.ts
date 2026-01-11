import { protectedProcedure } from "@/backend/trpc/create-context";

export default protectedProcedure.query(({ ctx }) => {
  const user = ctx.user;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    profileImage: user.profile_image,
    totalSpent: user.total_spent,
    isVip: user.is_vip,
    vipTier: user.vip_tier,
    emailVerified: user.email_verified,
    createdAt: user.created_at,
    lastLogin: user.last_login,
  };
});
