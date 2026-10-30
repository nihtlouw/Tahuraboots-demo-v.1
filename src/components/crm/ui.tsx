import type { ReactNode } from "react";
import { leadStatusMeta, orderStatusMeta } from "@/lib/catalog";

export function CrmHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-crm-line pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-[#a8865a]">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-[clamp(1.7rem,3vw,2.3rem)] leading-tight text-[#221b15]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[0.82rem] leading-relaxed text-[#7a7062]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-crm-line bg-white shadow-[0_1px_2px_rgba(34,27,21,0.04)] ${className}`}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-crm-line px-5 py-4">
          <div>
            {title && (
              <h2 className="text-[0.82rem] font-semibold text-[#221b15]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-[0.68rem] text-[#8b8173]">{subtitle}</p>
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  detail,
  trend,
  icon,
}: {
  label: string;
  value: string;
  detail?: string;
  trend?: { value: string; positive: boolean };
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-crm-line bg-white p-5 shadow-[0_1px_2px_rgba(34,27,21,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#8b8173]">
          {label}
        </p>
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4eee2] text-[#8a6a3c]">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-[1.75rem] leading-none text-[#221b15]">
        {value}
      </p>
      <div className="mt-3 flex items-center gap-2">
        {trend && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold ${
              trend.positive
                ? "bg-[#e2ecdc] text-[#3f5c36]"
                : "bg-[#f1dedb] text-[#88423a]"
            }`}
          >
            {trend.positive ? "▲" : "▼"} {trend.value}
          </span>
        )}
        {detail && <p className="text-[0.68rem] text-[#8b8173]">{detail}</p>}
      </div>
    </div>
  );
}

export function OrderPill({ status }: { status: string }) {
  const meta = orderStatusMeta[status] ?? {
    label: status,
    className: "bg-[#eceae4] text-[#6d6355] ring-[#d6cec1]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.62rem] font-medium ring-1 ring-inset ${meta.className}`}
    >
      <span className="h-1 w-1 rounded-full bg-current opacity-70" />
      {meta.label}
    </span>
  );
}

export function LeadPill({ status }: { status: string }) {
  const meta = leadStatusMeta[status] ?? {
    label: status,
    className: "bg-[#eceae4] text-[#6d6355] ring-[#d6cec1]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.62rem] font-medium ring-1 ring-inset ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

export function ChannelBadge({ channel }: { channel: string }) {
  const labels: Record<string, string> = {
    web: "Website",
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    studio: "Studio",
  };
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-[#f4eee2] px-2 py-0.5 text-[0.6rem] font-medium capitalize text-[#7a6244]">
      {labels[channel] ?? channel}
    </span>
  );
}

export function Avatar({ name }: { name: string }) {
  const letters = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8dfcf] text-[0.62rem] font-semibold text-[#6b5a42]">
      {letters || "TB"}
    </span>
  );
}

export function EmptyState({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <p className="font-display text-lg text-[#3c332a]">{title}</p>
      <p className="max-w-sm text-[0.76rem] leading-relaxed text-[#8b8173]">{copy}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
