"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { businesses, services, availabilityRules, knowledgeDocuments, knowledgeChunks } from "@/lib/db/schema";
import { resolveDashboardBusiness } from "@/lib/dashboard-business";
import { chunkText } from "@/lib/knowledge/chunk";
import { embedMany } from "@/lib/embeddings";

async function ownerBusinessId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const business = await resolveDashboardBusiness(user.id);
  if (!business) throw new Error("No business for this owner");
  return business.id;
}

function timeToMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const mins = Number(m[1]) * 60 + Number(m[2]);
  return mins >= 0 && mins <= 1440 ? mins : null;
}

export async function updateProfile(formData: FormData) {
  const businessId = await ownerBusinessId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");

  await db()
    .update(businesses)
    .set({
      name,
      description: String(formData.get("description") ?? "").trim(),
      timezone: String(formData.get("timezone") ?? "UTC").trim() || "UTC",
      freeformKnowledge: String(formData.get("knowledge") ?? ""),
    })
    .where(eq(businesses.id, businessId));

  revalidatePath("/dashboard/settings");
}

export async function addService(formData: FormData) {
  const businessId = await ownerBusinessId();
  const name = String(formData.get("name") ?? "").trim();
  const durationMin = Number(formData.get("durationMin"));
  if (!name || !Number.isFinite(durationMin) || durationMin <= 0) {
    throw new Error("A service needs a name and a positive duration");
  }
  await db().insert(services).values({ businessId, name, durationMin });
  revalidatePath("/dashboard/settings");
}

export async function deleteService(formData: FormData) {
  const businessId = await ownerBusinessId();
  const id = String(formData.get("id") ?? "");
  await db().delete(services).where(and(eq(services.id, id), eq(services.businessId, businessId)));
  revalidatePath("/dashboard/settings");
}

/** Add a knowledge document: store the source, chunk it, embed the chunks, and persist them. */
export async function addDocument(formData: FormData) {
  const businessId = await ownerBusinessId();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!title || !content) throw new Error("A document needs a title and content");

  const chunks = chunkText(content);
  const embeddings = await embedMany(chunks);

  await db().transaction(async (tx) => {
    const [doc] = await tx
      .insert(knowledgeDocuments)
      .values({ businessId, title, content })
      .returning({ id: knowledgeDocuments.id });

    if (chunks.length > 0) {
      await tx.insert(knowledgeChunks).values(
        chunks.map((chunk, i) => ({
          businessId,
          documentId: doc.id,
          content: chunk,
          embedding: embeddings[i],
        })),
      );
    }
  });

  revalidatePath("/dashboard/settings");
}

/** Delete a knowledge document (its chunks cascade), scoped to the owner's business. */
export async function deleteDocument(formData: FormData) {
  const businessId = await ownerBusinessId();
  const id = String(formData.get("id") ?? "");
  await db()
    .delete(knowledgeDocuments)
    .where(and(eq(knowledgeDocuments.id, id), eq(knowledgeDocuments.businessId, businessId)));
  revalidatePath("/dashboard/settings");
}

/** Replace all availability rules from a 7-row weekly form (open_/start_/end_ per weekday). */
export async function setAvailability(formData: FormData) {
  const businessId = await ownerBusinessId();

  const rows: { businessId: string; weekday: number; startMinute: number; endMinute: number }[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    if (formData.get(`open_${weekday}`) !== "on") continue;
    const start = timeToMinutes(String(formData.get(`start_${weekday}`) ?? ""));
    const end = timeToMinutes(String(formData.get(`end_${weekday}`) ?? ""));
    if (start === null || end === null || end <= start) continue;
    rows.push({ businessId, weekday, startMinute: start, endMinute: end });
  }

  await db().transaction(async (tx) => {
    await tx.delete(availabilityRules).where(eq(availabilityRules.businessId, businessId));
    if (rows.length > 0) await tx.insert(availabilityRules).values(rows);
  });

  revalidatePath("/dashboard/settings");
}
