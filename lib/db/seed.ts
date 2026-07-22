import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { eq } from "drizzle-orm";
import { db, schema } from "./index";
import { createAdminClient } from "../supabase/admin";
import { chunkText } from "../knowledge/chunk";
import { embedMany } from "../embeddings";

const OWNER = { email: "demo@brightsmile.test", password: "demo1234" };

const KNOWLEDGE = `Bright Smile Dental is a friendly neighborhood dental clinic in Cebu City.

We are open Monday to Friday from 9:00am to 5:00pm, and Saturday mornings from 9:00am to 12:00pm. We are closed on Sundays and public holidays.

We offer teeth cleaning, routine check-ups, and teeth whitening. Cleanings and check-ups take about 30 minutes; whitening takes about an hour.

Free parking is available behind the building. We accept most major insurance plans — bring your card and we'll verify coverage before your visit.

New patients are welcome. For emergencies outside our hours, please call the clinic and follow the voicemail instructions.`;

/** Create the demo owner in Supabase Auth, or find the existing one. Returns the auth user UUID. */
async function ensureDemoOwner(): Promise<string> {
  const admin = createAdminClient();

  const created = await admin.auth.admin.createUser({
    email: OWNER.email,
    password: OWNER.password,
    email_confirm: true,
  });

  if (created.data.user) {
    console.log(`Created Supabase Auth user ${OWNER.email}.`);
    return created.data.user.id;
  }

  // Already exists (or another error) — look the user up by email.
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw new Error(`Could not list Supabase users: ${error.message}`);
  const existing = data.users.find((u) => u.email === OWNER.email);
  if (!existing) {
    throw new Error(`createUser failed and ${OWNER.email} not found: ${created.error?.message ?? "unknown error"}`);
  }
  console.log(`Supabase Auth user ${OWNER.email} already exists.`);
  return existing.id;
}

async function seed() {
  const database = db();

  let [biz] = await database.select().from(schema.businesses).limit(1);
  if (!biz) {
    [biz] = await database
      .insert(schema.businesses)
      .values({
        name: "Bright Smile Dental",
        description: "A friendly neighborhood dental clinic.",
        timezone: "Asia/Manila",
        freeformKnowledge: KNOWLEDGE,
      })
      .returning();

    await database.insert(schema.services).values([
      { businessId: biz.id, name: "Cleaning", durationMin: 30 },
      { businessId: biz.id, name: "Check-up", durationMin: 30 },
      { businessId: biz.id, name: "Whitening", durationMin: 60 },
    ]);

    const rules = [1, 2, 3, 4, 5].map((weekday) => ({
      businessId: biz.id,
      weekday,
      startMinute: 9 * 60,
      endMinute: 17 * 60,
    }));
    rules.push({ businessId: biz.id, weekday: 6, startMinute: 9 * 60, endMinute: 12 * 60 });
    await database.insert(schema.availabilityRules).values(rules);
    console.log(`Created business "${biz.name}" (${biz.id}).`);
  } else {
    console.log(`Business already exists (${biz.id}).`);
  }

  // Knowledge base (Slice 2): seed one document from the freeform text, chunk + embed it.
  // Idempotent — skip if the business already has any document.
  const existingDocs = await database
    .select({ id: schema.knowledgeDocuments.id })
    .from(schema.knowledgeDocuments)
    .where(eq(schema.knowledgeDocuments.businessId, biz.id))
    .limit(1);

  if (existingDocs.length === 0) {
    const chunks = chunkText(KNOWLEDGE);
    const embeddings = await embedMany(chunks);
    await database.transaction(async (tx) => {
      const [doc] = await tx
        .insert(schema.knowledgeDocuments)
        .values({ businessId: biz.id, title: "Clinic info", content: KNOWLEDGE })
        .returning({ id: schema.knowledgeDocuments.id });
      await tx.insert(schema.knowledgeChunks).values(
        chunks.map((chunk, i) => ({
          businessId: biz.id,
          documentId: doc.id,
          content: chunk,
          embedding: embeddings[i],
        })),
      );
    });
    console.log(`Seeded "Clinic info" knowledge document with ${chunks.length} chunks.`);
  } else {
    console.log("Knowledge document already exists; skipping.");
  }

  const userId = await ensureDemoOwner();

  await database
    .insert(schema.businessMembers)
    .values({ businessId: biz.id, userId, email: OWNER.email, role: "owner" })
    .onConflictDoNothing();

  console.log(`Demo owner login → ${OWNER.email} / ${OWNER.password}`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
