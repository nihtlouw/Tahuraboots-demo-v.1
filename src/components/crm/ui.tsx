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
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-[#a8865a]">
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
        <header className="flex flex-wrap items-start justify-between gap-2 border-b border-crm-line px-4 py-3.5 sm:gap-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[0.82rem] font-semibold text-[#221b15]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-[0.72rem] leading-snug text-[#8b8173]">
                {subtitle}
              </p>
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
    <div className="min-w-0 rounded-xl border border-crm-line bg-white p-3.5 shadow-[0_1px_2px_rgba(34,27,21,0.04)] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.64rem] font-semibold uppercase leading-[1.35] tracking-[0.12em] text-[#8b8173] sm:text-[0.66rem] sm:tracking-[0.16em]">
          {label}
        </p>
        {icon && (
          <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f4eee2] text-[#8a6a3c] sm:flex">
            {icon}
          </span>
        )}
      </div>
      {/*
        Angka rupiah bisa 12 karakter ("Rp 12.345.678"). Di kartu 158px pada
        layar 360px, 1.75rem membuatnya melewati tepi kartu. Ukuran ponsel
        diturunkan dan `break-words` menjaga nilai panjang tetap di dalam kartu
        alih-alih mendorong lebar halaman.
      */}
      <p className="mt-2 break-words font-display text-[1.05rem] leading-tight tabular-nums text-[#221b15] sm:mt-3 sm:text-[1.75rem] sm:leading-none">
        {value}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 sm:mt-3">
        {trend && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[0.64rem] font-semibold sm:text-[0.66rem] ${
              trend.positive
                ? "bg-[#e2ecdc] text-[#3f5c36]"
                : "bg-[#f1dedb] text-[#88423a]"
            }`}
          >
            {trend.positive ? "▲" : "▼"} {trend.value}
          </span>
        )}
        {detail && (
          <p className="text-[0.66rem] leading-snug text-[#8b8173] sm:text-[0.72rem]">
            {detail}
          </p>
        )}
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.66rem] font-medium ring-1 ring-inset ${meta.className}`}
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.66rem] font-medium ring-1 ring-inset ${meta.className}`}
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
    <span className="inline-flex items-center gap-1 rounded-md bg-[#f4eee2] px-2 py-0.5 text-[0.66rem] font-medium capitalize text-[#7a6244]">
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
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8dfcf] text-[0.66rem] font-semibold text-[#6b5a42]">
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
