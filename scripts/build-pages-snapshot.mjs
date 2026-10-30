#!/usr/bin/env node
/**
 * Meregangkan snapshot statis UI (storefront + CRM) ke folder `docs/` supaya
 * bisa ditampilkan lewat GitHub Pages.
 *
 * Kenapa perlu snapshot?
 *   GitHub Pages hanya melayani file statis, sedangkan aplikasi ini adalah
 *   Next.js server-rendered dengan API routes dan Postgres. Snapshot merekam
 *   HTML hasil render + CSS + gambar apa adanya.
 *
 * Semua tautan dibuat RELATIF supaya folder ini bisa dilayani dari root,
 * dari `/docs/`, ataupun dari custom domain tanpa diubah lagi.
 *
 * Pemakaian:
 *   1) npm run build
 *   2) npx next start -p 3000          (terminal lain)
 *   3) npm run pages:build
 *
 * Env opsional:
 *   SNAPSHOT_BASE_URL   default http://127.0.0.1:3000
 *   SNAPSHOT_OUT        default docs
 *   SNAPSHOT_BASE_PATH  default /Tahuraboots-demo-v-1 (dipakai untuk 404.html)
 *   CRM_PASSCODE        default tahura2026 (membuka dashboard CRM)
 */
import fs from "node:fs/promises";
import path from "node:path";

const BASE = process.env.SNAPSHOT_BASE_URL ?? "http://127.0.0.1:3000";
const OUT = process.env.SNAPSHOT_OUT ?? "docs";
const BASE_PATH = (process.env.SNAPSHOT_BASE_PATH ?? "/Tahuraboots-demo-v-1").replace(/\/$/, "");
const PASSCODE = process.env.CRM_PASSCODE ?? "tahura2026";

const PAGES = ["/", "/crm", "/crm/orders", "/crm/products", "/crm/leads"];

const BANNER = `
<div id="static-demo-banner" role="status">
  <strong>Static demo</strong>
  <span>Snapshot UI Tahura Boots — data contoh, tombol &amp; formulir tidak aktif.
  Aplikasi lengkap butuh server + Postgres (deploy ke Vercel).</span>
  <button type="button" aria-label="Tutup" onclick="this.parentElement.remove()">×</button>
</div>
<style>
  #static-demo-banner{
    position:fixed;left:12px;bottom:12px;z-index:9999;display:flex;gap:10px;
    align-items:center;max-width:min(92vw,440px);padding:10px 12px;border-radius:4px;
    border:1px solid rgba(200,162,102,.55);background:rgba(15,13,11,.94);
    color:#f4eee2;font:500 11px/1.5 ui-sans-serif,system-ui,sans-serif;
    letter-spacing:.01em;box-shadow:0 14px 34px rgba(0,0,0,.5);backdrop-filter:blur(6px)
  }
  #static-demo-banner strong{
    color:#e3c995;text-transform:uppercase;letter-spacing:.14em;font-size:9px;white-space:nowrap
  }
  #static-demo-banner button{
    all:unset;cursor:pointer;padding:0 2px;font-size:15px;line-height:1;color:#a39a8b
  }
  #static-demo-banner button:hover{color:#f4eee2}
  /* Tanpa JS, konten beranimasi tetap terlihat. */
  .reveal{opacity:1!important;transform:none!important}
</style>
<script>
  // GitHub Pages tidak punya Next.js router: paksa navigasi penuh antar halaman.
  document.addEventListener('click', function (event) {
    var anchor = event.target && event.target.closest ? event.target.closest('a') : null;
    if (!anchor) return;
    var href = anchor.getAttribute('href');
    if (!href || /^(https?:|mailto:|tel:)/i.test(href) || anchor.target === '_blank') return;
    event.preventDefault();
    event.stopPropagation();
    window.location.href = anchor.href;
  }, true);
</script>`;

const sessionCookies = [];

async function login() {
  const response = await fetch(`${BASE}/api/crm/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passcode: PASSCODE }),
  });
  if (!response.ok) throw new Error(`Login CRM gagal (${response.status})`);
  for (const cookie of response.headers.getSetCookie?.() ?? []) {
    sessionCookies.push(cookie.split(";")[0]);
  }
  if (sessionCookies.length === 0) throw new Error("Cookie sesi CRM tidak diterima");
  console.log(`✓ Login CRM (${sessionCookies.length} cookie)`);
}

async function get(pathname) {
  return fetch(`${BASE}${pathname}`, {
    headers: sessionCookies.length ? { cookie: sessionCookies.join("; ") } : {},
  });
}

/** URL optimizer gambar Next → path gambar aslinya. */
function unoptimizeImages(html) {
  return html.replace(
    /\/_next\/image\?url=([^"'\s&]+)(?:&amp;|&)[^"']*/g,
    (_match, encoded) => {
      try {
        return decodeURIComponent(encoded);
      } catch {
        return `/${String(encoded).replace(/^\//, "")}`;
      }
    },
  );
}

/** Prefix relatif menuju root situs, sesuai kedalaman halaman. */
function basePrefix(route) {
  const depth = route === "/" ? 0 : route.split("/").filter(Boolean).length;
  return "../".repeat(depth);
}

function rewriteAssets(html, up) {
  return html.replace(/(["'(])\/(_next|images|fonts)\//g, `$1${up}$2/`);
}

function rewritePageLinks(html, up) {
  return html.replace(/href="(\/[^"]*)"/g, (match, href) => {
    const [pathname, hash] = href.split("#");
    if (!PAGES.includes(pathname)) return match;
    const target = pathname === "/" ? up || "./" : `${up}${pathname.slice(1)}/`;
    return `href="${target}${hash ? `#${hash}` : ""}"`;
  });
}

const downloaded = new Set();
const queue = [];

function enqueue(assetPath) {
  if (downloaded.has(assetPath) || queue.includes(assetPath)) return;
  queue.push(assetPath);
}

function collectAssets(text) {
  for (const match of text.matchAll(/["'(]\/(?:_next|images|fonts)\/[^"')\s]+/g)) {
    // Buang sisa escape JSON (\" pada data flight) dan query string.
    const assetPath = match[0].slice(1).split("?")[0].replace(/\\+$/, "");
    if (assetPath) enqueue(assetPath);
  }
}

async function drainQueue() {
  while (queue.length > 0) {
    const assetPath = queue.shift();
    if (downloaded.has(assetPath) || assetPath.endsWith(".js")) continue;
    downloaded.add(assetPath);

    const response = await fetch(`${BASE}${assetPath}`);
    if (!response.ok) {
      console.warn(`  ! ${assetPath} → ${response.status}`);
      continue;
    }

    const target = path.join(OUT, assetPath);
    await fs.mkdir(path.dirname(target), { recursive: true });

    if (assetPath.endsWith(".css")) {
      const css = await response.text();
      await fs.writeFile(target, css);
      collectAssets(css);
    } else {
      await fs.writeFile(target, Buffer.from(await response.arrayBuffer()));
    }
  }
}

async function buildPage(route) {
  const response = await get(route);
  if (!response.ok) throw new Error(`GET ${route} → ${response.status}`);

  const up = basePrefix(route);
  let html = unoptimizeImages(await response.text());
  collectAssets(html);
  html = rewriteAssets(html, up);
  html = rewritePageLinks(html, up);

  // Buang runtime Next.js: di GitHub Pages tidak ada server untuk /_next/image,
  // RSC payload, maupun API — hydration justru merusak atribut src gambar.
  html = html.replace(
    /<script[^>]+src="[^"]*_next\/static\/[^"]*"[^>]*>\s*<\/script>/g,
    "",
  );
  html = html.replace(/<link[^>]+rel="preload"[^>]+as="script"[^>]*>/g, "");
  html = html.replace("</body>", `${BANNER}</body>`);

  const target =
    route === "/" ? path.join(OUT, "index.html") : path.join(OUT, route, "index.html");
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, html);
  console.log(`✓ ${route} → ${path.relative(process.cwd(), target)}`);
}

async function main() {
  console.log(`Snapshot dari ${BASE} → ${OUT} (tautan relatif)`);
  await login();

  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(OUT, { recursive: true });

  for (const route of PAGES) await buildPage(route);
  await drainQueue();

  // .nojekyll: cegah Jekyll membuang folder berawalan garis bawah (_next).
  await fs.writeFile(path.join(OUT, ".nojekyll"), "");
  await fs.writeFile(
    path.join(OUT, "404.html"),
    `<!doctype html><meta charset="utf-8"><title>Halaman tidak ditemukan</title>
     <style>body{background:#0f0d0b;color:#f4eee2;font:400 15px/1.6 ui-sans-serif,system-ui;
     display:grid;place-items:center;min-height:100vh;margin:0;text-align:center}
     a{color:#c8a266}</style>
     <div><h1 style="font-size:28px;font-weight:400">404</h1>
     <p>Halaman ini hanya tersedia di demo statis.</p>
     <p><a href="${BASE_PATH}/">Kembali ke storefront</a></p></div>`,
  );

  console.log(`\n✓ Selesai: ${downloaded.size} aset, ${PAGES.length} halaman.`);
}

await main().catch((error) => {
  console.error(`✗ ${error.message}`);
  process.exit(1);
});
