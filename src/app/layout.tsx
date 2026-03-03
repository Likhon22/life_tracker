import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { HabitProvider } from "@/components/HabitProvider";
import AuthProvider from "@/components/AuthProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Habit Tracker",
  description: "A premium, Notion-style habit tracker",
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
