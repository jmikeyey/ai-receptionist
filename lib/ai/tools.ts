import { tool } from "ai";
import { z } from "zod";
import { DateTime } from "luxon";
import type { businesses } from "@/lib/db/schema";
import { listServices } from "@/lib/db/queries";
import { getOpenSlots, bookAppointment } from "@/lib/booking/booking";
import { captureLead } from "@/lib/leads/capture";
import { retrieveKnowledge } from "@/lib/knowledge/retrieve";
import { notifyNewAppointment, notifyNewLead } from "@/lib/notify/send-owner-email";

type Business = typeof businesses.$inferSelect;

async function resolveService(businessId: string, name: string) {
  const all = await listServices(businessId);
  const q = name.trim().toLowerCase();
  return all.find((s) => s.name.toLowerCase() === q) ?? all.find((s) => s.name.toLowerCase().includes(q)) ?? null;
}

// Plain strings in the tool schema (no regex pattern — Groq's JSON-schema validator rejects
// zod's email lookahead pattern). Email format is validated in code below instead.
const looksLikeEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const contactShape = {
  name: z.string().min(1),
  email: z.string().optional(),
  phone: z.string().min(3).optional(),
};

/** Build the receptionist's tools bound to one business. Every input is validated; every
 *  deterministic decision (slots, conflicts, service lookup) happens here, not in the model. */
export function buildReceptionistTools(business: Business) {
  return {
    searchKnowledge: tool({
      description:
        "Look up the business's own info (hours, services, pricing, location, policies) to answer a question. Use before answering any factual question.",
      inputSchema: z.object({ query: z.string() }),
      execute: async ({ query }) => {
        const snippets = await retrieveKnowledge(business.id, query);
        return snippets.length ? { snippets } : { snippets: [], note: "Nothing on file about that." };
      },
    }),

    listServices: tool({
      description: "List the services this business offers and their durations in minutes.",
      inputSchema: z.object({}),
      execute: async () => {
        const all = await listServices(business.id);
        return { services: all.map((s) => ({ name: s.name, minutes: s.durationMin })) };
      },
    }),

    checkAvailability: tool({
      description: "Find open appointment start times for a service on a date (date must be YYYY-MM-DD).",
      inputSchema: z.object({ serviceName: z.string(), date: z.string() }),
      execute: async ({ serviceName, date }) => {
        const service = await resolveService(business.id, serviceName);
        if (!service) return { error: `We don't offer "${serviceName}".` };
        const slots = await getOpenSlots({
          businessId: business.id,
          timezone: business.timezone,
          date,
          serviceId: service.id,
        });
        return {
          service: service.name,
          date,
          slots: slots.map((d) => ({
            label: DateTime.fromJSDate(d).setZone(business.timezone).toFormat("h:mm a"),
            startsAtISO: d.toISOString(),
          })),
        };
      },
    }),

    bookAppointment: tool({
      description:
        "Book an appointment using a startsAtISO returned by checkAvailability. Requires the visitor's name and an email or phone.",
      inputSchema: z
        .object({ serviceName: z.string(), startsAtISO: z.string(), ...contactShape })
        .refine((v) => v.email || v.phone, { message: "An email or phone is required." }),
      execute: async ({ serviceName, startsAtISO, name, email, phone }) => {
        const service = await resolveService(business.id, serviceName);
        if (!service) return { error: `We don't offer "${serviceName}".` };
        if (email && !looksLikeEmail(email)) return { error: "That email doesn't look right — please re-check it." };
        const startsAt = new Date(startsAtISO);
        if (Number.isNaN(startsAt.getTime())) return { error: "Invalid time — pick one from checkAvailability." };

        // Safety net: the requested time must be a currently-open slot.
        const date = DateTime.fromJSDate(startsAt).setZone(business.timezone).toFormat("yyyy-LL-dd");
        const open = await getOpenSlots({ businessId: business.id, timezone: business.timezone, date, serviceId: service.id });
        if (!open.some((d) => d.getTime() === startsAt.getTime())) {
          return { error: "That time isn't open. Call checkAvailability again for current times." };
        }

        const result = await bookAppointment({
          businessId: business.id,
          serviceId: service.id,
          startsAt,
          contact: { name, email, phone },
        });
        if (!result.ok) return { error: result.message };

        // Best-effort owner notification (booking is already committed); log if it fails.
        try {
          await notifyNewAppointment({
            businessId: business.id,
            contactName: name,
            serviceName: service.name,
            startsAt,
            timezone: business.timezone,
          });
        } catch (err) {
          console.error("appointment notify failed", err);
        }

        return {
          booked: true,
          service: service.name,
          when: DateTime.fromJSDate(startsAt).setZone(business.timezone).toFormat("cccc, LLL d 'at' h:mm a"),
        };
      },
    }),

    captureLead: tool({
      description: "Save a visitor's details for follow-up when you can't fully help or they want a callback.",
      inputSchema: z
        .object({ reason: z.string(), ...contactShape })
        .refine((v) => v.email || v.phone, { message: "An email or phone is required." }),
      execute: async ({ name, reason, email, phone }) => {
        if (email && !looksLikeEmail(email)) return { error: "That email doesn't look right — please re-check it." };
        await captureLead({ businessId: business.id, reason, contact: { name, email, phone } });
        try {
          await notifyNewLead({ businessId: business.id, contactName: name, reason });
        } catch (err) {
          console.error("lead notify failed", err);
        }
        return { saved: true };
      },
    }),
  };
}
