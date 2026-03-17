import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Farm Command",
  description: "Daily farm snapshot - Grain, Weather, and Spray decisions",
  icons: "/favicon.svg",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Farm Command</h1>
            <p className="text-slate-600 mt-1">Daily Farm Snapshot</p>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
