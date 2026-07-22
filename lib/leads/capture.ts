import { db } from "@/lib/db";
import { contacts, leads } from "@/lib/db/schema";
import type { ContactInput } from "@/lib/booking/booking";

/** Save a captured lead (a visitor who wants follow-up) with its contact. */
export async function captureLead(params: {
  businessId: string;
  reason: string;
  contact: ContactInput;
}): Promise<{ leadId: string }> {
  const database = db();

  return database.transaction(async (tx) => {
    const [contact] = await tx
      .insert(contacts)
      .values({
        businessId: params.businessId,
        name: params.contact.name,
        email: params.contact.email,
        phone: params.contact.phone,
      })
      .returning();

    const [lead] = await tx
      .insert(leads)
      .values({ businessId: params.businessId, contactId: contact.id, reason: params.reason })
      .returning();

    return { leadId: lead.id };
  });
}
