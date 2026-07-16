import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Housing Intelligence Portal",
  description: "Unified portal for property valuation and market analysis demos"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
