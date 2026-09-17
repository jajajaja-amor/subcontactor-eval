import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_SC } from "next/font/google";

import { AppProviders } from "@/components/providers";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const sans = Noto_Sans_SC({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SubcontractOps",
    template: "%s · SubcontractOps",
  },
  description: "建筑分包商客服 Agent / Planner / Skill / Tool / Eval 运营平台",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
