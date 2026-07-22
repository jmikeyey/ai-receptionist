import { DateTime } from "luxon";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, availabilityRules, contacts, services } from "@/lib/db/schema";
import { openSlotsForDate } from "./availability";

export type ContactInput = { name: string; email?: string; phone?: string };

export type BookResult =
  | { ok: true; appointmentId: string; startsAt: Date; endsAt: Date }
  | { ok: false; reason: "slot_taken" | "unknown_service"; message: string };

/** Open start times (UTC) for a service on a given business-local date. */
export async function getOpenSlots(params: {
  businessId: string;
  timezone: string;
  date: string; // YYYY-MM-DD in business timezone
  serviceId: string;
}): Promise<Date[]> {
  const database = db();

  const [service] = await database
    .select()
    .from(services)
    .where(and(eq(services.businessId, params.businessId), eq(services.id, params.serviceId)));
  if (!service) return [];

  const rules = await database
    .select()
    .from(availabilityRules)
    .where(eq(availabilityRules.businessId, params.businessId));

  const dayStart = DateTime.fromISO(params.date, { zone: params.timezone }).startOf("day");
  if (!dayStart.isValid) return [];
  const windowStart = dayStart.toUTC().toJSDate();
  const windowEnd = dayStart.plus({ days: 1 }).toUTC().toJSDate();

  const booked = await database
    .select({ startsAt: appointments.startsAt, endsAt: appointments.endsAt })
    .from(appointments)
    .where(
      and(
        eq(appointments.businessId, params.businessId),
        eq(appointments.status, "booked"),
        gt(appointments.endsAt, windowStart),
        lt(appointments.startsAt, windowEnd),
      ),
    );

  return openSlotsForDate({
    date: params.date,
    timezone: params.timezone,
    rules,
    durationMin: service.durationMin,
    appointments: booked,
  });
}

/**
 * Book an appointment inside a transaction. A per-business advisory lock serializes
 * concurrent bookings, and an overlap check prevents double-booking. Returns an explicit
 * `slot_taken` result (not a throw) for the expected conflict case; real errors propagate.
 */
export async function bookAppointment(params: {
  businessId: string;
  serviceId: string;
  startsAt: Date;
  contact: ContactInput;
}): Promise<BookResult> {
  const database = db();

  return database.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${params.businessId}))`);

    const [service] = await tx
      .select()
      .from(services)
      .where(and(eq(services.businessId, params.businessId), eq(services.id, params.serviceId)));
    if (!service) {
      return { ok: false, reason: "unknown_service", message: "That service isn't offered." };
    }

    const startsAt = params.startsAt;
    const endsAt = new Date(startsAt.getTime() + service.durationMin * 60_000);

    const conflicts = await tx
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, params.businessId),
          eq(appointments.status, "booked"),
          lt(appointments.startsAt, endsAt),
          gt(appointments.endsAt, startsAt),
        ),
      );
    if (conflicts.length > 0) {
      return { ok: false, reason: "slot_taken", message: "That time was just taken." };
    }

    const [contact] = await tx
      .insert(contacts)
      .values({
        businessId: params.businessId,
        name: params.contact.name,
        email: params.contact.email,
        phone: params.contact.phone,
      })
      .returning();

    const [appt] = await tx
      .insert(appointments)
      .values({
        businessId: params.businessId,
        contactId: contact.id,
        serviceId: service.id,
        startsAt,
        endsAt,
      })
      .returning();

    return { ok: true, appointmentId: appt.id, startsAt, endsAt };
  });
}
