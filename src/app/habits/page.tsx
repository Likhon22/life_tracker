"use client";

import { useSession } from "next-auth/react";
import { HabitList } from "@/components/HabitList";
import { AnalyticsSidebar } from "@/components/AnalyticsSidebar";
import { PerformanceChart } from "@/components/PerformanceChart";
import { CheckSquare } from "lucide-react";
import { ModulePage } from "@/components/ModulePage";

export default function HabitsPage() {
  const { data: session } = useSession();

  return (
    <ModulePage
      title="Habit Tracker"
      subtitle={`Welcome back, ${session?.user?.name}. Here is a snapshot of your daily progress.`}
      icon={CheckSquare}
      authDescription="Sign in to start tracking your daily habits, visualizing your progress, and building a better routine."
    >
      <div className="grid grid-cols-1 md:grid-cols-[320px_280px_1fr] gap-4 md:gap-6 items-start transition-all">
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
    </ModulePage>
  );
}
