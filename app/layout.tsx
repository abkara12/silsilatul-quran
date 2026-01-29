import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Al-Qadr Hifdh Class",
    template: "%s | Al-Qadr Hifdh Class",
  },
  description: "Al-Qadr Hifdh Class • Northcliff",
  applicationName: "Al-Qadr Hifdh Class",
  manifest: "/manifest.webmanifest",

  icons: {
    icon: [
    { url: "/icons/favicon.ico" }, // IMPORTANT: put favicon.ico in /public (root)
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      // iPhone add-to-home-screen icon fallback
      { url: "/icon-192.png", type: "image/png" },
    ],
    shortcut: ["/icon-192.png"],
  },

  themeColor: "#0b0b0b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
