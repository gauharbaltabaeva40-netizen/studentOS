import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudentOS — Студенттік өмірің бір жерде",
  description: "Сабақ, тапсырма, қаржы және мақсаттар — StudentOS.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="kk">
      <body className="antialiased">{children}</body>
    </html>
  );
}
