"use client";

import { useFinance } from "@/components/FinanceProvider";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addMonths, subMonths, parse } from "date-fns";

export function MonthSelector() {
    const { selectedMonth, setSelectedMonth } = useFinance();

    const date = parse(selectedMonth, "yyyy-MM", new Date());

    const handlePrev = () => {
        const newDate = subMonths(date, 1);
        setSelectedMonth(format(newDate, "yyyy-MM"));
    };

    const handleNext = () => {
        const newDate = addMonths(date, 1);
        setSelectedMonth(format(newDate, "yyyy-MM"));
    };

    return (
        <div className="flex items-center gap-4 bg-[#191919] border border-[#2d2d2d] rounded-2xl p-2 pr-6 shadow-lg self-center md:self-start">
            <div className="flex items-center gap-1">
                <button
                    onClick={handlePrev}
                    className="p-2 hover:bg-white/5 rounded-xl text-[#888888] hover:text-white transition-all cursor-pointer"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                    onClick={handleNext}
                    className="p-2 hover:bg-white/5 rounded-xl text-[#888888] hover:text-white transition-all cursor-pointer"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
            <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-black text-white tracking-tight min-w-[120px]">
                    {format(date, "MMMM yyyy")}
                </span>
            </div>
        </div>
    );
}
