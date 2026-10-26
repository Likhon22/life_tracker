import { HabitCategory } from "@/models";

export const DEFAULT_HABIT_CATEGORIES = [
    { name: "Faith", icon: "Moon" },
    { name: "Career", icon: "Briefcase" },
    { name: "Business", icon: "TrendingUp" },
    { name: "Health", icon: "Dumbbell" },
    { name: "Relationships", icon: "Users" },
    { name: "Finance", icon: "Wallet" },
    { name: "Personal Growth", icon: "GraduationCap" },
    { name: "Self-Care", icon: "Scissors" },
    { name: "Productivity", icon: "CheckSquare" },
];

// Seeds the default categories for a user on first use and always returns their full category list.
export async function ensureHabitCategories(userId: string) {
    let categories = await HabitCategory.find({ userId });

    if (categories.length === 0) {
        const seeded = DEFAULT_HABIT_CATEGORIES.map((cat) => ({ ...cat, userId }));
        await HabitCategory.insertMany(seeded);
        categories = await HabitCategory.find({ userId });
    }

    return categories;
}
