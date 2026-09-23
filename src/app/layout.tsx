import type { ReactNode } from "react";

import { Poppins } from "next/font/google";

import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { BarangayScopeProvider } from "@/shared/providers/barangay-scope-provider";

import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "MATNOG BRGYS",
  description: "Barangay Affairs staff workspace for the Municipality of Matnog.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={poppins.variable}>
        <BarangayScopeProvider>
          <AppShell>{children}</AppShell>
        </BarangayScopeProvider>
      </body>
    </html>
  );
}
