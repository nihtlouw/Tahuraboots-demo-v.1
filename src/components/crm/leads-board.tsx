"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { LEAD_STATUSES, leadStatusMeta } from "@/lib/catalog";
import { formatIdr, timeAgo } from "@/lib/format";
import { LeadPill } from "@/components/crm/ui";
import {
  Banner,
  ConfirmDialog,
  Modal,
  ModalHeader,
  Toast,
  useToast,
} from "@/components/crm/overlay";
import { csvStamp, downloadCsv } from "@/lib/csv";

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

const sourceLabels: Record<string, string> = {
  configurator: "Configurator build",
  contact: "Studio enquiry",
  studio: "Manual entry",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
};

function sourceLabel(source: string) {
  return sourceLabels[source] ?? source;
}

const emptyDraft = {
  name: "",
  email: "",
  phone: "",
  country: "Indonesia",
  productInterest: "",
  message: "",
  source: "studio",
  valueIdr: "",
};

export function LeadsBoard({ initial }: { initial: CrmLead[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CrmLead | null>(null);
  const [savingCard, setSavingCard] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [pendingDelete, setPendingDelete] = useState<CrmLead | null>(null);
  const { toast, show: showToast, dismiss: dismissToast } = useToast();
  const [syncedInitial, setSyncedInitial] = useState(initial);
  const [weekAgo] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000);
  // Ponsel: satu tahap sekaligus, dipilih lewat chip di atas papan. Sebelumnya
  // lima kolom 260px memaksa geser horizontal ~1300px.
  const [mobileStage, setMobileStage] = useState<string>("new");

  // Server mengirim ulang data setelah router.refresh(); samakan state lokal
  // di fase render (pola resmi React, tanpa efek tambahan).
  if (syncedInitial !== initial) {
    setSyncedInitial(initial);
    setLeads(initial);
  }

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
        return null;
      }
      const updated = data.lead;
      setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, ...updated } : lead)));
      router.refresh();
      return updated;
    } catch {
      setError("Network error — the lead was not updated.");
      return null;
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

  async function saveCard() {
    if (!selected) return;
    setSavingCard(true);
    const updated = await patch(selected.id, {
      status: selected.status,
      notes: selected.notes,
      valueIdr: selected.valueIdr,
      productInterest: selected.productInterest,
    });
    setSavingCard(false);
    if (updated) {
      setSelected(null);
      showToast("Lead updated.");
    }
  }

  async function createLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingNew(true);
    setError(null);
    try {
      const response = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          valueIdr: Number(draft.valueIdr) || 0,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Could not add the lead.");
        return;
      }
      setCreating(false);
      setDraft(emptyDraft);
      showToast("Lead added to the pipeline.");
      router.refresh();
    } catch {
      setError("Network error — the lead was not added.");
    } finally {
      setSavingNew(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const lead = pendingDelete;
    setBusy(lead.id);
    try {
      const response = await fetch(`/api/crm/leads/${lead.id}`, { method: "DELETE" });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Could not remove the lead.");
        return;
      }
      setLeads((current) => current.filter((row) => row.id !== lead.id));
      setPendingDelete(null);
      setSelected(null);
      showToast(`Lead ${lead.name} removed.`);
      router.refresh();
    } catch {
      setError("Network error — the lead was not removed.");
    } finally {
      setBusy(null);
    }
  }

  const visibleLeads = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return leads;
    return leads.filter((lead) =>
      `${lead.name} ${lead.email} ${lead.phone} ${lead.productInterest} ${lead.country} ${lead.message}`
        .toLowerCase()
        .includes(needle),
    );
  }, [leads, query]);

  const openValue = visibleLeads
    .filter((lead) => ["new", "contacted", "quoted"].includes(lead.status))
    .reduce((sum, lead) => sum + lead.valueIdr, 0);
  const newThisWeek = visibleLeads.filter(
    (lead) => new Date(lead.createdAt).getTime() > weekAgo,
  ).length;
  const won = visibleLeads.filter((lead) => lead.status === "won");
  const conversion = visibleLeads.length
    ? Math.round((won.length / visibleLeads.length) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Open pipeline", formatIdr(openValue)],
          ["New this week", String(newThisWeek)],
          ["Converted", `${won.length} (${conversion}%)`],
          ["Total enquiries", String(visibleLeads.length)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-crm-line bg-white px-4 py-3">
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[#a19683]">{label}</p>
            <p className="mt-1 font-display text-xl text-[#221b15]">{value}</p>
          </div>
        ))}
      </div>

      {error && <Banner onDismiss={() => setError(null)}>{error}</Banner>}
      <Toast toast={toast} onDismiss={dismissToast} />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-crm-line bg-white px-3 py-2.5">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, email, pair…"
          className="crm-input !w-full sm:!w-64"
          aria-label="Search leads"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.62rem] text-[#8b8173]">
            {visibleLeads.length} of {leads.length} leads
          </span>
          <button
            type="button"
            onClick={() => {
              const ok = downloadCsv(
                csvStamp("tahura-leads"),
                visibleLeads.map((lead) => ({
                  name: lead.name,
                  email: lead.email,
                  phone: lead.phone,
                  country: lead.country,
                  productInterest: lead.productInterest,
                  source: lead.source,
                  status: lead.status,
                  valueIdr: lead.valueIdr,
                  notes: lead.notes,
                  createdAt: new Date(lead.createdAt).toISOString(),
                })),
              );
              if (ok) showToast(`${visibleLeads.length} leads exported to CSV.`);
              else setError("There is nothing to export in this view.");
            }}
            className="rounded-lg border border-crm-line bg-white px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#5f5548] transition-colors hover:border-[#c6b699]"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(emptyDraft);
              setCreating(true);
            }}
            className="rounded-lg bg-[#7a5a2e] px-3.5 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#5f451f]"
          >
            + New lead
          </button>
        </div>
      </div>

      <div className="hide-scrollbar snap-row -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden">
        {LEAD_STATUSES.map((stage) => {
          const count = visibleLeads.filter((lead) => lead.status === stage).length;
          const active = mobileStage === stage;
          return (
            <button
              key={stage}
              type="button"
              onClick={() => setMobileStage(stage)}
              aria-pressed={active}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[0.7rem] font-semibold transition-colors ${
                active
                  ? "border-transparent bg-ink text-paper"
                  : "border-crm-line bg-white text-[#5f5548] active:bg-[#faf6ee]"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${leadStatusMeta[stage].accent}`} />
              {leadStatusMeta[stage].label}
              <span className={`text-[0.6rem] ${active ? "text-paper/60" : "text-[#a19683]"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 pb-2 md:grid-cols-2 xl:grid-cols-5">
        {LEAD_STATUSES.map((stage) => {
          const stageMeta = leadStatusMeta[stage];
          const stageLeads = visibleLeads.filter((lead) => lead.status === stage);
          return (
            <div
              key={stage}
              className={`rounded-xl border border-crm-line bg-[#faf7f1] ${
                mobileStage === stage ? "block" : "hidden"
              } md:block`}
            >
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
                            {lead.country} · {sourceLabel(lead.source)}
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
                            aria-label={`Move ${lead.name} back a stage`}
                            className="tap-40 flex items-center justify-center rounded border border-crm-line text-[0.75rem] text-[#a19683] active:bg-[#f4eee2] disabled:opacity-30"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            disabled={stageIndex === LEAD_STATUSES.length - 1 || busy === lead.id}
                            onClick={() => move(lead, 1)}
                            aria-label={`Move ${lead.name} forward a stage`}
                            className="tap-40 flex items-center justify-center rounded border border-crm-line text-[0.75rem] text-[#a19683] active:bg-[#f4eee2] disabled:opacity-30"
                          >
                            →
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelected({ ...lead })}
                          className="min-h-10 rounded border border-crm-line px-3 text-[0.62rem] font-medium text-[#5f5548] active:bg-[#faf6ee]"
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

      {/* ── Lead card ───────────────────────────────────────────────── */}
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} width="max-w-lg" labelledBy="lead-card-title">
        {selected && (
          <>
            <ModalHeader
              id="lead-card-title"
              eyebrow={sourceLabel(selected.source)}
              title={selected.name}
              onClose={() => setSelected(null)}
            />

            <div className="space-y-3 px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <LeadPill status={selected.status} />
                <span className="text-[0.62rem] text-[#8b8173]">
                  {selected.country} · {timeAgo(selected.createdAt)}
                </span>
              </div>

              <div>
                <p className="crm-label">Message</p>
                <p className="rounded-lg bg-[#faf7f1] px-3 py-2.5 text-[0.76rem] leading-relaxed text-[#5f5548]">
                  {selected.message || "No message left."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
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
                  <label className="crm-label" htmlFor="lead-interest">Pair of interest</label>
                  <input
                    id="lead-interest"
                    value={selected.productInterest}
                    onChange={(event) => setSelected({ ...selected, productInterest: event.target.value })}
                    className="crm-input !py-1.5"
                  />
                </div>
                <div>
                  <label className="crm-label" htmlFor="lead-stage">Stage</label>
                  <select
                    id="lead-stage"
                    value={selected.status}
                    onChange={(event) => setSelected({ ...selected, status: event.target.value })}
                    className="crm-input !py-1.5"
                  >
                    {LEAD_STATUSES.map((stage) => (
                      <option key={stage} value={stage}>
                        {leadStatusMeta[stage].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="crm-label" htmlFor="lead-value">Deal value (IDR)</label>
                  <input
                    id="lead-value"
                    type="number"
                    min={0}
                    step={50000}
                    value={selected.valueIdr}
                    onChange={(event) =>
                      setSelected({ ...selected, valueIdr: Number(event.target.value) || 0 })
                    }
                    className="crm-input !py-1.5"
                  />
                  <p className="mt-1 text-[0.58rem] text-[#a19683]">
                    Used for the open-pipeline total.
                  </p>
                </div>
              </div>

              <div>
                <label className="crm-label" htmlFor="lead-notes">Studio notes</label>
                <textarea
                  id="lead-notes"
                  rows={3}
                  value={selected.notes}
                  onChange={(event) => setSelected({ ...selected, notes: event.target.value })}
                  placeholder="Quote sent, sizing notes, follow-up date…"
                  className="crm-input resize-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-crm-line px-5 py-4 sheet-actions">
              <div className="flex flex-wrap gap-2">
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent("Tahura Boots — your enquiry")}`}
                  className="rounded-lg border border-crm-line px-3 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-[#5f5548] hover:border-[#c6b699]"
                >
                  Email
                </a>
                {selected.phone.replace(/\D/g, "") && (
                  <a
                    href={`https://wa.me/${selected.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-crm-line px-3 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-[#5f5548] hover:border-[#c6b699]"
                  >
                    WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPendingDelete(selected)}
                  className="rounded-lg border border-transparent px-3 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-[#a19683] hover:border-[#dfc0bb] hover:bg-[#f1dedb] hover:text-[#88423a]"
                >
                  Delete
                </button>
              </div>
              <button
                type="button"
                onClick={saveCard}
                disabled={savingCard || busy === selected.id}
                className="rounded-lg bg-ink px-4 py-2.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink-3 disabled:opacity-60"
              >
                {savingCard ? "Saving…" : "Save card"}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ── New lead ────────────────────────────────────────────────── */}
      <Modal open={creating} onClose={() => setCreating(false)} labelledBy="lead-new-title">
        <form onSubmit={createLead}>
          <ModalHeader
            id="lead-new-title"
            eyebrow="Pipeline"
            title="Add a lead by hand"
            onClose={() => setCreating(false)}
          />
          <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
            <div>
              <label className="crm-label" htmlFor="new-lead-name">Name</label>
              <input id="new-lead-name" required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="crm-input" placeholder="Raka Pradipta" />
            </div>
            <div>
              <label className="crm-label" htmlFor="new-lead-email">Email</label>
              <input id="new-lead-email" required type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} className="crm-input" placeholder="raka@email.com" />
            </div>
            <div>
              <label className="crm-label" htmlFor="new-lead-phone">Phone / WhatsApp</label>
              <input id="new-lead-phone" type="tel" inputMode="tel" autoComplete="tel" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} className="crm-input" placeholder="+62 812 …" />
            </div>
            <div>
              <label className="crm-label" htmlFor="new-lead-country">Country</label>
              <input id="new-lead-country" value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value })} className="crm-input" />
            </div>
            <div>
              <label className="crm-label" htmlFor="new-lead-pair">Pair of interest</label>
              <input id="new-lead-pair" value={draft.productInterest} onChange={(event) => setDraft({ ...draft, productInterest: event.target.value })} className="crm-input" placeholder="Ters Kopo Brogue · EU 43" />
            </div>
            <div>
              <label className="crm-label" htmlFor="new-lead-value">Deal value (IDR)</label>
              <input id="new-lead-value" type="number" min={0} step={50000} value={draft.valueIdr} onChange={(event) => setDraft({ ...draft, valueIdr: event.target.value })} className="crm-input" placeholder="3450000" />
            </div>
            <div className="sm:col-span-2">
              <label className="crm-label" htmlFor="new-lead-source">Came from</label>
              <select id="new-lead-source" value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value })} className="crm-input">
                <option value="studio">Studio visit / phone</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="contact">Storefront enquiry</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="crm-label" htmlFor="new-lead-message">What did they ask for?</label>
              <textarea id="new-lead-message" rows={3} value={draft.message} onChange={(event) => setDraft({ ...draft, message: event.target.value })} className="crm-input resize-none" placeholder="Size run, leather, timeline…" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-crm-line px-5 py-4 sheet-actions">
            <button type="button" onClick={() => setCreating(false)} className="rounded-lg border border-crm-line px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#7a7062]">
              Cancel
            </button>
            <button type="submit" disabled={savingNew} className="rounded-lg bg-ink px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink-3 disabled:opacity-60">
              {savingNew ? "Adding…" : "Add lead"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.name ?? "this lead"}?`}
        message="The enquiry disappears from the pipeline. This cannot be undone."
        confirmLabel="Delete lead"
        busy={busy === pendingDelete?.id}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
