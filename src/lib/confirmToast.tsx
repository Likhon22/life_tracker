"use client";

import toast from "react-hot-toast";

interface ConfirmToastOptions {
    message: string;
    description?: string;
    confirmLabel?: string;
    onConfirm: () => void;
}

export function confirmToast({ message, description, confirmLabel = "Delete", onConfirm }: ConfirmToastOptions) {
    toast((t) => (
        <div className="flex flex-col gap-3 min-w-[200px]">
            <p className="text-sm font-medium text-[#ededed]">
                {message}
                {description && (
                    <span className="block text-xs text-[#888888] font-normal mt-1 italic">{description}</span>
                )}
            </p>
            <div className="flex justify-end gap-2 border-t border-[#2d2d2d] pt-2">
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="px-2 py-1 text-xs text-[#888888] hover:text-[#ededed] cursor-pointer"
                >
                    Cancel
                </button>
                <button
                    onClick={() => { onConfirm(); toast.dismiss(t.id); }}
                    className="px-2 py-1 text-xs bg-red-500/10 text-red-500 border border-red-500/20 rounded hover:bg-red-500 hover:text-white transition-all cursor-pointer font-medium"
                >
                    {confirmLabel}
                </button>
            </div>
        </div>
    ), { duration: 6000, position: 'top-center' });
}
