import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ViralFlow • AI Marketing Co-Pilot",
  description: "The AI-powered SaaS that turns your brand into a viral machine. Real-time campaign intelligence, competitor spying, and AI-generated viral hooks.",
  icons: {
    icon: "/favicon.ico",
  },
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
