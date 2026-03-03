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
        <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6">
          <Target className="w-8 h-8 text-blue-500" />
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
      <header className="flex-none px-12 pt-12 pb-6 max-w-7xl mx-auto w-full">
        <div className="flex items-end gap-6 mb-2">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Habit Tracker Overview</h1>
            <p className="text-[#888888] text-sm">Welcome back, {session.user?.name}. Here is a snapshot of your daily progress.</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 px-12 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-[300px_250px_1fr] gap-8 pb-12 items-start">
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
