"use client";

import { useSession } from "next-auth/react";
import { DailyGoals } from "@/components/DailyGoals";
import { Target } from "lucide-react";
import { ModulePage } from "@/components/ModulePage";

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
