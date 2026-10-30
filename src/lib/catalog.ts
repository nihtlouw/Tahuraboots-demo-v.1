import type { Product } from "@/db/schema";

export type Availability = "ready" | "sold_out" | "made_to_order" | "archive";

/** Availability as a customer should understand it at a glance. */
export function resolveAvailability(
  product: Pick<Product, "status" | "stock">,
): Availability {
  if (product.status === "archive") return "archive";
  if (product.status === "made_to_order") return "made_to_order";
  if (product.stock <= 0) return "sold_out";
  return "ready";
}

export const availabilityCopy: Record<
  Availability,
  { label: string; detail: string; dot: string }
> = {
  ready: {
    label: "Ready to ship",
    detail: "In stock at the Bandung studio",
    dot: "bg-[#7f9464]",
  },
  sold_out: {
    label: "Sold out",
    detail: "Join the waitlist for the next cutting",
    dot: "bg-[#b46a52]",
  },
  made_to_order: {
    label: "Made to order",
    detail: "Built for you in 6–8 weeks",
    dot: "bg-[#c9a56a]",
  },
  archive: {
    label: "Archive",
    detail: "Run complete — waitlist open",
    dot: "bg-[#8b8378]",
  },
};

export const PRODUCT_STATUSES = ["ready", "made_to_order", "archive"] as const;
export type ProductStatusValue = (typeof PRODUCT_STATUSES)[number];

export const productStatusLabels: Record<string, string> = {
  ready: "Ready to ship",
  made_to_order: "Made to order",
  archive: "Archive",
};

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "in_production",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orderStatusMeta: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending payment",
    className: "bg-[#f6e7c8] text-[#7a5a17] ring-[#e6cf9b]",
  },
  paid: {
    label: "Paid",
    className: "bg-[#e2ecdc] text-[#3f5c36] ring-[#c2d6b8]",
  },
  in_production: {
    label: "In production",
    className: "bg-[#e8e1f0] text-[#5a4276] ring-[#cfc2df]",
  },
  shipped: {
    label: "Shipped",
    className: "bg-[#dce9ef] text-[#2f5668] ring-[#bcd4de]",
  },
  delivered: {
    label: "Delivered",
    className: "bg-[#e6e4dd] text-[#4a463c] ring-[#cfcbbf]",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-[#f1dedb] text-[#88423a] ring-[#dfc0bb]",
  },
};

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "quoted",
  "won",
  "lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const leadStatusMeta: Record<
  string,
  { label: string; className: string; accent: string }
> = {
  new: {
    label: "New",
    className: "bg-[#f6e7c8] text-[#7a5a17] ring-[#e6cf9b]",
    accent: "bg-[#c9a56a]",
  },
  contacted: {
    label: "Contacted",
    className: "bg-[#e3e9f0] text-[#365269] ring-[#c3d2df]",
    accent: "bg-[#6d8da3]",
  },
  quoted: {
    label: "Quoted",
    className: "bg-[#efe6f0] text-[#6a4070] ring-[#dbc9dd]",
    accent: "bg-[#9a6fa1]",
  },
  won: {
    label: "Won",
    className: "bg-[#e2ecdc] text-[#3f5c36] ring-[#c2d6b8]",
    accent: "bg-[#6f8f5f]",
  },
  lost: {
    label: "Lost",
    className: "bg-[#ece7df] text-[#6d6355] ring-[#d6cec1]",
    accent: "bg-[#a49a8b]",
  },
};

export const CHANNELS = ["web", "whatsapp", "instagram", "studio"] as const;

export function stockTone(product: Pick<Product, "status" | "stock">) {
  const availability = resolveAvailability(product);
  if (availability === "sold_out" || availability === "archive") {
    return "text-[#a35a49]";
  }
  if (availability === "made_to_order" || product.stock <= 2) {
    return "text-[#9a6c22]";
  }
  return "text-[#4f6b45]";
}
