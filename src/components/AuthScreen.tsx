"use client";

import { signIn } from "next-auth/react";
import { LucideIcon } from "lucide-react";

interface AuthScreenProps {
    title: string;
    description: string;
    icon: LucideIcon;
}

export function AuthScreen({ title, description, icon: Icon }: AuthScreenProps) {
    return (
        <div className="flex-1 h-full bg-[#111111] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 mb-6 drop-shadow-[0_0_25px_rgba(59,130,246,0.3)] bg-[#191919] p-4 rounded-3xl border border-[#2d2d2d]">
                <Icon className="w-full h-full text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 text-balance capitalize tracking-tight">{title}</h1>
            <p className="text-[#888888] max-w-sm mb-8 font-medium leading-relaxed">
                {description}
            </p>
            <button
                onClick={() => signIn("google")}
                className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-xl font-bold transition-all active:scale-95 cursor-pointer shadow-lg shadow-white/5"
            >
                Continue with Google
            </button>
        </div>
    );
}
