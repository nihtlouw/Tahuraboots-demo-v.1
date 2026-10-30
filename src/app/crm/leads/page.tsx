import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { isOwner } from "@/lib/auth";
import { CrmHeader } from "@/components/crm/ui";

export const metadata: Metadata = { title: "Leads" };
import { LeadsBoard, type CrmLead } from "@/components/crm/leads-board";

export const dynamic = "force-dynamic";

export default async function CrmLeadsPage() {
  // Lapisan kedua: layout sudah menyembunyikan UI, tapi tanpa guard ini
  // komponen halaman tetap dieksekusi dan datanya bocor di payload RSC.
  if (!(await isOwner())) return null;

  await ensureSeed();

  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));

  const initial: CrmLead[] = rows.map((lead) => ({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    country: lead.country,
    productInterest: lead.productInterest,
    message: lead.message,
    source: lead.source,
    status: lead.status,
    valueIdr: lead.valueIdr,
    notes: lead.notes,
    createdAt: lead.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <CrmHeader
        eyebrow="Leads & custom builds"
        title="Who is waiting on a pair"
        description="Every configurator build and studio enquiry lands here automatically. Move a card through the pipeline, quote it, or log a note for the next follow-up."
      />
      <LeadsBoard initial={initial} />
    </div>
  );
}
