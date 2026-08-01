"use client";

import { DailyGoals } from "@/components/goals/DailyGoals";
import { Target } from "lucide-react";
import { ModulePage } from "@/components/layout/ModulePage";

export default function GoalsPage() {
    return (
        <ModulePage
            title="Mission Control"
            subtitle="Define your daily execution and one-off targets."
            icon={Target}
            authDescription="Sign in to plan your daily missions and track your specific targets for each day."
        >
            <div className="w-full">
                <DailyGoals />
            </div>
        </ModulePage>
    );
}
