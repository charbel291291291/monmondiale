import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mondial2026",
  description: "World Cup 2026 live matches, results, goals, assists, scorers and standings.",
  manifest: "/manifest.json",
  themeColor: "#07111f",
  appleWebApp: {
    capable: true,
    title: "Mondial2026",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: "/apple-touch-icon.png",
  },
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