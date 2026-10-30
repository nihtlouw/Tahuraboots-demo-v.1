import type { Metadata } from "next";
import type { ReactNode } from "react";
import { inArray, lte, gt, and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { leads, orders, products } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { isOwner } from "@/lib/auth";
import { CrmLogin } from "@/components/crm/crm-login";
import { CrmSidebar } from "@/components/crm/crm-sidebar";

export const metadata: Metadata = {
  title: { default: "Owner CRM", template: "%s · Tahura CRM" },
  description: "Private Tahura Boots Company operations console.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

async function getCounts() {
  try {
    await ensureSeed();
    const [orderRows, leadRows, lowStockRows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(inArray(orders.status, ["pending", "paid", "in_production"])),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(leads)
        .where(inArray(leads.status, ["new", "contacted", "quoted"])),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        // Sama dengan filter "Low stock" di halaman inventory (0 = sold out, bukan low).
        .where(and(gt(products.stock, 0), lte(products.stock, 2), eq(products.status, "ready"))),
    ]);

    return {
      orders: orderRows[0]?.count ?? 0,
      leads: leadRows[0]?.count ?? 0,
      lowStock: lowStockRows[0]?.count ?? 0,
    };
  } catch {
    return { orders: 0, leads: 0, lowStock: 0 };
  }
}

export default async function CrmLayout({ children }: { children: ReactNode }) {
  if (!(await isOwner())) {
    return <CrmLogin />;
  }

  const counts = await getCounts();

  return (
    <div className="min-h-dvh bg-crm text-[#221b15]">
      <CrmSidebar counts={counts} />
      <main className="lg:pl-[252px]">
        <div className="mx-auto max-w-[1500px] px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
