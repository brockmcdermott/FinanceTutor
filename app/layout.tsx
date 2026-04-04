import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthButton } from "@/components/auth-button";
import { ProfileProvider } from "@/contexts/profile-context";
import Link from "next/link";
import { Suspense } from "react";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Finance Teacher Tutor Prototype",
  description:
    "A scenario-based AI tutoring prototype for foundational business finance and accounting.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} antialiased`}>
        <ProfileProvider>
          <nav className="w-full border-b border-slate-200 bg-white/90 backdrop-blur-sm">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 text-sm sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <Link href="/" className="text-base font-semibold text-slate-900">
                  Finance Teacher
                </Link>
                <div className="hidden items-center gap-3 text-slate-600 sm:flex">
                  <Link href="/dashboard" className="hover:text-slate-900">
                    Dashboard
                  </Link>
                  <Link href="/topics" className="hover:text-slate-900">
                    Topics
                  </Link>
                  <Link href="/practice" className="hover:text-slate-900">
                    Practice
                  </Link>
                </div>
              </div>
              <Suspense>
                <AuthButton />
              </Suspense>
            </div>
          </nav>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </ProfileProvider>
      </body>
    </html>
  );
}
