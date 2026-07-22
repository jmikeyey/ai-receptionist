import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "./index";
import {
  businesses,
  services,
  availabilityRules,
  conversations,
  messages,
  contacts,
  appointments,
  leads,
  knowledgeDocuments,
} from "./schema";

export async function getBusiness(id: string) {
  const [b] = await db().select().from(businesses).where(eq(businesses.id, id));
  return b ?? null;
}

export async function listServices(businessId: string) {
  return db().select().from(services).where(eq(services.businessId, businessId));
}

export async function listAvailability(businessId: string) {
  return db()
    .select()
    .from(availabilityRules)
    .where(eq(availabilityRules.businessId, businessId))
    .orderBy(availabilityRules.weekday);
}

/** Insert the conversation row once (client-supplied id); no-op if it already exists. */
export async function ensureConversation(id: string, businessId: string) {
  await db().insert(conversations).values({ id, businessId }).onConflictDoNothing();
}

export async function saveMessage(conversationId: string, role: "user" | "assistant", content: string) {
  if (!content.trim()) return;
  await db().insert(messages).values({ conversationId, role, content });
}

/* ── Dashboard reads ─────────────────────────────────────────── */

export async function listUpcomingAppointments(businessId: string) {
  return db()
    .select({
      id: appointments.id,
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
      status: appointments.status,
      serviceName: services.name,
      contactName: contacts.name,
      contactEmail: contacts.email,
      contactPhone: contacts.phone,
    })
    .from(appointments)
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .innerJoin(contacts, eq(contacts.id, appointments.contactId))
    .where(and(eq(appointments.businessId, businessId), gte(appointments.endsAt, new Date())))
    .orderBy(appointments.startsAt)
    .limit(50);
}

export async function listLeads(businessId: string) {
  return db()
    .select({
      id: leads.id,
      reason: leads.reason,
      status: leads.status,
      createdAt: leads.createdAt,
      contactName: contacts.name,
      contactEmail: contacts.email,
      contactPhone: contacts.phone,
    })
    .from(leads)
    .innerJoin(contacts, eq(contacts.id, leads.contactId))
    .where(eq(leads.businessId, businessId))
    .orderBy(desc(leads.createdAt))
    .limit(50);
}

export async function listKnowledgeDocuments(businessId: string) {
  return db()
    .select({
      id: knowledgeDocuments.id,
      title: knowledgeDocuments.title,
      createdAt: knowledgeDocuments.createdAt,
    })
    .from(knowledgeDocuments)
    .where(eq(knowledgeDocuments.businessId, businessId))
    .orderBy(desc(knowledgeDocuments.createdAt));
}

export async function listConversations(businessId: string) {
  return db()
    .select()
    .from(conversations)
    .where(eq(conversations.businessId, businessId))
    .orderBy(desc(conversations.startedAt))
    .limit(50);
}

/** A conversation with its messages, guarded to the owning business. */
export async function getConversationMessages(conversationId: string, businessId: string) {
  const [conv] = await db()
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.businessId, businessId)));
  if (!conv) return null;

  const msgs = await db()
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  return { conv, msgs };
}
