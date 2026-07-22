import { notFound } from "next/navigation";
import { getBusiness } from "@/lib/db/queries";
import ChatWidget from "@/components/ChatWidget";

export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const business = await getBusiness(businessId);
  if (!business) notFound();

  return <ChatWidget businessId={business.id} businessName={business.name} />;
}
