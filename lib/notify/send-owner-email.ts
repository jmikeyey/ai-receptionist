import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { businessMembers } from "@/lib/db/schema";

const FROM = "Receptionist <onboarding@resend.dev>";

async function ownerEmail(businessId: string): Promise<string | null> {
  const rows = await db()
    .select({ email: businessMembers.email })
    .from(businessMembers)
    .where(eq(businessMembers.businessId, businessId))
    .limit(1);
  return rows[0]?.email ?? null;
}

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

export async function notifyNewAppointment(params: {
  businessId: string;
  contactName: string;
  serviceName: string;
  startsAt: Date;
  timezone: string;
}) {
  const to = await ownerEmail(params.businessId);
  if (!to) return; // no owner linked (e.g. the seeded demo) — nothing to send
  const when = DateTime.fromJSDate(params.startsAt)
    .setZone(params.timezone)
    .toFormat("cccc, LLL d 'at' h:mm a");
  const { error } = await client().emails.send({
    from: FROM,
    to,
    subject: `New booking — ${params.contactName}`,
    text: `${params.contactName} booked ${params.serviceName} on ${when}.`,
  });
  if (error) throw new Error(`Resend send failed: ${error.message ?? "unknown error"}`);
}

export async function notifyNewLead(params: { businessId: string; contactName: string; reason: string }) {
  const to = await ownerEmail(params.businessId);
  if (!to) return;
  const { error } = await client().emails.send({
    from: FROM,
    to,
    subject: `New lead — ${params.contactName}`,
    text: `${params.contactName} left a message:\n\n${params.reason}`,
  });
  if (error) throw new Error(`Resend send failed: ${error.message ?? "unknown error"}`);
}
