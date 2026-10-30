"use client";

import { useState } from "react";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/kit";
import { faqs, site } from "@/lib/site";

const interests = [
  "Ready-to-ship pair",
  "Custom build",
  "Repair or resole",
  "Wholesale / stockist",
  "Sizing advice",
  "Something else",
];

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; reference: string }
  | { kind: "error"; message: string };

export function Studio() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    interest: interests[0],
    message: "",
  });
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({
        kind: "error",
        message: "Name, email and a short message are required.",
      });
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          country: form.country || "Indonesia",
          productInterest: form.interest,
          message: form.message,
          source: "contact",
          valueIdr: 0,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; reference?: string };
      if (!response.ok || !data.ok) {
        throw new Error("The studio inbox could not be reached. Try WhatsApp.");
      }
      setStatus({ kind: "sent", reference: data.reference ?? "TB-REQ" });
      setForm({
        name: "",
        email: "",
        phone: "",
        country: "",
        interest: interests[0],
        message: "",
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  }

  return (
    <section id="studio" className="relative bg-paper py-20 text-ink lg:py-28">
      <div className="container-x">
        <SectionHeading
          index="07"
          eyebrow="The studio"
          title={
            <>
              Come and be
              <br />
              <span className="italic text-oxblood">measured properly.</span>
            </>
          }
          copy="The studio sits on Jl. Ters Kopo in Bandung. Walk-ins are welcome, but a booked fitting gets the full hour and a coffee."
          inverted
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div>
            <Reveal>
              <div className="relative overflow-hidden border border-ink/15 bg-[#e9e0cf]">
                <div
                  className="absolute inset-0 opacity-[0.5]"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(60,45,30,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(60,45,30,0.12) 1px, transparent 1px)",
                    backgroundSize: "38px 38px",
                  }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_46%,rgba(109,33,38,0.14),transparent_55%)]" />
                <div className="relative flex h-[230px] flex-col justify-between p-5">
                  <div className="flex items-start justify-between">
                    <span className="border border-ink/20 bg-paper/70 px-2.5 py-1 text-[0.52rem] uppercase tracking-[0.18em] text-ink/60 backdrop-blur-sm">
                      Bandung · 40218
                    </span>
                    <span className="text-[0.52rem] uppercase tracking-[0.18em] text-ink/40">
                      6.9147° S / 107.6098° E
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-oxblood/40 animate-soft-pulse" />
                        <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-paper bg-oxblood" />
                      </span>
                      <div>
                        <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-ink/70">
                          Tahura studio
                        </p>
                        <p className="text-[0.55rem] uppercase tracking-[0.14em] text-ink/40">
                          Jl. Ters Kopo · Mekar Rahayu
                        </p>
                      </div>
                    </div>
                    <a
                      href={site.mapsHref}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-2 text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-ink/60 hover:text-oxblood"
                    >
                      Open map
                      <span className="transition-transform group-hover:translate-x-0.5">
                        ↗
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-[0.56rem] font-semibold uppercase tracking-[0.2em] text-ink/40">
                  Address
                </p>
                <p className="mt-2 text-[0.82rem] leading-relaxed text-ink/75">
                  {site.addressLine1}
                  <br />
                  {site.addressLine2}
                </p>
              </div>
              <div>
                <p className="text-[0.56rem] font-semibold uppercase tracking-[0.2em] text-ink/40">
                  Studio hours
                </p>
                <p className="mt-2 text-[0.82rem] leading-relaxed text-ink/75">
                  {site.hours}
                  <br />
                  Sunday by appointment
                </p>
              </div>
            </div>

            <div className="mt-6 divide-y divide-ink/10 border-y border-ink/15">
              {[
                { label: "WhatsApp the bench", value: "+62 811 2233 4455", href: site.whatsappHref },
                { label: "Email the studio", value: site.email, href: `mailto:${site.email}` },
                { label: "Instagram", value: site.instagramHandle, href: site.instagram },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  className="group flex items-center justify-between gap-4 py-3.5"
                >
                  <span className="text-[0.58rem] uppercase tracking-[0.16em] text-ink/40">
                    {item.label}
                  </span>
                  <span className="flex items-center gap-2 text-[0.82rem] text-ink/80 transition-colors group-hover:text-oxblood">
                    {item.value}
                    <span className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                      ↗
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <Reveal delay={80}>
            <div className="border border-ink/15 bg-white p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                <div>
                  <p className="text-[0.56rem] font-semibold uppercase tracking-[0.2em] text-oxblood">
                    Message the bench
                  </p>
                  <h3 className="mt-1 font-display text-2xl leading-tight text-ink">
                    Tell us what you need
                  </h3>
                </div>
                <span className="hidden border border-ink/15 px-2.5 py-1 text-[0.52rem] uppercase tracking-[0.16em] text-ink/40 sm:block">
                  Replies in 2 days
                </span>
              </div>

              {status.kind === "sent" ? (
                <div className="mt-6 border border-[#6f8f5f]/40 bg-[#6f8f5f]/[0.08] p-5">
                  <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-[#415c36]">
                    Message received
                  </p>
                  <p className="mt-2 text-[0.85rem] leading-relaxed text-ink/70">
                    Thank you — reference{" "}
                    <span className="font-medium text-ink">{status.reference}</span>.
                    It landed in the studio inbox and the owner will reply within
                    two working days.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatus({ kind: "idle" })}
                    className="mt-4 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-[#415c36] underline decoration-current/40 underline-offset-4"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="mt-5 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="studio-name" className="crm-label !text-ink/45">
                        Name
                      </label>
                      <input
                        id="studio-name"
                        value={form.name}
                        onChange={(event) =>
                          setForm({ ...form, name: event.target.value })
                        }
                        className="w-full border border-ink/15 bg-paper/40 px-3 py-2.5 text-[0.82rem] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-brass focus:bg-white"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="studio-email" className="crm-label !text-ink/45">
                        Email
                      </label>
                      <input
                        id="studio-email"
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          setForm({ ...form, email: event.target.value })
                        }
                        className="w-full border border-ink/15 bg-paper/40 px-3 py-2.5 text-[0.82rem] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-brass focus:bg-white"
                        placeholder="you@studio.com"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="studio-phone" className="crm-label !text-ink/45">
                        WhatsApp / phone
                      </label>
                      <input
                        id="studio-phone"
                        value={form.phone}
                        onChange={(event) =>
                          setForm({ ...form, phone: event.target.value })
                        }
                        className="w-full border border-ink/15 bg-paper/40 px-3 py-2.5 text-[0.82rem] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-brass focus:bg-white"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label htmlFor="studio-country" className="crm-label !text-ink/45">
                        Country
                      </label>
                      <input
                        id="studio-country"
                        value={form.country}
                        onChange={(event) =>
                          setForm({ ...form, country: event.target.value })
                        }
                        className="w-full border border-ink/15 bg-paper/40 px-3 py-2.5 text-[0.82rem] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-brass focus:bg-white"
                        placeholder="Indonesia"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="studio-interest" className="crm-label !text-ink/45">
                      What is it about?
                    </label>
                    <select
                      id="studio-interest"
                      value={form.interest}
                      onChange={(event) =>
                        setForm({ ...form, interest: event.target.value })
                      }
                      className="w-full border border-ink/15 bg-paper/40 px-3 py-2.5 text-[0.82rem] text-ink outline-none transition-colors focus:border-brass focus:bg-white"
                    >
                      {interests.map((interest) => (
                        <option key={interest}>{interest}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="studio-message" className="crm-label !text-ink/45">
                      Message
                    </label>
                    <textarea
                      id="studio-message"
                      value={form.message}
                      onChange={(event) =>
                        setForm({ ...form, message: event.target.value })
                      }
                      rows={4}
                      className="w-full resize-none border border-ink/15 bg-paper/40 px-3 py-2.5 text-[0.82rem] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-brass focus:bg-white"
                      placeholder="Sizes, leathers, dates — anything that helps us answer properly."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status.kind === "sending"}
                    className="group flex w-full items-center justify-between bg-ink px-5 py-4 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ink-3 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status.kind === "sending" ? "Sending…" : "Send to the studio"}
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </button>
                  {status.kind === "error" && (
                    <p className="text-[0.72rem] text-oxblood">{status.message}</p>
                  )}
                  <p className="text-center text-[0.55rem] uppercase tracking-[0.12em] text-ink/35">
                    No mailing list. Just a reply from the maker.
                  </p>
                </form>
              )}
            </div>
          </Reveal>
        </div>

        <div className="mt-16 border-t border-ink/15">
          <div className="grid gap-x-12 md:grid-cols-2">
            {faqs.map((faq, index) => (
              <details
                key={faq.q}
                className="group border-b border-ink/15 py-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6">
                  <span className="flex items-baseline gap-3">
                    <span className="text-[0.56rem] tracking-[0.2em] text-ink/35">
                      0{index + 1}
                    </span>
                    <span className="font-display text-[1.05rem] text-ink">
                      {faq.q}
                    </span>
                  </span>
                  <span className="text-lg text-ink/40 transition-transform duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-lg pl-7 text-[0.82rem] leading-relaxed text-ink/55">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
