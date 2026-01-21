import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Al Qadr Hifz Class",
  description: "Student portal for Hifz progress tracking",

  // ✅ Make sure this matches the file in /public (see notes below)
  manifest: "/manifest.webmanifest",

  applicationName: "Al Qadr",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Al Qadr",
  },

  // ✅ This fixes the browser tab icon (favicon)
  icons: {
    icon: [
      { url: "/favicon.ico" }, // browser tab icon
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport = {
  themeColor: "#9c7c38",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
