"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/kit";
import { formatIdr, formatUsdFromIdr } from "@/lib/format";
import {
  MONOGRAM_PRICE,
  SHOE_TREE_PRICE,
  customHardware,
  customLeathers,
  customModels,
  customSizes,
  customSoles,
  site,
} from "@/lib/site";

const leatherPreview: Record<string, string> = {
  tochigi: "/images/boot-olive.jpg",
  shinki: "/images/boot-oxblood.jpg",
  chromexcel: "/images/boot-engineer.jpg",
  veg: "/images/boot-monkey.jpg",
  croc: "/images/boot-croc.jpg",
};

type SubmitState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "sent"; reference: string }
  | { status: "error"; message: string };

export function Configurator() {
  const [modelId, setModelId] = useState<string>(customModels[0].id);
  const [leatherId, setLeatherId] = useState<string>(customLeathers[0].id);
  const [soleId, setSoleId] = useState<string>(customSoles[0].id);
  const [hardwareId, setHardwareId] = useState<string>(customHardware[0].id);
  const [size, setSize] = useState<string>("42");
  const [monogram, setMonogram] = useState("");
  const [trees, setTrees] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", country: "" });
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  const model = customModels.find((item) => item.id === modelId) ?? customModels[0];
  const leather =
    customLeathers.find((item) => item.id === leatherId) ?? customLeathers[0];
  const sole = customSoles.find((item) => item.id === soleId) ?? customSoles[0];
  const hardware =
    customHardware.find((item) => item.id === hardwareId) ?? customHardware[0];

  const total = useMemo(
    () =>
      model.base +
      leather.add +
      sole.add +
      hardware.add +
      (monogram ? MONOGRAM_PRICE : 0) +
      (trees ? SHOE_TREE_PRICE : 0),
    [model, leather, sole, hardware, monogram, trees],
  );

  const spec = useMemo(
    () =>
      [
        `Model: ${model.label}`,
        `Upper: ${leather.label} — ${leather.color}`,
        `Sole: ${sole.label}`,
        `Hardware: ${hardware.label}`,
        `Size: EU ${size} (D width)`,
        monogram ? `Monogram: ${monogram.toUpperCase()}` : null,
        trees ? "Shoe trees: included" : null,
        `Estimate: ${formatIdr(total)}`,
      ]
        .filter(Boolean)
        .join(" / "),
    [model, leather, sole, hardware, size, monogram, trees, total],
  );

  const whatsappHref = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
    `Hi Tahura Boots Co., I'd like to start this custom build — ${spec}`,
  )}`;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setState({
        status: "error",
        message: "Please add your name and email so the studio can reply.",
      });
      return;
    }
    setState({ status: "sending" });
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          country: form.country || "Indonesia",
          productInterest: `Custom build — ${model.label}`,
          message: spec,
          source: "configurator",
          valueIdr: total,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; reference?: string };
      if (!response.ok || !data.ok) {
        throw new Error("The studio inbox did not respond. Try WhatsApp.");
      }
      setState({ status: "sent", reference: data.reference ?? "TB-REQ" });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Try WhatsApp instead.",
      });
    }
  }

  return (
    <section
      id="custom"
      className="relative overflow-hidden border-t border-line/60 bg-ink-2 py-20 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(200,162,102,0.12),transparent_65%)]" />
        <div className="grain-layer" />
      </div>

      <div className="container-x relative">
        <SectionHeading
          index="04"
          eyebrow="Made to order"
          title={
            <>
              Build it once.
              <br />
              <span className="italic text-brass-light">Wear it for decades.</span>
            </>
          }
          copy="Pick a model, a hide and a sole. The studio replies within two working days with a build slot, a fitting sheet and a deposit link."
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.18fr_0.82fr] lg:gap-12">
          <div className="space-y-8">
            <Step label="01" title="The model">
              <div className="grid gap-2 sm:grid-cols-2">
                {customModels.map((item) => {
                  const active = item.id === model.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setModelId(item.id);
                        setState({ status: "idle" });
                      }}
                      aria-pressed={active}
                      className={`group border p-4 text-left transition-all ${
                        active
                          ? "border-brass bg-brass/[0.08]"
                          : "border-line hover:border-line-soft hover:bg-paper/[0.02]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={`font-display text-[1.05rem] ${active ? "text-brass-light" : "text-paper"}`}
                        >
                          {item.label}
                        </span>
                        <span
                          className={`mt-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
                            active ? "border-brass" : "border-line-soft"
                          }`}
                        >
                          {active && (
                            <span className="h-1.5 w-1.5 rounded-full bg-brass" />
                          )}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[0.7rem] leading-relaxed text-paper/45">
                        {item.blurb}
                      </p>
                      <p className="mt-3 text-[0.62rem] uppercase tracking-[0.16em] text-mute">
                        from {formatIdr(item.base)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </Step>

            <Step label="02" title="The leather">
              <div className="flex flex-wrap gap-2">
                {customLeathers.map((item) => {
                  const active = item.id === leather.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLeatherId(item.id)}
                      aria-pressed={active}
                      className={`flex items-center gap-3 border px-3 py-2.5 transition-all ${
                        active
                          ? "border-brass bg-brass/[0.08]"
                          : "border-line hover:border-line-soft"
                      }`}
                    >
                      <span
                        className="h-6 w-6 rounded-full ring-1 ring-black/40"
                        style={{ backgroundColor: item.swatch }}
                      />
                      <span className="text-left">
                        <span
                          className={`block text-[0.72rem] ${active ? "text-paper" : "text-paper/75"}`}
                        >
                          {item.label}
                        </span>
                        <span className="block text-[0.56rem] uppercase tracking-[0.14em] text-mute">
                          {item.color}
                          {item.add > 0 ? ` · +${formatIdr(item.add)}` : " · included"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Step>

            <div className="grid gap-8 sm:grid-cols-2">
              <Step label="03" title="The sole">
                <div className="space-y-2">
                  {customSoles.map((item) => {
                    const active = item.id === sole.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSoleId(item.id)}
                        aria-pressed={active}
                        className={`flex w-full items-center justify-between border px-3 py-2.5 text-left transition-colors ${
                          active ? "border-brass bg-brass/[0.08]" : "border-line"
                        }`}
                      >
                        <span>
                          <span className="block text-[0.75rem] text-paper/85">
                            {item.label}
                          </span>
                          <span className="block text-[0.56rem] uppercase tracking-[0.14em] text-mute">
                            {item.blurb}
                          </span>
                        </span>
                        <span className="text-[0.6rem] text-mute">
                          {item.add === 0 ? "incl." : `+${formatIdr(item.add)}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Step>

              <Step label="04" title="Hardware & size">
                <div className="flex gap-1.5">
                  {customHardware.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setHardwareId(item.id)}
                      aria-pressed={item.id === hardware.id}
                      className={`flex-1 border px-2 py-2 text-[0.56rem] uppercase tracking-[0.1em] transition-colors ${
                        item.id === hardware.id
                          ? "border-brass bg-brass/[0.08] text-paper"
                          : "border-line text-paper/60"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-5 gap-1.5">
                  {customSizes.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSize(item)}
                      aria-pressed={item === size}
                      className={`border py-2 text-[0.68rem] transition-colors ${
                        item === size
                          ? "border-brass bg-brass text-ink"
                          : "border-line text-paper/65 hover:border-line-soft"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </Step>
            </div>

            <Step label="05" title="The finishing touches">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-3 border border-line px-3 py-3">
                  <input
                    value={monogram}
                    onChange={(event) =>
                      setMonogram(event.target.value.slice(0, 3).toUpperCase())
                    }
                    placeholder="MIN"
                    maxLength={3}
                    className="w-16 border-b border-line-soft bg-transparent py-1 text-center font-display text-lg tracking-[0.2em] text-paper outline-none placeholder:text-paper/25 focus:border-brass"
                  />
                  <span className="text-[0.66rem] leading-snug text-paper/60">
                    Up to 3 initials, hot-stamped inside the collar
                    <span className="mt-0.5 block text-[0.56rem] uppercase tracking-[0.14em] text-mute">
                      +{formatIdr(MONOGRAM_PRICE)}
                    </span>
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setTrees((value) => !value)}
                  aria-pressed={trees}
                  className={`flex items-center justify-between gap-3 border px-3 py-3 text-left transition-colors ${
                    trees ? "border-brass bg-brass/[0.08]" : "border-line"
                  }`}
                >
                  <span className="text-[0.66rem] leading-snug text-paper/60">
                    Add a pair of cedar shoe trees
                    <span className="mt-0.5 block text-[0.56rem] uppercase tracking-[0.14em] text-mute">
                      +{formatIdr(SHOE_TREE_PRICE)}
                    </span>
                  </span>
                  <span
                    className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
                      trees ? "bg-brass" : "bg-line"
                    }`}
                  >
                    <span
                      className={`h-4 w-4 rounded-full bg-paper transition-transform ${
                        trees ? "translate-x-4" : ""
                      }`}
                    />
                  </span>
                </button>
              </div>
            </Step>
          </div>

          <Reveal className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-line bg-paper text-ink">
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-ink">
                <Image
                  key={leather.id}
                  src={leatherPreview[leather.id] ?? "/images/boot-olive.jpg"}
                  alt={`${leather.label} preview`}
                  fill
                  sizes="(min-width: 1024px) 32vw, 92vw"
                  className="animate-rise object-cover"
                />
                <div
                  className="absolute inset-0 opacity-30 mix-blend-multiply"
                  style={{ backgroundColor: leather.swatch }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-paper">
                  <div>
                    <p className="text-[0.52rem] uppercase tracking-[0.22em] text-brass-light">
                      Your build
                    </p>
                    <p className="mt-1 font-display text-xl leading-none">
                      {model.label}
                    </p>
                  </div>
                  <p className="text-[0.6rem] uppercase tracking-[0.18em] text-paper/70">
                    EU {size}
                  </p>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between border-b border-ink/15 pb-3">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ink/50">
                    Build sheet
                  </p>
                  <span className="flex items-center gap-1.5 text-[0.54rem] uppercase tracking-[0.14em] text-ink/45">
                    <span className="h-1 w-1 rounded-full bg-[#6f8f5f] animate-soft-pulse" />
                    Live estimate
                  </span>
                </div>

                <dl className="mt-3 divide-y divide-ink/10 text-[0.72rem]">
                  {[
                    ["Model", model.label],
                    ["Upper", `${leather.label} · ${leather.color}`],
                    ["Sole", sole.label],
                    ["Hardware", hardware.label],
                    ["Size", `EU ${size} · D width`],
                    ["Monogram", monogram ? monogram : "—"],
                    ["Shoe trees", trees ? "Included" : "—"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-baseline justify-between gap-4 py-2"
                    >
                      <dt className="text-[0.56rem] uppercase tracking-[0.14em] text-ink/40">
                        {label}
                      </dt>
                      <dd className="max-w-[62%] text-right text-ink/80">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-3 border-t border-ink/20 pt-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[0.56rem] uppercase tracking-[0.16em] text-ink/40">
                        Build estimate
                      </p>
                      <p className="mt-1 font-display text-2xl leading-none text-ink">
                        {formatIdr(total)}
                      </p>
                    </div>
                    <p className="text-right text-[0.6rem] leading-relaxed text-ink/45">
                      {formatUsdFromIdr(total)}
                      <br />
                      50% deposit
                    </p>
                  </div>
                </div>

                {state.status === "sent" ? (
                  <div className="mt-4 border border-[#6f8f5f]/40 bg-[#6f8f5f]/10 p-4">
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-[#415c36]">
                      Build sent to the studio
                    </p>
                    <p className="mt-1.5 text-[0.76rem] leading-relaxed text-ink/65">
                      Reference{" "}
                      <span className="font-medium text-ink">{state.reference}</span>.
                      We reply within two working days — check your inbox for the
                      fitting sheet.
                    </p>
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-[#415c36] underline decoration-current/40 underline-offset-4"
                    >
                      Or send it on WhatsApp ↗
                    </a>
                  </div>
                ) : (
                  <form onSubmit={submit} className="mt-4 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={form.name}
                        onChange={(event) =>
                          setForm({ ...form, name: event.target.value })
                        }
                        placeholder="Name"
                        aria-label="Your name"
                        className="w-full border border-ink/20 bg-white px-3 py-2.5 text-[0.76rem] text-ink outline-none placeholder:text-ink/35 focus:border-brass"
                      />
                      <input
                        value={form.country}
                        onChange={(event) =>
                          setForm({ ...form, country: event.target.value })
                        }
                        placeholder="Country"
                        aria-label="Country"
                        className="w-full border border-ink/20 bg-white px-3 py-2.5 text-[0.76rem] text-ink outline-none placeholder:text-ink/35 focus:border-brass"
                      />
                    </div>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm({ ...form, email: event.target.value })
                      }
                      placeholder="Email"
                      aria-label="Email"
                      className="w-full border border-ink/20 bg-white px-3 py-2.5 text-[0.76rem] text-ink outline-none placeholder:text-ink/35 focus:border-brass"
                    />
                    <button
                      type="submit"
                      disabled={state.status === "sending"}
                      className="flex w-full items-center justify-between bg-ink px-4 py-3.5 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ink-3 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {state.status === "sending"
                        ? "Sending to the bench…"
                        : "Send this build"}
                      <span>→</span>
                    </button>
                    {state.status === "error" && (
                      <p className="text-[0.68rem] leading-relaxed text-oxblood">
                        {state.message}
                      </p>
                    )}
                    <p className="text-center text-[0.56rem] uppercase tracking-[0.12em] text-ink/35">
                      No payment now · 6–8 week build
                    </p>
                  </form>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border border-line/70 px-4 py-3">
              <p className="text-[0.58rem] uppercase tracking-[0.16em] text-mute">
                Prefer to talk it through?
              </p>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-brass transition-colors hover:text-brass-light"
              >
                WhatsApp ↗
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Step({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <span className="text-[0.58rem] tracking-[0.2em] text-brass">
          {label}
        </span>
        <span className="h-px w-6 bg-brass/40" />
        <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-paper/70">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
