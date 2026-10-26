"use client";

import { useSession } from "next-auth/react";
import { CigaretteProvider } from "@/components/cigarettes/CigaretteProvider";
import { LogEntryForm } from "@/components/cigarettes/LogEntryForm";
import { CigaretteStats } from "@/components/cigarettes/CigaretteStats";
import { LogList } from "@/components/cigarettes/LogList";
import { Cigarette } from "lucide-react";
import { ModulePage } from "@/components/layout/ModulePage";

export default function CigarettesPage() {
    const { data: session } = useSession();

    return (
        <CigaretteProvider>
            <ModulePage
                title="Cigarette Tracker"
                subtitle={`Logging keeps the cost in Finance in sync, ${session?.user?.name}.`}
                icon={Cigarette}
                authDescription="Sign in to log cigarettes, track consumption, and keep the cost synced with Finance."
            >
                <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 md:gap-8 items-start">
                    {/* Left Column: Entry form */}
                    <div className="flex flex-col space-y-6 md:space-y-8">
                        <LogEntryForm />
                    </div>

                    {/* Right Column: Stats & recent logs */}
                    <div className="space-y-6 md:space-y-8">
                        <CigaretteStats />
                        <LogList />
                    </div>
                </div>
            </ModulePage>
        </CigaretteProvider>
    );
}
