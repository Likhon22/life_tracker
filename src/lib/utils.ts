import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function evaluateMath(input: string): number {
    try {
        // Remove spaces and any non-math characters except numbers, operators, and dots
        const clean = input.replace(/[^-0-9+*/.]/g, '');
        if (!clean) return 0;

        // Use Function constructor for simple evaluation
        // eslint-disable-next-line no-new-func
        const result = new Function(`return ${clean}`)();
        const num = parseFloat(result);
        return isNaN(num) ? 0 : num;
    } catch {
        return parseFloat(input) || 0;
    }
}
