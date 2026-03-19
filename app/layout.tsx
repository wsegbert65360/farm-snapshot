import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Farm Command",
  description: "Daily farm snapshot - Grain, Weather, and Spray decisions",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/app-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <div className="max-w-md mx-auto px-2 py-2">
          {children}
        </div>
      </body>
    </html>
  );
}
