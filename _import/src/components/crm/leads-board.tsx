"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LEAD_STATUSES, leadStatusMeta } from "@/lib/catalog";
import { formatIdr, timeAgo } from "@/lib/format";
import { LeadPill } from "@/components/crm/ui";

export type CrmLead = {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  productInterest: string;
  message: string;
  source: string;
  status: string;
  valueIdr: number;
  notes: string;
  createdAt: string;
};

export function LeadsBoard({ initial }: { initial: CrmLead[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CrmLead | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    setLeads(initial);
  }, [initial]);

  async function patch(id: number, body: Record<string, unknown>) {
    setBusy(id);
    setError(null);
    try {
      const response = await fetch(`/api/crm/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; lead?: CrmLead };
      if (!response.ok || !data.ok || !data.lead) {
        setError(data.error ?? "Could not update the lead.");
        return false;
      }
      setLeads((current) =>
        current.map((lead) => (lead.id === id ? { ...lead, ...data.lead } : lead)),
      );
      router.refresh();
      return true;
    } catch {
      setError("Network error — the lead was not updated.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  function move(lead: CrmLead, direction: number) {
    const index = LEAD_STATUSES.indexOf(lead.status as (typeof LEAD_STATUSES)[number]);
    const next = LEAD_STATUSES[Math.min(LEAD_STATUSES.length - 1, Math.max(0, index + direction))];
    if (next && next !== lead.status) {
      void patch(lead.id, { status: next });
    }
  }

  async function saveNotes() {
    if (!selected) return;
    setSavingNotes(true);
    const ok = await patch(selected.id, { notes });
    setSavingNotes(false);
    if (ok) {
      setSelected(null);
      setNotes("");
    }
  }

  const openValue = leads
    .filter((lead) => ["new", "contacted", "quoted"].includes(lead.status))
    .reduce((sum, lead) => sum + lead.valueIdr, 0);
  const newThisWeek = leads.filter(
    (lead) =>
      new Date(lead.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).length;
  const won = leads.filter((lead) => lead.status === "won");
  const conversion = leads.length ? Math.round((won.length / leads.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Open pipeline", formatIdr(openValue)],
          ["New this week", String(newThisWeek)],
          ["Converted", `${won.length} (${conversion}%)`],
          ["Total enquiries", String(leads.length)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-crm-line bg-white px-4 py-3">
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[#a19683]">{label}</p>
            <p className="mt-1 font-display text-xl text-[#221b15]">{value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[#dfc0bb] bg-[#f1dedb] px-4 py-2.5 text-[0.76rem] text-[#88423a]">
          {error}
          <button type="button" onClick={() => setError(null)} className="font-semibold">✕</button>
        </div>
      )}

      <div className="hide-scrollbar grid gap-3 overflow-x-auto pb-2 md:grid-cols-2 xl:grid-cols-5">
        {LEAD_STATUSES.map((stage) => {
          const stageMeta = leadStatusMeta[stage];
          const stageLeads = leads.filter((lead) => lead.status === stage);
          return (
            <div key={stage} className="min-w-[260px] rounded-xl border border-crm-line bg-[#faf7f1]">
              <div className="flex items-center justify-between border-b border-crm-line px-3 py-2.5">
                <span className="flex items-center gap-2 text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-[#5f5548]">
                  <span className={`h-1.5 w-1.5 rounded-full ${stageMeta.accent}`} />
                  {stageMeta.label}
                </span>
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[0.58rem] font-semibold text-[#8b8173]">
                  {stageLeads.length}
                </span>
              </div>
              <div className="space-y-2 p-2">
                {stageLeads.map((lead) => {
                  const stageIndex = LEAD_STATUSES.indexOf(stage);
                  return (
                    <div
                      key={lead.id}
                      className="group rounded-lg border border-crm-line bg-white p-3 shadow-[0_1px_2px_rgba(34,27,21,0.04)] transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[0.76rem] font-semibold text-[#221b15]">{lead.name}</p>
                          <p className="text-[0.6rem] text-[#a19683]">
                            {lead.country} · {lead.source === "configurator" ? "Build" : lead.source === "contact" ? "Enquiry" : lead.source}
                          </p>
                        </div>
                        <span className="shrink-0 text-[0.55rem] uppercase tracking-[0.1em] text-[#c0b6a5]">
                          {timeAgo(lead.createdAt)}
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-2 text-[0.68rem] leading-relaxed text-[#7a7062]">
                        {lead.message || lead.productInterest}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2 border-t border-crm-line/70 pt-2">
                        <span className="truncate text-[0.58rem] uppercase tracking-[0.1em] text-[#a19683]">
                          {lead.productInterest}
                        </span>
                        {lead.valueIdr > 0 && (
                          <span className="shrink-0 text-[0.65rem] font-semibold text-[#5f5548]">
                            {formatIdr(lead.valueIdr)}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-1">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={stageIndex === 0 || busy === lead.id}
                            onClick={() => move(lead, -1)}
                            aria-label="Move lead back a stage"
                            className="flex h-6 w-6 items-center justify-center rounded border border-crm-line text-[0.6rem] text-[#a19683] hover:bg-[#f4eee2] disabled:opacity-30"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            disabled={stageIndex === LEAD_STATUSES.length - 1 || busy === lead.id}
                            onClick={() => move(lead, 1)}
                            aria-label="Move lead forward a stage"
                            className="flex h-6 w-6 items-center justify-center rounded border border-crm-line text-[0.6rem] text-[#a19683] hover:bg-[#f4eee2] disabled:opacity-30"
                          >
                            →
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(lead);
                            setNotes(lead.notes);
                          }}
                          className="rounded border border-crm-line px-2 py-1 text-[0.58rem] font-medium text-[#5f5548] hover:border-[#c6b699] hover:bg-[#faf6ee]"
                        >
                          Open card
                        </button>
                      </div>
                    </div>
                  );
                })}
                {stageLeads.length === 0 && (
                  <p className="px-2 py-6 text-center text-[0.66rem] text-[#c0b6a5]">
                    Nothing at this stage.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg rounded-xl border border-crm-line bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-crm-line px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <LeadPill status={selected.status} />
                  <span className="text-[0.58rem] uppercase tracking-[0.12em] text-[#a19683]">
                    {selected.source === "configurator" ? "Configurator build" : "Studio enquiry"}
                  </span>
                </div>
                <h2 className="mt-2 font-display text-xl text-[#221b15]">{selected.name}</h2>
                <p className="text-[0.7rem] text-[#8b8173]">
                  {selected.country} · {timeAgo(selected.createdAt)} ago
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-[#a19683] hover:text-[#221b15]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 px-5 py-4">
              <div>
                <p className="crm-label">Interest</p>
                <p className="text-[0.8rem] text-[#3c332a]">{selected.productInterest}</p>
              </div>
              <div>
                <p className="crm-label">Message</p>
                <p className="rounded-lg bg-[#faf7f1] px-3 py-2.5 text-[0.76rem] leading-relaxed text-[#5f5548]">
                  {selected.message || "No message left."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="crm-label">Email</p>
                  <a href={`mailto:${selected.email}`} className="break-all text-[0.74rem] text-[#7a5a2e] underline decoration-current/30 underline-offset-2">
                    {selected.email}
                  </a>
                </div>
                <div>
                  <p className="crm-label">Phone</p>
                  <p className="text-[0.74rem] text-[#5f5548]">{selected.phone || "—"}</p>
                </div>
                <div>
                  <p className="crm-label">Deal value</p>
                  <p className="text-[0.8rem] font-semibold text-[#221b15]">
                    {selected.valueIdr > 0 ? formatIdr(selected.valueIdr) : "Not quoted"}
                  </p>
                </div>
                <div>
                  <p className="crm-label">Stage</p>
                  <select
                    value={selected.status}
                    onChange={async (event) => {
                      const status = event.target.value;
                      setSelected({ ...selected, status });
                      await patch(selected.id, { status });
                    }}
                    className="crm-input !py-1.5"
                  >
                    {LEAD_STATUSES.map((stage) => (
                      <option key={stage} value={stage}>
                        {leadStatusMeta[stage].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="crm-label" htmlFor="lead-notes">
                  Studio notes
                </label>
                <textarea
                  id="lead-notes"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Quote sent, sizing notes, follow-up date…"
                  className="crm-input resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-crm-line px-5 py-4">
              <div className="flex gap-2">
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent("Tahura Boots — your enquiry")}`}
                  className="rounded-lg border border-crm-line px-3 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-[#5f5548] hover:border-[#c6b699]"
                >
                  Reply by email
                </a>
                {selected.phone && (
                  <a
                    href={`https://wa.me/${selected.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-crm-line px-3 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-[#5f5548] hover:border-[#c6b699]"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={saveNotes}
                disabled={savingNotes}
                className="rounded-lg bg-ink px-4 py-2.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink-3 disabled:opacity-60"
              >
                {savingNotes ? "Saving…" : "Save notes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
