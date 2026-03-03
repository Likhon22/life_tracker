"use client";

import { HabitList } from "@/components/HabitList";
import { AnalyticsSidebar } from "@/components/AnalyticsSidebar";
import { PerformanceChart } from "@/components/PerformanceChart";
import { useSession, signIn } from "next-auth/react";
import { Target } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="flex-1 h-full bg-[#111111] flex items-center justify-center text-[#888888]">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="flex-1 h-full bg-[#111111] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 mb-6 drop-shadow-[0_0_25px_rgba(59,130,246,0.3)] bg-[#191919] p-4 rounded-3xl border border-[#2d2d2d]">
          <img
            src="/logo/logo_with_bg-removebg-preview.png"
            alt="LifeTracker Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Welcome to LifeTracker</h1>
        <p className="text-[#888888] max-w-md mb-8">
          Sign in to start tracking your daily habits, visualizing your progress, and building a better routine.
        </p>
        <button
          onClick={() => signIn("google")}
          className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer"
        >
          Continue with Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111111] overflow-y-auto">
      {/* Header */}
      <header className="flex-none px-6 pt-10 pb-4 w-full">
        <div className="flex items-end gap-6 mb-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-white tracking-tight">Habit Tracker Overview</h1>
            <p className="text-[#888888] text-sm">Welcome back, {session.user?.name}. Here is a snapshot of your daily progress.</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 px-16 w-full grid grid-cols-1 md:grid-cols-[320px_280px_1fr] gap-6 pb-12 items-start transition-all">
        {/* Left Column: Habit List */}
        <section className="col-span-1">
          <HabitList />
        </section>

        {/* Middle Column: Analytics */}
        <section className="col-span-1 border border-[#2d2d2d] rounded-lg bg-[#191919] p-4">
          <AnalyticsSidebar />
        </section>

        {/* Right Column: Chart */}
        <section className="col-span-1">
          <PerformanceChart />
        </section>
      </div>
    </div>
  );
}
