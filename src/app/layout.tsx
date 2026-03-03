import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { HabitProvider } from "@/components/HabitProvider";
import AuthProvider from "@/components/AuthProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Life Tracker - Premium Habit & Productivity Tool",
  description: "A premium, Notion-style habit tracker that helps you stay on top of your habits and goals with deep analytics.",
  keywords: ["habit tracker", "productivity", "life tracker", "goals", "performance analytics"],
  authors: [{ name: "Likhon22" }],
  creator: "Likhon22",
  publisher: "Likhon22",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://life-tracker-opal.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Life Tracker',
    description: 'Track your habits and achieve your goals with premium analytics.',
    url: 'https://life-tracker-opal.vercel.app',
    siteName: 'Life Tracker',
    images: [
      {
        url: '/logo/logo_with_bg.jpg',
        width: 1200,
        height: 630,
        alt: 'Life Tracker Overview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Life Tracker',
    description: 'A premium habit tracking application.',
    images: ['/logo/logo_with_bg.jpg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Life Tracker',
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export const viewport = {
  themeColor: '#111111',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-[#111111] text-[#ededed] min-h-screen flex antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#191919',
                color: '#ededed',
                border: '1px solid #2d2d2d',
              },
            }}
          />
          {session && <Sidebar />}
          <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <HabitProvider>
              {children}
            </HabitProvider>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
