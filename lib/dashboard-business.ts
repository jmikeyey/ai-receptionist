import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, businessMembers } from "@/lib/db/schema";

/** The business this owner manages (via businessMembers). No self-service creation in Slice 1. */
export async function resolveDashboardBusiness(userId: string) {
  const [member] = await db()
    .select()
    .from(businessMembers)
    .where(eq(businessMembers.userId, userId))
    .limit(1);
  if (!member) return null;

  const [b] = await db().select().from(businesses).where(eq(businesses.id, member.businessId));
  return b ?? null;
}
