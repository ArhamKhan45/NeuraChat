import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Menu } from "lucide-react";

import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AppSidebar from "@/components/my/AppSidebar";
import { ModeToggle } from "@/components/theme-toggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NeuraChat",
    template: "%s | NeuraChat",
  },
  description:
    "A production-ready multi-agent AI chatbot with context-aware and knowledge-grounded conversations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider
            style={
              {
                "--sidebar-width": "18rem",
                "--sidebar-width-icon": "4.5rem",
              } as React.CSSProperties
            }
          >
            <AppSidebar />

            <SidebarInset className="flex h-screen flex-col overflow-hidden">
              <header className="flex h-14 shrink-0 items-center justify-between px-4">
                <SidebarTrigger
                  size="icon-lg"
                  icon={<Menu className="size-5" />}
                  className="min-[767px]:hidden"
                />

                <div className="ml-auto">
                  <ModeToggle />
                </div>
              </header>

              <main className="flex-1 overflow-y-auto p-4">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
