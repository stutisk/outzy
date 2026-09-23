import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Outzy",
  description: "Discover people to explore with.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}