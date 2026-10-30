import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: [
    {
      path: "../../public/fonts/inter-latin.woff2",
      weight: "300 700",
      style: "normal",
    },
  ],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = localFont({
  src: [
    {
      path: "../../public/fonts/fraunces-latin.woff2",
      weight: "300 700",
      style: "normal",
    },
    {
      path: "../../public/fonts/fraunces-italic-latin.woff2",
      weight: "300 700",
      style: "italic",
    },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tahuraboots.co"),
  title: {
    default: "Tahura Boots Company — Hand-welted boots from Bandung",
    template: "%s · Tahura Boots Company",
  },
  description:
    "Hand-welted leather boots made in Bandung, Indonesia. Tochigi vachetta, Horween Chromexcel and Shinki Hikaru horsebutt, built to be resoled for life. Ships worldwide.",
  keywords: [
    "Tahura Boots",
    "Bandung boots",
    "hand-welted boots",
    "Goodyear welt",
    "Indonesian bootmaker",
    "made to order boots",
  ],
  openGraph: {
    title: "Tahura Boots Company — Hand-welted boots from Bandung",
    description:
      "Boots built to outlive the trend. Hand-welted in Bandung, worn in 40+ countries.",
    type: "website",
    images: [{ url: "/images/boot-olive.jpg", width: 1024, height: 1280 }],
  },
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%230f0d0b'/%3E%3Ctext x='32' y='44' font-family='Georgia,serif' font-size='34' fill='%23c8a266' text-anchor='middle'%3ET%3C/text%3E%3C/svg%3E",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0d0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="bg-ink text-paper antialiased">{children}</body>
    </html>
  );
}
