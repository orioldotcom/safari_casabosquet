import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Safari Cooperatiu · MVP",
  description:
    "Un safari familiar al Serengeti: condueix, fotografia els animals i torna al camp base.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ca">
      <body>{children}</body>
    </html>
  );
}
